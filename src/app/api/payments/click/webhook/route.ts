// src/app/api/payments/click/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clickPayment } from '@/lib/payments/click'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 Click webhook received:', body)

    const { action } = body

    // Action 0: Prepare (check if payment can be made)
    if (action === 0) {
      const response = await clickPayment.handlePrepare(body)
      return NextResponse.json(response)
    }

    // Action 1: Complete (payment confirmed)
    if (action === 1) {
      const response = await clickPayment.handleComplete(body)
      
      // If payment successful, update subscription
      if (response.error === 0) {
        await updateSubscription(body)
      }
      
      return NextResponse.json(response)
    }

    return NextResponse.json({
      error: -3,
      error_note: 'Invalid action',
    })
  } catch (error) {
    console.error('❌ Click webhook error:', error)
    return NextResponse.json({
      error: -9,
      error_note: 'System error',
    })
  }
}

async function updateSubscription(params: any) {
  try {
    const supabase = await createClient()
    
    // Parse transaction ID: userId_planType_timestamp
    const [userId, planType] = params.merchant_trans_id.split('_')
    
    console.log('📝 Updating subscription:', { userId, planType })

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Update user plan
    await supabase
      .from('users')
      .update({
        plan_type: planType,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        last_payment_date: new Date().toISOString(),
      })
      .eq('id', userId)

    // Save payment transaction
    const { data: transactionData } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        provider: 'click',
        amount: params.amount,
        status: 'completed',
        external_id: params.click_trans_id,
        external_data: params,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Create subscription record
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        amount: params.amount,
        currency: 'UZS',
        payment_provider: 'click',
        payment_transaction_id: transactionData?.id,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    console.log('✅ Subscription updated successfully')

    // TODO: Send notification to user
    // TODO: Log activity
  } catch (error) {
    console.error('❌ Update subscription error:', error)
  }
}