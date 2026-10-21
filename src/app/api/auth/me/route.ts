// src/app/api/auth/me/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    console.log('🔍 /api/auth/me called')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // 1. If not authenticated via Supabase Auth, check phone_user_session cookie
    if (authError || !user) {
      const cookieStore = await cookies()
      const phoneUserId = cookieStore.get('phone_user_session')?.value

      if (phoneUserId) {
        const { data: phoneProfile } = await adminSupabase
          .from('users')
          .select(`
            *,
            sms_credits:sms_credits(*)
          `)
          .eq('id', phoneUserId)
          .maybeSingle()

        if (phoneProfile) {
          console.log('✅ Phone profile found via session cookie:', phoneProfile.full_name)
          return NextResponse.json({ profile: phoneProfile })
        }
      }

      console.log('❌ No auth user or phone session')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Look up profile by auth_id
    const { data: profile } = await adminSupabase
      .from('users')
      .select(`
        *,
        sms_credits:sms_credits(*)
      `)
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profile) {
      console.log('✅ Profile found by auth_id:', profile.full_name)
      return NextResponse.json({ profile })
    }

    console.log('⚠️ Profile not found by auth_id, trying phone...')

    if (user.phone) {
      const { data: phoneProfile } = await adminSupabase
        .from('users')
        .select(`
          *,
          sms_credits:sms_credits(*)
        `)
        .eq('phone', user.phone)
        .is('auth_id', null)
        .maybeSingle()

      if (phoneProfile) {
        console.log('✅ Phone profile found:', phoneProfile.full_name)
        return NextResponse.json({ profile: phoneProfile })
      }
    }

    console.error('❌ Profile not found in database for user:', user.id)
    return NextResponse.json(
      { error: 'Profile not found. Please contact support.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('❌ Me API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
