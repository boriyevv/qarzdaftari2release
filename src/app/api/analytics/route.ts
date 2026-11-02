import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
]

const UZ_MONTHS_SHORT = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
]

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    const profile = await getCurrentUser()

    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth failed' },
        { status: 401 }
      )
    }

    const userPlan = (profile.plan_type || 'FREE').toUpperCase()
    const hasAccess = profile.is_trial_active || userPlan !== 'FREE'

    console.log('📊 Analytics API - Access check:', {
      plan: userPlan,
      isTrial: profile.is_trial_active,
      hasAccess
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Upgrade to Plus or Pro for analytics', plan: profile.plan_type },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly'

    if (userPlan !== 'PRO' && ['semi_annual', 'annual'].includes(period)) {
      if (!profile.is_trial_active) {
        return NextResponse.json(
          { error: 'Upgrade to Pro for 6-month and annual analytics' },
          { status: 403 }
        )
      }
    }

    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'semi_annual':
        startDate.setMonth(now.getMonth() - 6)
        break
      case 'annual':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30) // Oxirgi 30 kun
    }

    // Davr bo'yicha qarzlarni olish
    const { data: debts, error: debtsError } = await adminSupabase
      .from('debts')
      .select('*')
      .eq('user_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (debtsError) {
      console.error('❌ Analytics - Debts fetch error:', debtsError)
      return NextResponse.json(
        { error: 'Failed to fetch debts', details: debtsError.message },
        { status: 500 }
      )
    }

    // Do'kondagi barcha faol qarzlar (umumiy qoldiq va top qarzdorlarni aniqlash uchun)
    const { data: allActiveDebts } = await adminSupabase
      .from('debts')
      .select('*')
      .eq('user_id', profile.id)
      .is('deleted_at', null)

    const allDebtsList = allActiveDebts || []
    const safeDebts = debts || []

    // 1. Asosiy KPI hisob-kitoblari
    // Davr bo'yicha pul oqimi:
    const totalIssued = safeDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const totalReturned = safeDebts.reduce((sum, d) => sum + (Number(d.paid_amount) || 0), 0)

    // Joriy do'kon balansi va muddati o'tganlar (Dashboard bilan 100% mutanosib):
    const targetDebtsForBalance = allDebtsList.length > 0 ? allDebtsList : safeDebts

    const totalRemaining = targetDebtsForBalance.reduce((sum, d) => {
      const remaining = (Number(d.amount) || 0) - (Number(d.paid_amount) || 0)
      return sum + Math.max(0, remaining)
    }, 0)

    const overdueDebts = targetDebtsForBalance.filter(d => {
      const remaining = (Number(d.amount) || 0) - (Number(d.paid_amount) || 0)
      return remaining > 0 && d.due_date && new Date(d.due_date) < now
    })

    const overdueCount = overdueDebts.length
    const overdueAmount = overdueDebts.reduce((sum, d) => {
      const rem = (Number(d.amount) || 0) - (Number(d.paid_amount) || 0)
      return sum + Math.max(0, rem)
    }, 0)

    const repaymentRate = totalIssued > 0
      ? Math.min(100, Math.round((totalReturned / totalIssued) * 100))
      : (allDebtsList.length > 0
          ? Math.min(100, Math.round((allDebtsList.reduce((s, d) => s + (Number(d.paid_amount) || 0), 0) / Math.max(1, allDebtsList.reduce((s, d) => s + (Number(d.amount) || 0), 0))) * 100))
          : 0)

    const averageDebtAmount = safeDebts.length > 0
      ? Math.round(totalIssued / safeDebts.length)
      : (allDebtsList.length > 0 ? Math.round(allDebtsList.reduce((s, d) => s + (Number(d.amount) || 0), 0) / allDebtsList.length) : 0)

    // 2. Qarzlar holati bo'yicha taqsimot (Status Distribution)
    let paidCount = 0
    let paidAmount = 0
    let pendingCount = 0
    let pendingAmount = 0
    let overdueStatusCount = 0
    let overdueStatusAmount = 0

    safeDebts.forEach(d => {
      const amt = Number(d.amount) || 0
      const paid = Number(d.paid_amount) || 0
      const remaining = Math.max(0, amt - paid)
      const isPaid = d.status === 'paid' || (amt > 0 && paid >= amt)
      const isOverdue = !isPaid && d.due_date && new Date(d.due_date) < now

      if (isPaid) {
        paidCount++
        paidAmount += amt
      } else if (isOverdue) {
        overdueStatusCount++
        overdueStatusAmount += remaining
      } else {
        pendingCount++
        pendingAmount += remaining
      }
    })

    const totalDebtsCount = safeDebts.length
    const statusDistribution = {
      paid: {
        count: paidCount,
        amount: paidAmount,
        percentage: totalDebtsCount > 0 ? Math.round((paidCount / totalDebtsCount) * 100) : 0,
      },
      pending: {
        count: pendingCount,
        amount: pendingAmount,
        percentage: totalDebtsCount > 0 ? Math.round((pendingCount / totalDebtsCount) * 100) : 0,
      },
      overdue: {
        count: overdueStatusCount,
        amount: overdueStatusAmount,
        percentage: totalDebtsCount > 0 ? Math.round((overdueStatusCount / totalDebtsCount) * 100) : 0,
      },
    }

    // 3. Oylik taqsimot (Months Breakdown)
    const monthsMap = new Map<string, {
      month: string
      monthShort: string
      issued: number
      returned: number
      remaining: number
      overdueCount: number
    }>()

    safeDebts.forEach(debt => {
      const date = new Date(debt.created_at)
      const monthIndex = date.getMonth()
      const year = date.getFullYear()
      const monthKey = `${UZ_MONTHS[monthIndex]} ${year}`
      const monthShort = `${UZ_MONTHS_SHORT[monthIndex]}`

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: monthKey,
          monthShort,
          issued: 0,
          returned: 0,
          remaining: 0,
          overdueCount: 0,
        })
      }

      const m = monthsMap.get(monthKey)!
      const amt = Number(debt.amount) || 0
      const paid = Number(debt.paid_amount) || 0
      const rem = Math.max(0, amt - paid)

      m.issued += amt
      m.returned += paid
      m.remaining += rem

      if (rem > 0 && debt.due_date && new Date(debt.due_date) < now) {
        m.overdueCount++
      }
    })

    const months = Array.from(monthsMap.values()).map(m => ({
      ...m,
      repaymentRate: m.issued > 0 ? Math.min(100, Math.round((m.returned / m.issued) * 100)) : 0,
    }))

    // 4. Vizual grafik uchun ma'lumotlar (Chart Data)
    let chartData: Array<{
      name: string
      dateLabel?: string
      issued: number
      returned: number
      remaining: number
    }> = []

    if (period === 'monthly') {
      // 30 kunlik davrni 4 ta xronologik haftaga ajratamiz
      const weekBuckets = [
        { name: '1-hafta', dateLabel: '1 - 7 kun', issued: 0, returned: 0, remaining: 0 },
        { name: '2-hafta', dateLabel: '8 - 14 kun', issued: 0, returned: 0, remaining: 0 },
        { name: '3-hafta', dateLabel: '15 - 21 kun', issued: 0, returned: 0, remaining: 0 },
        { name: '4-hafta', dateLabel: '22 - 30 kun', issued: 0, returned: 0, remaining: 0 },
      ]

      safeDebts.forEach(debt => {
        const created = new Date(debt.created_at).getTime()
        const daysDiff = Math.max(0, Math.floor((now.getTime() - created) / (1000 * 60 * 60 * 24)))
        // 0-7 kun = 4-hafta (eng yangisi), 22-30 kun = 1-hafta (eng eskisi)
        let weekIndex = 3 - Math.min(3, Math.floor(daysDiff / 7.5))
        if (weekIndex < 0) weekIndex = 0
        if (weekIndex > 3) weekIndex = 3

        const amt = Number(debt.amount) || 0
        const paid = Number(debt.paid_amount) || 0
        const rem = Math.max(0, amt - paid)

        weekBuckets[weekIndex].issued += amt
        weekBuckets[weekIndex].returned += paid
        weekBuckets[weekIndex].remaining += rem
      })

      chartData = weekBuckets
    } else {
      // 6 oylik yoki yillik uchun oylar bo'yicha ketma-ketlik
      chartData = months.map(m => ({
        name: m.monthShort,
        dateLabel: m.month,
        issued: m.issued,
        returned: m.returned,
        remaining: m.remaining,
      }))
    }

    // 5. Eng ko'p qarzdorlar (Top Debtors)
    const debtorMap = new Map<string, {
      name: string
      phone: string
      amount: number
      debtCount: number
      isOverdue: boolean
    }>()

    // Top qarzdorlar uchun do'kondagi barcha mavjud faol qarzlardan foydalanamiz
    targetDebtsForBalance.forEach(debt => {
      const key = debt.debtor_phone || debt.debtor_name || 'Noma\'lum'
      const amt = Number(debt.amount) || 0
      const paid = Number(debt.paid_amount) || 0
      const remaining = Math.max(0, amt - paid)
      const isOverdue = remaining > 0 && debt.due_date && new Date(debt.due_date) < now

      if (!debtorMap.has(key)) {
        debtorMap.set(key, {
          name: debt.debtor_name || 'Noma\'lum mijoz',
          phone: debt.debtor_phone || '',
          amount: 0,
          debtCount: 0,
          isOverdue: false,
        })
      }

      const debtor = debtorMap.get(key)!
      debtor.amount += remaining
      if (remaining > 0) {
        debtor.debtCount += 1
      }
      if (isOverdue) {
        debtor.isOverdue = true
      }
    })

    const topDebtors = Array.from(debtorMap.values())
      .filter(d => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const activeDebtorsCount = Array.from(debtorMap.values()).filter(d => d.amount > 0).length

    // Batafsil qarzlar ro'yxati (Eksport va hisobotlar uchun)
    const exportDebts = targetDebtsForBalance.map(d => {
      const amt = Number(d.amount) || 0
      const paid = Number(d.paid_amount) || 0
      const remaining = Math.max(0, amt - paid)
      const isPaid = d.status === 'paid' || (amt > 0 && paid >= amt)
      const isOverdue = !isPaid && d.due_date && new Date(d.due_date) < now

      return {
        id: d.id,
        debtor_name: d.debtor_name || 'Noma\'lum',
        debtor_phone: d.debtor_phone || '',
        amount: amt,
        paid_amount: paid,
        remaining_amount: remaining,
        status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
        status_label: isPaid ? 'To\'langan' : (isOverdue ? 'Kechikkan' : 'Kutilmoqda'),
        debt_date: d.debt_date || d.created_at?.split('T')[0] || '',
        due_date: d.due_date || 'Belgilanmagan',
        created_at: d.created_at,
      }
    })

    // Javob obyekti
    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalIssued,
        totalReturned,
        totalRemaining,
        repaymentRate,
        overdueCount,
        overdueAmount,
        averageDebtAmount,
        totalDebtsCount,
        activeDebtorsCount,
      },
      chartData,
      statusDistribution,
      months,
      topDebtors,
      debts: exportDebts,
    })
  } catch (error: any) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}
