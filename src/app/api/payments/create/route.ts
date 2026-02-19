// src/app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clickPayment } from '@/lib/payments/click'
import { paymePayment } from '@/lib/payments/payme'
import { uzumPayment } from '@/lib/payments/uzum'
import { getPlanPrice, BILLING_CYCLE_MONTHS, getDiscount } from '@/lib/constants/plans'

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
      .select('id, plan_type')
      .eq('auth_id', user.id)
      .single()

      console.log('📋 Profile:', profile, '| Plan:', profile?.plan_type)

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('📦 Body:', body)
    const { planType, provider = 'click', billingCycle = 'monthly' } = body

    // Validate plan
    if (!['PLUS', 'PRO'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Validate billing cycle
    if (!['monthly', 'semi_annual', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      )
    }

    // Check if trying to downgrade
    if (profile.plan_type === 'PRO' && planType === 'PLUS') {
      return NextResponse.json(
        { error: 'Cannot downgrade plan' },
        { status: 400 }
      )
    }

    // Get plan price with billing cycle
    const amount = getPlanPrice(planType as any, billingCycle as any)
    const discount = getDiscount(planType as any, billingCycle as any)
    const months = BILLING_CYCLE_MONTHS[billingCycle as keyof typeof BILLING_CYCLE_MONTHS]

    // Return URL
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`

    // Generate payment URL based on provider
    let paymentUrl: string

    // Transaction metadata includes billing cycle
    const transactionId = `${profile.id}_${planType}_${billingCycle}_${Date.now()}`

    switch (provider) {
      case 'click':
        paymentUrl = clickPayment.generatePaymentUrl({
          amount,
          userId: profile.id,
          planType: transactionId, // Include billing cycle in transaction ID
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
      action: 'payment_initiated',
      entity_type: 'subscription',
      metadata: {
        plan_type: planType,
        billing_cycle: billingCycle,
        amount,
        discount_amount: discount.amount,
        discount_percentage: discount.percentage,
        months,
        provider,
      },
    })

    return NextResponse.json({
      paymentUrl,
      provider,
      amount,
      planType,
      billingCycle,
      discount,
      months,
    })
  } catch (error) {
    console.error('❌ Payment create error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}