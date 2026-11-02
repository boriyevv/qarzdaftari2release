// src/app/api/payments/click/card/verify-and-pay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { clickPayment } from '@/lib/payments/click'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (supports Supabase email auth and phone OTP session)
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 })
    }

    const body = await request.json()
    const { cardToken, smsCode, transactionId, amount } = body

    if (!cardToken || !smsCode || !transactionId || !amount) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi shart' },
        { status: 400 }
      )
    }

    // 2. Verify Card Token with SMS OTP
    const verifyResult = await clickPayment.verifyCardToken({
      cardToken,
      smsCode,
    })

    if (verifyResult.error_code !== 0) {
      console.error('❌ Click /card/verify failed:', verifyResult)
      return NextResponse.json(
        {
          error: verifyResult.error_note || 'SMS tasdiqlash kodi noto\'g\'ri',
          error_code: verifyResult.error_code,
        },
        { status: 400 }
      )
    }

    // 3. Process Payment with verified card token
    const payResult = await clickPayment.payWithCardToken({
      cardToken,
      amount: Number(amount),
      merchantTransId: transactionId,
    })

    if (payResult.error_code !== 0) {
      console.error('❌ Click /card/payment failed:', payResult)
      return NextResponse.json(
        {
          error: payResult.error_note || 'To\'lovni amalga oshirib bo\'lmadi (mablag\' yetarli emas yoki karta cheklangan)',
          error_code: payResult.error_code,
        },
        { status: 400 }
      )
    }

    // 4. Fulfill order in Supabase
    const adminSupabase = createAdminClient()
    const parsedOrder = parsePaymentOrder(transactionId)

    if (parsedOrder) {
      const paymentId = String(payResult.payment_id || Date.now())
      await processSuccessfulPayment(adminSupabase, {
        provider: 'click',
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
      paymentId: payResult.payment_id,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi!',
    })
  } catch (err: any) {
    console.error('❌ Error in /card/verify-and-pay:', err)
    return NextResponse.json(
      { error: err?.message || 'To\'lov jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
