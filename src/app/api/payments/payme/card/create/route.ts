// src/app/api/payments/payme/card/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { paymePayment } from '@/lib/payments/payme'
import { getPlanPrice } from '@/lib/constants/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 })
    }

    const body = await request.json()
    const {
      cardNumber,
      expireDate,
      planType = 'PLUS',
      billingCycle = 'monthly',
      type = 'subscription',
      credits,
    } = body

    if (!cardNumber || !expireDate) {
      return NextResponse.json(
        { error: 'Karta raqami va amal qilish muddati kiritilishi shart' },
        { status: 400 }
      )
    }

    // 2. Calculate amount & construct transactionId
    let amount = 0
    let transactionId = ''

    if (type === 'sms') {
      amount = Number(body.amount) || 0
      if (!amount || !credits) {
        return NextResponse.json({ error: 'SMS paketi summasi noto\'g\'ri' }, { status: 400 })
      }
      transactionId = `${profile.id}_sms_${credits}_${Date.now()}`
    } else {
      amount = getPlanPrice(planType, billingCycle)
      transactionId = `${profile.id}_${planType}_${billingCycle}_${Date.now()}`
    }

    // 3. Register card and request SMS code via Payme Subscribe API
    const result = await paymePayment.createCardToken({
      cardNumber,
      expireDate,
    })

    if (!result.success || !result.cardToken) {
      return NextResponse.json(
        {
          error: result.error || 'Kartani ro\'yxatdan o\'tkazib bo\'lmadi. Karta ma\'lumotlarini tekshiring.',
          error_code: result.error_code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cardToken: result.cardToken,
      phone: result.phone,
      transactionId,
      amount,
    })
  } catch (err: any) {
    console.error('❌ Error in /api/payments/payme/card/create:', err)
    return NextResponse.json(
      { error: err?.message || 'Tizimda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
