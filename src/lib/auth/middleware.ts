// src/lib/auth/middleware.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from './permissions'

export async function getCurrentUser() {
  try {
    const adminSupabase = createAdminClient()

    // 1. Check Supabase Auth user (email users)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!authError && user) {
      // Find profile by auth_id
      const { data: profile } = await adminSupabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (profile) return profile

      // Or by phone if auth user has phone
      if (user.phone) {
        const { data: phoneProfile } = await adminSupabase
          .from('users')
          .select('*')
          .eq('phone', user.phone)
          .maybeSingle()

        if (phoneProfile) return phoneProfile
      }
    }

    // 2. Check phone_user_session cookie (phone users)
    const cookieStore = await cookies()
    const phoneUserId = cookieStore.get('phone_user_session')?.value

    if (phoneUserId) {
      const { data: profile } = await adminSupabase
        .from('users')
        .select('*')
        .eq('id', phoneUserId)
        .maybeSingle()

      if (profile) return profile
    }

    return null
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

// Middleware to check authentication
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }

  return null // Continue
}

// Middleware to check specific permission
export async function requirePermission(permission: string) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }

  const allowed = await hasPermission(user.id, permission)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' }, 
      { status: 403 }
    )
  }

  return null // Continue
}
