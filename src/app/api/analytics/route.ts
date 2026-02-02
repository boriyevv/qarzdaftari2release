// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // IMPORTANT: Get cookies for mobile
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('📊 Analytics - Auth check:', { 
      hasUser: !!user, 
      authError: authError?.message 
    })
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth failed' },
        { status: 401 }
      )
    }

    // Get user profile with plan
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, plan_type, is_trial_active, trial_ends_at')
      .eq('auth_id', user.id)
      .single()

    console.log('📊 Analytics - Profile:', { 
      profile, 
      profileError: profileError?.message 
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check trial OR paid plan
    const hasAccess = profile.is_trial_active || profile.plan_type !== 'FREE'
    
    console.log('📊 Analytics - Access check:', {
      plan: profile.plan_type,
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

    // PRO-only periods
    if (profile.plan_type !== 'PRO' && ['semi_annual', 'annual'].includes(period)) {
      if (!profile.is_trial_active) {
        return NextResponse.json(
          { error: 'Upgrade to Pro for 6-month and annual analytics' },
          { status: 403 }
        )
      }
    }

    // Calculate date range
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
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    console.log('📊 Analytics - Debts:', { 
      count: debts?.length || 0, 
      error: debtsError?.message 
    })

    if (debtsError) {
      return NextResponse.json(
        { error: 'Failed to fetch debts', details: debtsError.message },
        { status: 500 }
      )
    }

    if (!debts || debts.length === 0) {
      return NextResponse.json({
        period,
        months: [],
        summary: {
          totalIssued: 0,
          totalReturned: 0,
          totalRemaining: 0,
          overdueCount: 0,
          overdueAmount: 0,
        },
        topDebtors: [],
      })
    }

    // Group by month
    const monthsMap = new Map<string, any>()
    
    debts.forEach(debt => {
      const date = new Date(debt.created_at)
      const monthKey = date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
      })

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: monthKey,
          issued: 0,
          returned: 0,
          remaining: 0,
          overdueCount: 0,
        })
      }

      const monthData = monthsMap.get(monthKey)!
      monthData.issued += debt.amount
      monthData.returned += debt.paid_amount
      monthData.remaining += (debt.amount - debt.paid_amount)
      
      if (debt.due_date && new Date(debt.due_date) < now && debt.status === 'pending') {
        monthData.overdueCount++
      }
    })

    const months = Array.from(monthsMap.values())

    // Summary
    const summary = {
      totalIssued: debts.reduce((sum, d) => sum + d.amount, 0),
      totalReturned: debts.reduce((sum, d) => sum + d.paid_amount, 0),
      totalRemaining: debts.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0),
      overdueCount: debts.filter(d => 
        d.due_date && new Date(d.due_date) < now && d.status === 'pending'
      ).length,
      overdueAmount: debts
        .filter(d => d.due_date && new Date(d.due_date) < now && d.status === 'pending')
        .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0),
    }

    // Top debtors
    const debtorMap = new Map<string, any>()
    
    debts.forEach(debt => {
      const key = debt.debtor_phone
      if (!debtorMap.has(key)) {
        debtorMap.set(key, {
          name: debt.debtor_name,
          phone: debt.debtor_phone,
          amount: 0,
        })
      }
      debtorMap.get(key)!.amount += (debt.amount - debt.paid_amount)
    })

    const topDebtors = Array.from(debtorMap.values())
      .filter(d => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return NextResponse.json({
      period,
      months,
      summary,
      topDebtors,
    })
  } catch (error: any) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}