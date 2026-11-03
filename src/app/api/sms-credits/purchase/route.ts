// src/app/api/sms-credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/middleware'
import { clickPayment } from '@/lib/payments/click'
import { paymePayment } from '@/lib/payments/payme'
import { uzumPayment } from '@/lib/payments/uzum'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    
    // Get current user (supports both Supabase email auth and phone OTP session)
    const profile = await getCurrentUser()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId, credits, amount, provider = 'click' } = body

    if (!credits || !amount) {
      return NextResponse.json(
        { error: 'Invalid package data' },
        { status: 400 }
      )
    }

    // Return URL
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sms-credits?payment=success`

    // Transaction ID: userId_sms_credits_timestamp
    const transactionId = `${profile.id}_sms_${credits}_${Date.now()}`

    // Generate payment URL
    let paymentUrl: string

    switch (provider) {
      case 'click':
      case 'click_card':
      case 'card':
        paymentUrl = clickPayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: 'sms',
          transactionId,
          returnUrl,
        })
        break

      case 'payme':
        paymentUrl = paymePayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: 'sms',
          transactionId,
          returnUrl,
        })
        break

      case 'uzum': {
        const uzumBaseUrl = process.env.UZUM_RETURN_BASE_URL || 'https://debtbook.uz'
        const uzumReturnUrl = `${uzumBaseUrl}/payment/uzum-callback?status=success`
        paymentUrl = await uzumPayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: 'sms',
          transactionId,
          returnUrl: uzumReturnUrl,
          supabase: adminSupabase,
        })
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid payment provider' },
          { status: 400 }
        )
    }

    // Log activity
    await adminSupabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'sms_credit_purchase_initiated',
      entity_type: 'sms_credits',
      metadata: {
        package_id: packageId,
        credits,
        amount,
        provider,
      },
    })

    return NextResponse.json({
      paymentUrl,
      provider,
      amount,
      credits,
    })
  } catch (error) {
    console.error('❌ SMS Purchase API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
