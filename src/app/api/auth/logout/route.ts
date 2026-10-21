// src/app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🚪 Logout request')

    try {
      await supabase.auth.signOut()
    } catch (signOutErr) {
      console.warn('⚠️ Supabase signOut error:', signOutErr)
    }

    const response = NextResponse.json({ success: true })
    
    // Clear phone session cookie
    response.cookies.delete('phone_user_session')

    console.log('✅ Logout successful')

    return response
  } catch (error) {
    console.error('❌ Logout API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
