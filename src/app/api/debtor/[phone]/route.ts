// src/app/api/debtor/[phone]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    // IMPORTANT: Get cookies for mobile
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Debtor API - Auth check:', { 
      hasUser: !!user, 
      authError: authError?.message,
      phone: params.phone 
    })
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    console.log('👤 Debtor API - Profile:', { 
      profile, 
      profileError: profileError?.message 
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const phone = decodeURIComponent(params.phone)
    
    console.log('👤 Debtor API - Searching debts for phone:', phone)

    // Get all debts for this debtor
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('debtor_phone', phone)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    console.log('👤 Debtor API - Debts result:', { 
      count: debts?.length || 0,
      error: debtsError?.message 
    })

    if (debtsError) {
      console.error('👤 Debtor API - Database error:', debtsError)
      return NextResponse.json(
        { error: 'Failed to fetch debts', details: debtsError.message },
        { status: 500 }
      )
    }

    if (!debts || debts.length === 0) {
      return NextResponse.json(
        { error: 'Debtor not found', phone },
        { status: 404 }
      )
    }

    // Calculate statistics
    const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0)
    const totalPaid = debts.reduce((sum, debt) => sum + debt.paid_amount, 0)
    const totalRemaining = totalAmount - totalPaid

    // Get debtor name from first debt
    const debtorName = debts[0].debtor_name

    console.log('👤 Debtor API - Success:', {
      name: debtorName,
      phone,
      debtCount: debts.length,
      totalAmount
    })

    return NextResponse.json({
      name: debtorName,
      phone,
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