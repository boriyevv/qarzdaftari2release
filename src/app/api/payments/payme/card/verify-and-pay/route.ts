// src/app/api/payments/payme/card/verify-and-pay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { paymePayment } from '@/lib/payments/payme'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 })
    }

    const body = await request.json()
    const { cardToken, smsCode, transactionId, amount, planType } = body

    if (!cardToken || !smsCode || !transactionId || !amount) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi shart' },
        { status: 400 }
      )
    }

    // 2. Verify Card with OTP and process payment via Payme
    const payResult = await paymePayment.verifyAndPayCard({
      cardToken,
      smsCode,
      amount: Number(amount),
      transactionId,
      userId: profile.id,
      planType,
    })

    if (!payResult.success) {
      console.error('❌ Payme card verify & pay failed:', payResult)
      return NextResponse.json(
        {
          error: payResult.error || 'To\'lovni amalga oshirib bo\'lmadi',
          error_code: payResult.error_code,
        },
        { status: 400 }
      )
    }

    // 3. Fulfill order in Supabase
    const adminSupabase = createAdminClient()
    const parsedOrder = parsePaymentOrder(transactionId, profile.id)

    if (parsedOrder) {
      const paymentId = String(payResult.paymentId || Date.now())
      await processSuccessfulPayment(adminSupabase, {
        provider: 'payme',
        order: parsedOrder,
        amount: Number(amount),
        externalId: paymentId,
        externalData: {
          ...payResult,
          card_token: cardToken,
          transaction_id: transactionId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      paymentId: payResult.paymentId,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi!',
    })
  } catch (err: any) {
    console.error('❌ Error in /api/payments/payme/card/verify-and-pay:', err)
    return NextResponse.json(
      { error: err?.message || 'To\'lov jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
