// src/app/api/debtors/suggest/route.ts
// Returns unique debtors with their current balance for fast autocomplete in AddDebtModal
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    let dbQuery = adminSupabase
      .from('debts')
      .select('id, debtor_name, debtor_phone, amount, paid_amount, status, created_at')
      .eq('user_id', storeOwnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`debtor_name.ilike.%${query}%,debtor_phone.ilike.%${query}%`)
    }

    const { data: debts, error } = await dbQuery.limit(250)

    if (error) {
      console.error('Debtors suggest error:', error)
      return NextResponse.json({ error: 'Xatolik' }, { status: 500 })
    }

    // Aggregate unique debtors by debtor_name + debtor_phone
    const debtorMap = new Map<string, {
      name: string
      phone: string
      totalDebt: number
      totalRemaining: number
      activeDebtsCount: number
      lastDebtDate: string
    }>()

    for (const d of debts || []) {
      const key = `${(d.debtor_name || '').trim().toLowerCase()}:::${(d.debtor_phone || '').trim()}`
      const existing = debtorMap.get(key)
      const remaining = Math.max(0, (d.amount || 0) - (d.paid_amount || 0))

      if (!existing) {
        debtorMap.set(key, {
          name: d.debtor_name,
          phone: d.debtor_phone || '',
          totalDebt: d.amount || 0,
          totalRemaining: remaining,
          activeDebtsCount: remaining > 0 ? 1 : 0,
          lastDebtDate: d.created_at,
        })
      } else {
        existing.totalDebt += d.amount || 0
        existing.totalRemaining += remaining
        if (remaining > 0) existing.activeDebtsCount += 1
      }
    }

    const suggestions = Array.from(debtorMap.values()).slice(0, 15)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggest API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
