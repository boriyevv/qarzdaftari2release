// src/app/api/payments/uzum/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uzumPayment } from '@/lib/payments/uzum'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 Uzum webhook received:', body)

    const response = await uzumPayment.handleNotification(body)

    // If payment completed, update subscription
    if (body.status === 'completed' && response.status === 'success') {
      await updateSubscription(body)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Uzum webhook error:', error)
    return NextResponse.json({
      status: 'error',
      error_code: -9,
      error_message: 'System error',
    })
  }
}

async function updateSubscription(params: any) {
  try {
    const supabase = await createClient()
    
    // Parse order ID: userId_planType_timestamp
    const [userId, planType] = params.order_id.split('_')
    
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
        provider: 'uzum',
        amount: params.amount,
        status: 'completed',
        external_id: params.transaction_id,
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
        payment_provider: 'uzum',
        payment_transaction_id: transactionData?.id,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    console.log('✅ Subscription updated successfully')
  } catch (error) {
    console.error('❌ Update subscription error:', error)
  }
}