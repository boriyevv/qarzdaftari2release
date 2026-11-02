// src/app/api/payments/click/card/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { clickPayment } from '@/lib/payments/click'
import { getPlanPrice } from '@/lib/constants/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (supports Supabase email auth and phone OTP session)
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 })
    }

    const body = await request.json()
    const { cardNumber, expireDate, planType, billingCycle = 'monthly', type = 'subscription', credits } = body

    if (!cardNumber || !expireDate) {
      return NextResponse.json(
        { error: 'Karta raqami va amal qilish muddati kiritilishi shart' },
        { status: 400 }
      )
    }

    // 2. Calculate amount
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

    // 3. Call Click Merchant API /card/create
    const cleanCard = String(cardNumber).replace(/\D/g, '')
    const cleanExpire = String(expireDate).replace(/\D/g, '')

    const result = await clickPayment.createCardToken({
      cardNumber: cleanCard,
      expireDate: cleanExpire,
      temporary: 1,
    })

    if (result.error_code !== 0) {
      console.error('❌ Click /card/create failed:', result)
      return NextResponse.json(
        {
          error: result.error_note || 'Kartani ro\'yxatdan o\'tkazib bo\'lmadi. Kartani tekshiring.',
          error_code: result.error_code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cardToken: result.card_token,
      phone: result.phone,
      transactionId,
      amount,
    })
  } catch (err: any) {
    console.error('❌ Error in /card/create:', err)
    return NextResponse.json(
      { error: err?.message || 'Tizimda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
