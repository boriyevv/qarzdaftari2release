// src/lib/payments/common.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface ParsedPaymentOrder {
  userId: string
  type: 'subscription' | 'sms'
  planType?: 'PLUS' | 'PRO'
  billingCycle?: 'monthly' | 'semi_annual' | 'annual'
  credits?: number
  timestamp?: number
}

/**
 * Parses transaction order identifiers from payment gateway webhooks.
 * Supports formats:
 * - ${userId}_${planType}_${billingCycle}_${timestamp}
 * - ${userId}_sms_${credits}_${timestamp}
 * - ${userId}_${planType}_${timestamp}
 * - Also handles legacy double-prefixed IDs gracefully.
 */
export function parsePaymentOrder(rawParam: string, fallbackUserId?: string): ParsedPaymentOrder | null {
  if (!rawParam) return null

  let parts = rawParam.split('_')

  // Clean duplicate user prefix if double-wrapped
  if (parts.length >= 2 && parts[0] === parts[1]) {
    parts = parts.slice(1)
  }

  let userId = parts[0]
  let startIndex = 1

  // If first segment is actually the plan or sms tag and fallbackUserId is provided
  if (
    fallbackUserId &&
    (parts[0] === 'sms' ||
      parts[0]?.toUpperCase() === 'PLUS' ||
      parts[0]?.toUpperCase() === 'PRO' ||
      parts[0]?.toUpperCase() === 'FREE')
  ) {
    userId = fallbackUserId
    startIndex = 0
  }

  const secondPart = parts[startIndex]?.toLowerCase()
  if (secondPart === 'sms') {
    const credits = parseInt(parts[startIndex + 1] || '0', 10)
    const timestamp = parseInt(parts[startIndex + 2] || '0', 10) || undefined
    return {
      userId,
      type: 'sms',
      credits: isNaN(credits) ? 0 : credits,
      timestamp,
    }
  }

  // Subscription order
  const planType = (parts[startIndex] || 'PLUS').toUpperCase() as 'PLUS' | 'PRO'
  const billingCycle = (parts[startIndex + 1] || 'monthly').toLowerCase() as
    | 'monthly'
    | 'semi_annual'
    | 'annual'
  const timestamp = parseInt(parts[startIndex + 2] || '0', 10) || undefined

  return {
    userId,
    type: 'subscription',
    planType: ['PLUS', 'PRO'].includes(planType) ? planType : 'PLUS',
    billingCycle: ['monthly', 'semi_annual', 'annual'].includes(billingCycle)
      ? billingCycle
      : 'monthly',
    timestamp,
  }
}

/**
 * Calculates correct subscription expiry date based on billing cycle.
 */
export function calculateSubscriptionExpiry(
  billingCycle: string = 'monthly',
  startDate: Date = new Date()
): Date {
  const expiresAt = new Date(startDate)
  switch (billingCycle) {
    case 'annual':
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      break
    case 'semi_annual':
      expiresAt.setMonth(expiresAt.getMonth() + 6)
      break
    case 'monthly':
    default:
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      break
  }
  return expiresAt
}

export interface ProcessPaymentParams {
  provider: 'click' | 'payme' | 'uzum'
  order: ParsedPaymentOrder
  amount: number
  externalId: string
  externalData: any
  transactionRecordId?: string | number
}

/**
 * Unified processor for successful payments (Click, Payme, Uzum).
 * - Enforces idempotency
 * - Activates subscriptions with accurate duration
 * - Credits SMS balance when order is SMS purchase
 * - Updates payment_transactions & audit logs
 */
export async function processSuccessfulPayment(
  supabase: SupabaseClient<any, any, any>,
  params: ProcessPaymentParams
) {
  const { provider, order, amount, externalId, externalData, transactionRecordId } = params
  const { userId, type } = order

  // 1. Idempotency check: Skip if already completed
  const { data: existingTx } = await supabase
    .from('payment_transactions')
    .select('id, status')
    .eq('external_id', externalId)
    .eq('status', 'completed')
    .maybeSingle()

  if (existingTx) {
    console.log(`⚠️ Payment ${externalId} already completed, skipping duplicate processing.`)
    return { success: true, duplicate: true }
  }

  // 2. Update or insert transaction record in payment_transactions
  let finalTxId = transactionRecordId
  if (transactionRecordId) {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        amount: amount,
        external_data: externalData,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transactionRecordId)
  } else {
    // Check if pending transaction exists
    const { data: pendingTx } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle()

    if (pendingTx) {
      finalTxId = pendingTx.id
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          amount: amount,
          external_data: externalData,
          completed_at: new Date().toISOString(),
        })
        .eq('id', pendingTx.id)
    } else {
      const { data: insertedTx } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          provider,
          amount,
          status: 'completed',
          external_id: externalId,
          external_data: externalData,
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()
      finalTxId = insertedTx?.id
    }
  }

  // 3. Process based on purchase type
  if (type === 'sms') {
    const creditsToAdd = order.credits || 0
    console.log(`📱 Crediting ${creditsToAdd} SMS credits to user ${userId}`)

    // Update user's sms_credits
    const { data: existingCredits } = await supabase
      .from('sms_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingCredits) {
      const currentBalance = (existingCredits as any).balance ?? 0
      const currentPurchased = (existingCredits as any).total_purchased ?? 0
      await supabase
        .from('sms_credits')
        .update({
          balance: currentBalance + creditsToAdd,
          total_purchased: currentPurchased + creditsToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase.from('sms_credits').insert({
        user_id: userId,
        balance: creditsToAdd,
        total_purchased: creditsToAdd,
        total_used: 0,
      })
    }

    // Insert purchase record into sms_credit_purchases for history
    try {
      await supabase.from('sms_credit_purchases').insert({
        user_id: userId,
        credits: creditsToAdd,
        amount,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('⚠️ Could not insert into sms_credit_purchases:', e)
    }

    // Audit log
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'sms_credits_purchased',
      entity_type: 'sms_credits',
      metadata: {
        credits: creditsToAdd,
        amount,
        provider,
        external_id: externalId,
      },
    })

    return { success: true, type: 'sms', credits: creditsToAdd }
  } else {
    // Subscription payment
    const planType = (order.planType || 'PLUS').toUpperCase()
    const billingCycle = order.billingCycle || 'monthly'
    const expiresAt = calculateSubscriptionExpiry(billingCycle)

    console.log(
      `📝 Activating subscription: user=${userId}, plan=${planType}, cycle=${billingCycle}, expires=${expiresAt.toISOString()}`
    )

    // Update user plan and status
    const { error: userError } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        last_payment_date: new Date().toISOString(),
      })
      .eq('id', userId)

    if (userError) {
      console.error('❌ User subscription update error:', userError)
      throw userError
    }

    // Deactivate previous active subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')

    // Create new subscription entry
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_type: planType,
      billing_cycle: billingCycle,
      status: 'active',
      amount,
      currency: 'UZS',
      payment_provider: provider,
      payment_transaction_id: finalTxId || null,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    // Audit log
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'subscription_activated',
      entity_type: 'subscription',
      metadata: {
        plan_type: planType,
        billing_cycle: billingCycle,
        amount,
        provider,
        external_id: externalId,
      },
    })

    return { success: true, type: 'subscription', planType, billingCycle }
  }
}
