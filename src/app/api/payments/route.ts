// src/app/api/payments/route.ts
// POST - Add payment to debt + optional SMS confirmation

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { smsService } from '@/lib/services/sms.service'
import { formatCurrency } from '@/lib/utils/currency'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createPaymentSchema = z.object({
  debt_id: z.string().uuid(),
  amount: z.number().positive('Summa musbat bo\'lishi kerak'),
  payment_date: z.string().optional(),
  note: z.string().optional(),
  send_confirmation_sms: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
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

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    // Get debt and verify ownership under active store
    const { data: debt, error: debtError } = await adminSupabase
      .from('debts')
      .select('*')
      .eq('id', result.data.debt_id)
      .eq('user_id', storeOwnerId)
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

    // Payment note with cashier attribution
    let paymentNote = result.data.note || ''
    if (profile.role === 'cashier') {
      const tag = `[Kassir: ${profile.full_name}]`
      paymentNote = paymentNote ? `${paymentNote} ${tag}` : tag
    }

    // Create payment
    const { data: payment, error: paymentError } = await adminSupabase
      .from('payments')
      .insert({
        debt_id: result.data.debt_id,
        amount: result.data.amount,
        payment_date: result.data.payment_date || new Date().toISOString().split('T')[0],
        note: paymentNote,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment create error:', paymentError)
      return NextResponse.json({ error: 'To\'lov yaratishda xato' }, { status: 500 })
    }

    // Update debt paid_amount
    const newPaidAmount = debt.paid_amount + result.data.amount
    const newRemaining = Math.max(0, debt.amount - newPaidAmount)
    const newStatus = newPaidAmount >= debt.amount ? 'paid' : debt.status

    const { error: updateError } = await adminSupabase
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

    // Optional: Send payment confirmation SMS
    let smsSent = false
    if (result.data.send_confirmation_sms && debt.debtor_phone && smsService.isConfigured()) {
      try {
        // Check remaining credits for the active store owner
        const { data: credits } = await adminSupabase
          .from('sms_credits')
          .select('credits, used_credits')
          .eq('user_id', storeOwnerId)

        const totalCredits = credits?.reduce((sum, c) => sum + c.credits, 0) || 0
        const usedCredits = credits?.reduce((sum, c) => sum + c.used_credits, 0) || 0
        const remainingCredits = totalCredits - usedCredits

        if (remainingCredits >= 1) {
          const storeTitle = profile.store_name || profile.full_name || 'Qarz Daftari'
          const formattedPay = formatCurrency(result.data.amount)
          const formattedRem = formatCurrency(newRemaining)
          const smsText = newRemaining === 0
            ? `Hurmatli ${debt.debtor_name}, ${formattedPay} to'lovingiz qabul qilindi va qarz to'liq yopildi. Ishonchingiz uchun rahmat! ${storeTitle}.`
            : `Hurmatli ${debt.debtor_name}, ${formattedPay} to'lovingiz qabul qilindi. Qoldiq qarz: ${formattedRem}. Rahmat! ${storeTitle}.`

          const externalId = await smsService.sendSMS(debt.debtor_phone, smsText)
          if (externalId) {
            await adminSupabase.rpc('deduct_sms_credit', { p_user_id: storeOwnerId, p_credits: 1 })
            await adminSupabase.from('sms_usage_log').insert({
              user_id: storeOwnerId,
              debt_id: debt.id,
              recipient_phone: debt.debtor_phone.replace(/[\s-]/g, ''),
              message: smsText,
              credits_used: 1,
              status: 'sent',
              external_id: externalId,
            })
            smsSent = true
          }
        }
      } catch (smsErr) {
        console.error('Payment confirmation SMS error:', smsErr)
      }
    }

    return NextResponse.json({
      payment,
      sms_sent: smsSent,
      new_paid_amount: newPaidAmount,
      new_remaining: newRemaining,
      new_status: newStatus,
    })
  } catch (error) {
    console.error('Payment POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
