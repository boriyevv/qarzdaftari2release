// src/app/api/sms-credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clickPayment } from '@/lib/payments/click'
import { paymePayment } from '@/lib/payments/payme'
import { uzumPayment } from '@/lib/payments/uzum'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
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
        paymentUrl = clickPayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: transactionId,
          returnUrl,
        })
        break

      case 'payme':
        paymentUrl = paymePayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: transactionId,
          returnUrl,
        })
        break

      case 'uzum':
        paymentUrl = uzumPayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: transactionId,
          returnUrl,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid payment provider' },
          { status: 400 }
        )
    }

    // Log activity
    await supabase.from('activity_logs').insert({
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