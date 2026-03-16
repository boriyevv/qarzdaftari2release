// src/app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🚪 Logout request')

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ Logout error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Logout successful')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Logout API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}