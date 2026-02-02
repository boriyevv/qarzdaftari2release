// src/app/api/payments/payme/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { paymePayment } from '@/lib/payments/payme'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !paymePayment.verifyAuthorization(authHeader)) {
      return NextResponse.json({
        error: {
          code: -32504,
          message: 'Insufficient privilege',
        },
      })
    }

    const body = await request.json()
    
    console.log('🔔 Payme webhook received:', body)

    const { method, params } = body

    switch (method) {
      case 'CheckPerformTransaction':
        return NextResponse.json(await paymePayment.checkPerformTransaction(params))

      case 'CreateTransaction':
        return NextResponse.json(await paymePayment.createTransaction(params))

      case 'PerformTransaction':
        const performResult = await paymePayment.performTransaction(params)
        
        // Update subscription after successful payment
        if (performResult.result.state === 2) {
          await updateSubscription(params, 'payme')
        }
        
        return NextResponse.json(performResult)

      case 'CancelTransaction':
        return NextResponse.json(await paymePayment.cancelTransaction(params))

      case 'CheckTransaction':
        return NextResponse.json(await paymePayment.checkTransaction(params))

      case 'GetStatement':
        return NextResponse.json(await paymePayment.getStatement(params))

      default:
        return NextResponse.json({
          error: {
            code: -32601,
            message: 'Method not found',
          },
        })
    }
  } catch (error) {
    console.error('❌ Payme webhook error:', error)
    return NextResponse.json({
      error: {
        code: -32400,
        message: 'System error',
      },
    })
  }
}

async function updateSubscription(params: any, provider: string) {
  try {
    const supabase = await createClient()
    
    // Parse subscription ID from account
    const subscriptionId = params.account.subscription_id
    const [userId, planType] = subscriptionId.split('_')
    
    console.log('📝 Updating subscription:', { userId, planType, provider })

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Amount from tiyin to sum
    const amountSum = params.amount / 100

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
        provider,
        amount: amountSum,
        status: 'completed',
        external_id: params.id,
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
        amount: amountSum,
        currency: 'UZS',
        payment_provider: provider,
        payment_transaction_id: transactionData?.id,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    console.log('✅ Subscription updated successfully')
  } catch (error) {
    console.error('❌ Update subscription error:', error)
  }
}