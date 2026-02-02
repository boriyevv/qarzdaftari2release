// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from './permissions'

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    return profile
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

// Example usage in API route:
/*
import { requireAuth, requirePermission } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  // Check authentication
  const authError = await requireAuth()
  if (authError) return authError

  // Check permission
  const permError = await requirePermission('manage_users')
  if (permError) return permError

  // Your route logic here
  return NextResponse.json({ success: true })
}
*/