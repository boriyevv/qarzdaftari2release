// src/app/api/payments/route.ts
// POST - Add payment to debt

import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createPaymentSchema = z.object({
  debt_id: z.string().uuid(),
  amount: z.number().positive('Summa musbat bo\'lishi kerak'),
  payment_date: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createPaymentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get debt and verify ownership
    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('id', result.data.debt_id)
      .eq('user_id', profile.id)
      .single()

    if (debtError || !debt) {
      return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 })
    }

    // Check if payment exceeds remaining amount
    const remaining = debt.amount - debt.paid_amount

    if (result.data.amount > remaining) {
      return NextResponse.json(
        { error: `To'lov summasi qoldiqdan oshib ketdi. Qoldiq: ${remaining} so'm` },
        { status: 400 }
      )
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        debt_id: result.data.debt_id,
        amount: result.data.amount,
        payment_date: result.data.payment_date || new Date().toISOString().split('T')[0],
        note: result.data.note,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment create error:', paymentError)
      return NextResponse.json({ error: 'To\'lov yaratishda xato' }, { status: 500 })
    }

    // Update debt paid_amount
    const newPaidAmount = debt.paid_amount + result.data.amount
    const newStatus = newPaidAmount >= debt.amount ? 'paid' : debt.status

    const { error: updateError } = await supabase
      .from('debts')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
      })
      .eq('id', result.data.debt_id)

    if (updateError) {
      console.error('Debt update error:', updateError)
      return NextResponse.json({ error: 'Qarz yangilashda xato' }, { status: 500 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Payment POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}