// src/app/api/sms-credits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    
    // Get current user (supports both Supabase email auth and phone OTP session)
    const profile = await getCurrentUser()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const storeOwnerId = profile.store_owner_id || profile.id

    // Get SMS credits
    const { data: credits } = await adminSupabase
      .from('sms_credits')
      .select('credits, used_credits')
      .eq('user_id', storeOwnerId)

    const totalCredits = credits?.reduce((sum, c) => sum + c.credits, 0) || 0
    const usedCredits = credits?.reduce((sum, c) => sum + c.used_credits, 0) || 0
    const remainingCredits = totalCredits - usedCredits

    // Get recent purchases
    const { data: purchases } = await adminSupabase
      .from('sms_credit_purchases')
      .select('credits, amount, created_at')
      .eq('user_id', storeOwnerId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get usage history
    const { data: usage } = await adminSupabase
      .from('sms_usage_log')
      .select('recipient_phone, created_at')
      .eq('user_id', storeOwnerId)
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
