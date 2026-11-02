// src/app/api/payments/click/invoice/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { clickPayment } from '@/lib/payments/click'
import { getPlanPrice } from '@/lib/constants/plans'
import { parsePaymentOrder } from '@/lib/payments/common'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (supports Supabase email auth and phone OTP session)
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 })
    }

    const body = await request.json()
    const { phoneNumber, planType, billingCycle = 'monthly', type = 'subscription', credits } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Telefon raqam kiritilishi shart' },
        { status: 400 }
      )
    }

    // 2. Calculate amount & transaction id
    let amount = 0
    let transactionId = ''

    if (type === 'sms') {
      amount = Number(body.amount) || 0
      if (!amount || !credits) {
        return NextResponse.json({ error: 'SMS paketi summasi xato' }, { status: 400 })
      }
      transactionId = `${profile.id}_sms_${credits}_${Date.now()}`
    } else {
      amount = getPlanPrice(planType, billingCycle)
      transactionId = `${profile.id}_${planType}_${billingCycle}_${Date.now()}`
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '')

    // 3. Call Click Merchant API /invoice/create
    const result = await clickPayment.createInvoice({
      phoneNumber: cleanPhone,
      amount,
      merchantTransId: transactionId,
    })

    if (result.error_code !== 0) {
      console.error('❌ Click /invoice/create failed:', result)
      return NextResponse.json(
        {
          error: result.error_note || 'Hisob-fakturani chiqarib bo\'lmadi. Telefon raqamini tekshiring.',
          error_code: result.error_code,
        },
        { status: 400 }
      )
    }

    // 4. Save pending record in database
    const adminSupabase = createAdminClient()
    const parsedOrder = parsePaymentOrder(transactionId)
    await adminSupabase.from('payment_transactions').insert({
      user_id: profile.id,
      provider: 'click',
      amount,
      status: 'pending',
      external_id: String(result.invoice_id || transactionId),
      external_data: {
        ...result,
        phoneNumber: cleanPhone,
        order: parsedOrder,
      },
    })

    return NextResponse.json({
      success: true,
      invoiceId: result.invoice_id,
      transactionId,
      amount,
    })
  } catch (err: any) {
    console.error('❌ Error in /invoice/create:', err)
    return NextResponse.json(
      { error: err?.message || 'Tizimda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
