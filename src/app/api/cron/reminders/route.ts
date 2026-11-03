// src/app/api/cron/reminders/route.ts
// Background CRON endpoint to auto-send reminders for debts due within 3 days or overdue

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { smsService } from '@/lib/services/sms.service'
import { formatCurrency } from '@/lib/utils/currency'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Basic auth check for CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const urlKey = request.nextUrl.searchParams.get('key')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlKey !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
    }

    if (!smsService.isConfigured()) {
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 503 })
    }

    const adminSupabase = createAdminClient()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. Fetch all active debts where due_date <= 3 days later
    const { data: debts, error: debtsError } = await adminSupabase
      .from('debts')
      .select(`
        id,
        user_id,
        debtor_name,
        debtor_phone,
        amount,
        paid_amount,
        due_date,
        status,
        users:user_id (
          id,
          store_name,
          full_name,
          plan_type
        )
      `)
      .neq('status', 'paid')
      .not('due_date', 'is', null)
      .lte('due_date', threeDaysLater)

    if (debtsError) {
      return NextResponse.json({ error: debtsError.message }, { status: 500 })
    }

    let processedCount = 0
    let sentCount = 0
    let skippedCount = 0

    // Cache user credits during cron run
    const userCreditsCache = new Map<string, number>()

    for (const debt of (debts as any[]) || []) {
      const remaining = debt.amount - debt.paid_amount
      if (remaining <= 0 || !debt.debtor_phone) continue

      processedCount++
      const userId = debt.user_id

      // Check user's cached credits
      if (!userCreditsCache.has(userId)) {
        const { data: credits } = await adminSupabase
          .from('sms_credits')
          .select('credits, used_credits')
          .eq('user_id', userId)

        const total = credits?.reduce((sum, c) => sum + c.credits, 0) || 0
        const used = credits?.reduce((sum, c) => sum + c.used_credits, 0) || 0
        userCreditsCache.set(userId, Math.max(0, total - used))
      }

      const availableCredits = userCreditsCache.get(userId) || 0
      if (availableCredits < 1) {
        skippedCount++
        continue
      }

      // Check if SMS was sent in the last 24h to this debt
      const { data: recentLogs } = await adminSupabase
        .from('sms_usage_log')
        .select('id')
        .eq('debt_id', debt.id)
        .gte('created_at', yesterday)
        .limit(1)

      if (recentLogs && recentLogs.length > 0) {
        skippedCount++
        continue
      }

      const dueDate = new Date(debt.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      const isOverdue = diffDays < 0
      const formattedRem = formatCurrency(remaining)
      const dateStr = dueDate.toLocaleDateString('uz-UZ')
      const storeTitle = debt.users?.store_name || debt.users?.full_name || 'Qarz Daftari'

      const message = isOverdue
        ? `Hurmatli ${debt.debtor_name}, sizning ${formattedRem} so'm qarz to'lov muddati (${dateStr}) o'tgan. Iltimos, to'lashingizni so'raymiz. ${storeTitle}.`
        : diffDays === 0
        ? `Hurmatli ${debt.debtor_name}, bugun sizning ${formattedRem} so'm qarz to'lov muddatingiz. Iltimos to'lovni amalga oshiring. ${storeTitle}.`
        : `Hurmatli ${debt.debtor_name}, ${formattedRem} so'm qarz to'lov muddati ${dateStr} sanasiga belgilangan (${diffDays} kun qoldi). ${storeTitle}.`

      try {
        const externalId = await smsService.sendSMS(debt.debtor_phone, message)
        if (externalId) {
          await adminSupabase.rpc('deduct_sms_credit', { p_user_id: userId, p_credits: 1 })
          await adminSupabase.from('sms_usage_log').insert({
            user_id: userId,
            debt_id: debt.id,
            recipient_phone: debt.debtor_phone.replace(/[\s-]/g, ''),
            message,
            credits_used: 1,
            status: 'sent',
            external_id: externalId,
          })
          sentCount++
          userCreditsCache.set(userId, availableCredits - 1)
        }
      } catch (err) {
        console.error(`Cron SMS error for debt ${debt.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount,
      sentCount,
      skippedCount,
    })
  } catch (error: any) {
    console.error('CRON Reminders error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
