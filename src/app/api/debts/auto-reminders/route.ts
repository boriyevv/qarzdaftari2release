// src/app/api/debts/auto-reminders/route.ts
// GET: Preview eligible debts due in <= 3 days or overdue
// POST: Batch send automatic reminder SMS

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smsService, getUserSmsCredits, deductUserSmsCredits } from '@/lib/services/sms.service'
import { formatCurrency } from '@/lib/utils/currency'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, store_name, full_name')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get SMS Credits
    const { balance: remainingCredits } = await getUserSmsCredits(supabase, profile.id)

    // Fetch active open debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('id, debtor_name, debtor_phone, amount, paid_amount, due_date, status')
      .eq('user_id', profile.id)
      .neq('status', 'paid')

    if (debtsError) {
      return NextResponse.json({ error: 'Qarzlarni yuklashda xato' }, { status: 500 })
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const storeTitle = profile.store_name || profile.full_name || 'Qarz Daftari'

    // Fetch SMS logs from last 24 hours to prevent spamming
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLogs } = await supabase
      .from('sms_usage_log')
      .select('debt_id')
      .eq('user_id', profile.id)
      .gte('created_at', yesterday)

    const recentDebtIds = new Set(recentLogs?.map((l) => l.debt_id).filter(Boolean))

    const eligibleDebts = []

    for (const debt of debts || []) {
      const remaining = debt.amount - debt.paid_amount
      if (remaining <= 0) continue
      if (!debt.due_date) continue
      if (!debt.debtor_phone) continue

      const dueDate = new Date(debt.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      // Condition: Due in <= 3 days, or already overdue
      if (diffDays <= 3) {
        const isOverdue = diffDays < 0
        const alreadySentRecently = recentDebtIds.has(debt.id)
        const formattedRem = formatCurrency(remaining)
        const dateStr = dueDate.toLocaleDateString('uz-UZ')

        const message = isOverdue
          ? `Hurmatli ${debt.debtor_name}, sizning ${formattedRem} so'm qarz to'lov muddati (${dateStr}) o'tgan. Iltimos, zudlik bilan to'lashingizni so'raymiz. ${storeTitle}.`
          : diffDays === 0
          ? `Hurmatli ${debt.debtor_name}, bugun sizning ${formattedRem} so'm qarz to'lov muddatingiz. Iltimos to'lovni amalga oshiring. ${storeTitle}.`
          : `Hurmatli ${debt.debtor_name}, ${formattedRem} so'm qarz to'lov muddati ${dateStr} sanasiga belgilangan (${diffDays} kun qoldi). Eslatma uchun tashakkur. ${storeTitle}.`

        eligibleDebts.push({
          id: debt.id,
          debtor_name: debt.debtor_name,
          debtor_phone: debt.debtor_phone,
          remaining,
          due_date: debt.due_date,
          diff_days: diffDays,
          is_overdue: isOverdue,
          already_sent_recently: alreadySentRecently,
          message_preview: message,
        })
      }
    }

    // Sort: most urgent (most overdue first, then soonest)
    eligibleDebts.sort((a, b) => a.diff_days - b.diff_days)

    return NextResponse.json({
      eligibleDebts,
      totalEligible: eligibleDebts.length,
      sendableCount: eligibleDebts.filter((d) => !d.already_sent_recently).length,
      remainingCredits,
      storeName: storeTitle,
    })
  } catch (error) {
    console.error('Auto-reminders GET error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, store_name, full_name')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const selectedIds: string[] | undefined = body.debt_ids

    // Fetch user credits
    const { balance: remainingCreditsFromDb } = await getUserSmsCredits(supabase, profile.id)
    let remainingCredits = remainingCreditsFromDb

    if (remainingCredits < 1) {
      return NextResponse.json(
        { error: 'SMS balansingizda kredit mavjud emas. Avval hisobni to\'ldiring.' },
        { status: 400 }
      )
    }

    if (!smsService.isConfigured()) {
      return NextResponse.json(
        { error: 'SMS xizmati (Eskiz) ulanmagan' },
        { status: 503 }
      )
    }

    // Fetch eligible debts
    let query = supabase
      .from('debts')
      .select('id, debtor_name, debtor_phone, amount, paid_amount, due_date, status')
      .eq('user_id', profile.id)
      .neq('status', 'paid')

    if (selectedIds && selectedIds.length > 0) {
      query = query.in('id', selectedIds)
    }

    const { data: debts } = await query
    if (!debts || debts.length === 0) {
      return NextResponse.json({ error: 'Yuborish uchun qarzlar topilmadi' }, { status: 400 })
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const storeTitle = profile.store_name || profile.full_name || 'Qarz Daftari'

    let sentCount = 0
    let failedCount = 0

    for (const debt of debts) {
      if (remainingCredits <= 0) break

      const remaining = debt.amount - debt.paid_amount
      if (remaining <= 0 || !debt.due_date || !debt.debtor_phone) continue

      const dueDate = new Date(debt.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      const isOverdue = diffDays < 0
      const formattedRem = formatCurrency(remaining)
      const dateStr = dueDate.toLocaleDateString('uz-UZ')

      const message = isOverdue
        ? `Hurmatli ${debt.debtor_name}, sizning ${formattedRem} so'm qarz to'lov muddati (${dateStr}) o'tgan. Iltimos, zudlik bilan to'lashingizni so'raymiz. ${storeTitle}.`
        : diffDays === 0
        ? `Hurmatli ${debt.debtor_name}, bugun sizning ${formattedRem} so'm qarz to'lov muddatingiz. Iltimos to'lovni amalga oshiring. ${storeTitle}.`
        : `Hurmatli ${debt.debtor_name}, ${formattedRem} so'm qarz to'lov muddati ${dateStr} sanasiga belgilangan (${diffDays} kun qoldi). Eslatma uchun tashakkur. ${storeTitle}.`

      try {
        const externalId = await smsService.sendSMS(debt.debtor_phone, message)
        if (externalId) {
          await deductUserSmsCredits(supabase, profile.id, 1)
          await supabase.from('sms_usage_log').insert({
            user_id: profile.id,
            debt_id: debt.id,
            recipient_phone: debt.debtor_phone.replace(/[\s-]/g, ''),
            message,
            credits_used: 1,
            status: 'sent',
            external_id: externalId,
          })
          sentCount++
          remainingCredits--
        } else {
          failedCount++
        }
      } catch (err) {
        console.error(`Failed to send SMS to debt ${debt.id}:`, err)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      remainingCredits,
      message: `${sentCount} ta mijozga avtomatik eslatma muvaffaqiyatli yuborildi!`,
    })
  } catch (error) {
    console.error('Auto-reminders POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
