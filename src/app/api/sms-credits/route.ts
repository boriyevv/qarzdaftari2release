// src/app/api/sms-credits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get SMS credits
    const { data: credits } = await supabase
      .from('sms_credits')
      .select('credits, used_credits')
      .eq('user_id', profile.id)

    const totalCredits = credits?.reduce((sum, c) => sum + c.credits, 0) || 0
    const usedCredits = credits?.reduce((sum, c) => sum + c.used_credits, 0) || 0
    const remainingCredits = totalCredits - usedCredits

    // Get recent purchases
    const { data: purchases } = await supabase
      .from('sms_credit_purchases')
      .select('credits, amount, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get usage history
    const { data: usage } = await supabase
      .from('sms_usage_log')
      .select('recipient_phone, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      total_credits: totalCredits,
      used_credits: usedCredits,
      remaining_credits: remainingCredits,
      recent_purchases: purchases || [],
      usage_history: usage || [],
    })
  } catch (error) {
    console.error('❌ SMS Credits API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}