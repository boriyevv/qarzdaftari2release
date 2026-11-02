// src/app/api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/middleware'
import { uzumPayment } from '@/lib/payments/uzum'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    
    // Get current user (supports both email and phone OTP sessions)
    const profile = await getCurrentUser()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Auto-sync any pending Uzum transactions
    try {
      const { data: pendingUzumTx } = await adminSupabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('provider', 'uzum')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pendingUzumTx && uzumPayment.isConfigured()) {
        const orderId = pendingUzumTx.external_id || pendingUzumTx.external_data?.orderId
        if (orderId) {
          try {
            const uzumStatus = await uzumPayment.getOrderStatus(orderId)
            if (uzumStatus && (uzumStatus.status === 'COMPLETED' || uzumStatus.status === 'TOP_UP_COMPLETED')) {
              const parsedOrder = pendingUzumTx.external_data?.order || parsePaymentOrder(pendingUzumTx.external_data?.rawTransactionId)
              if (parsedOrder) {
                await processSuccessfulPayment(adminSupabase, {
                  provider: 'uzum',
                  order: parsedOrder,
                  amount: pendingUzumTx.amount,
                  externalId: orderId,
                  externalData: uzumStatus,
                  transactionRecordId: pendingUzumTx.id,
                })
                const { data: updatedProfile } = await adminSupabase
                  .from('users')
                  .select('id, plan_type, subscription_status, subscription_expires_at, last_payment_date')
                  .eq('id', profile.id)
                  .single()
                if (updatedProfile) {
                  profile.plan_type = updatedProfile.plan_type
                  profile.subscription_status = updatedProfile.subscription_status
                  profile.subscription_expires_at = updatedProfile.subscription_expires_at
                  profile.last_payment_date = updatedProfile.last_payment_date
                }
              }
            } else if (uzumStatus && ['DECLINED', 'REVERSED'].includes(uzumStatus.status)) {
              await adminSupabase
                .from('payment_transactions')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', pendingUzumTx.id)
            }
          } catch (uzumErr: any) {
            const errMsg = uzumErr?.message || String(uzumErr)
            if (errMsg.includes('3005') || errMsg.includes('not found') || errMsg.includes('rejected')) {
              console.warn(`⚠️ Uzum order ${orderId} not found or rejected. Marking transaction as cancelled.`)
              await adminSupabase
                .from('payment_transactions')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', pendingUzumTx.id)
            } else {
              console.warn('⚠️ Uzum getOrderStatus warning:', errMsg)
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('⚠️ Pending payment auto-sync warning:', syncErr)
    }

    // Get latest subscriptions
    const { data: subscriptions } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get payment history
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    // Check if subscription expired
    let isExpired = false
    if (profile.subscription_expires_at) {
      const expiresAt = new Date(profile.subscription_expires_at)
      isExpired = expiresAt < new Date()
    }

    // Calculate days remaining
    let daysRemaining = null
    if (profile.subscription_expires_at && !isExpired) {
      const expiresAt = new Date(profile.subscription_expires_at)
      const now = new Date()
      daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      subscription: {
        plan_type: profile.plan_type,
        status: isExpired ? 'expired' : profile.subscription_status,
        expires_at: profile.subscription_expires_at,
        last_payment_date: profile.last_payment_date,
        days_remaining: daysRemaining,
        is_expired: isExpired,
      },
      subscriptions: subscriptions || [],
      payments: payments || [],
    })
  } catch (error) {
    console.error('❌ Subscription API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}