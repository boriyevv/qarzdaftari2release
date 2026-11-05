// src/lib/auth/middleware.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from './permissions'

function formatUserProfile(profile: any) {
  if (!profile) return null
  if (profile.is_active === false) {
    console.warn(`User ${profile.id} is inactive / disabled`)
    return null
  }
  const role = profile.locale_settings?.role || (profile.is_admin ? 'admin' : 'owner')
  const store_owner_id = profile.locale_settings?.store_owner_id || profile.id
  const permissions = profile.locale_settings?.permissions || ['*']

  return {
    ...profile,
    role,
    store_owner_id,
    permissions,
  }
}

export async function getCurrentUser() {
  try {
    const adminSupabase = createAdminClient()

    // 1. Check Supabase Auth user (email users)
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (!authError && user) {
        // Find profile by auth_id
        const { data: profile } = await adminSupabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (profile) return formatUserProfile(profile)

        // Or by phone if auth user has phone
        if (user.phone) {
          const { data: phoneProfile } = await adminSupabase
            .from('users')
            .select('*')
            .eq('phone', user.phone)
            .maybeSingle()

          if (phoneProfile) return formatUserProfile(phoneProfile)
        }
      }
    } catch (authErr) {
      // Ignore Supabase auth error and fallback to phone session cookie
    }

    // 2. Check phone_user_session cookie or x-phone-session header (phone users)
    const cookieStore = await cookies()
    let phoneUserId = cookieStore.get('phone_user_session')?.value

    if (!phoneUserId) {
      try {
        const { headers } = await import('next/headers')
        const headerStore = await headers()
        phoneUserId = headerStore.get('x-phone-session') || undefined
      } catch {
        // Headers might not be available in non-request contexts
      }
    }

    if (phoneUserId) {
      const { data: profile } = await adminSupabase
        .from('users')
        .select('*')
        .eq('id', phoneUserId)
        .maybeSingle()

      if (profile) return formatUserProfile(profile)
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
