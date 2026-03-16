
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('🔍 /api/auth/me called')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Auth user:', user?.id, user?.email || user?.phone)
    
    if (authError || !user) {
      console.log('❌ No auth user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        sms_credits:sms_credits(*)
      `)
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      console.log('✅ Profile found by auth_id:', profile.full_name)
      return NextResponse.json({ profile })
    }

    console.log('⚠️ Profile not found by auth_id, trying phone...')

    if (user.phone) {
      const { data: phoneProfile } = await supabase
        .from('users')
        .select(`
          *,
          sms_credits:sms_credits(*)
        `)
        .eq('phone', user.phone)
        .is('auth_id', null)
        .single()

      if (phoneProfile) {
        console.log('✅ Phone profile found:', phoneProfile.full_name)
        return NextResponse.json({ profile: phoneProfile })
      }
    }

    console.error('❌ Profile not found in database for user:', user.id)
    console.error('User email:', user.email)
    console.error('User phone:', user.phone)
    
    return NextResponse.json(
      { error: 'Profile not found. Please contact support.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('❌ Me API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}