// src/app/api/debtor/[phone]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id
    const rawTarget = decodeURIComponent(params.phone)

    console.log('👤 Debtor API - Looking up debts for target:', rawTarget, 'by user:', storeOwnerId)

    // Query debts for this debtor (by phone, or by name / id if phone is empty or custom)
    let query = adminSupabase
      .from('debts')
      .select('*')
      .eq('user_id', storeOwnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (rawTarget.startsWith('+998') || /^\d{9,12}$/.test(rawTarget)) {
      query = query.eq('debtor_phone', rawTarget)
    } else {
      query = query.or(`debtor_phone.eq.${rawTarget},debtor_name.ilike.${rawTarget},id.eq.${rawTarget}`)
    }

    const { data: debts, error: debtsError } = await query

    if (debtsError) {
      console.error('👤 Debtor API - Database error:', debtsError)
      return NextResponse.json(
        { error: 'Failed to fetch debts', details: debtsError.message },
        { status: 500 }
      )
    }

    if (!debts || debts.length === 0) {
      return NextResponse.json(
        { error: 'Debtor not found', target: rawTarget },
        { status: 404 }
      )
    }

    // Calculate statistics
    const totalAmount = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0)
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.paid_amount || 0), 0)
    const totalRemaining = totalAmount - totalPaid
    const debtorName = debts[0].debtor_name
    const debtorPhone = debts[0].debtor_phone || ''

    return NextResponse.json({
      name: debtorName,
      phone: debtorPhone,
      debts,
      totalAmount,
      totalPaid,
      totalRemaining,
      debtCount: debts.length,
    })
  } catch (error: any) {
    console.error('❌ Debtor API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}
