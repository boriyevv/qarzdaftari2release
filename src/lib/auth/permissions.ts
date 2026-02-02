// src/lib/auth/permissions.ts
import { createClient } from '@/lib/supabase/server'

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_DEBTS: 'manage_debts',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

interface RoleData {
  permissions: string[]
}

interface UserRoleData {
  roles: RoleData
}

export async function hasPermission(
  userId: string,
  permission: Permission | string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check user roles and permissions
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!inner (
          permissions
        )
      `)
      .eq('user_id', userId)

    if (error || !data) {
      console.error('Permission check error:', error)
      return false
    }

    // Extract permissions from nested structure
    const permissions: string[] = []
    for (const row of data) {
      const role = (row as any).roles
      if (role && Array.isArray(role.permissions)) {
        permissions.push(...role.permissions)
      }
    }

    return permissions.includes(permission)
  } catch (error) {
    console.error('hasPermission error:', error)
    return false
  }
}

// Get all permissions for a user
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!inner (
          permissions
        )
      `)
      .eq('user_id', userId)

    if (error || !data) {
      return []
    }

    const permissions: string[] = []
    for (const row of data) {
      const role = (row as any).roles
      if (role && Array.isArray(role.permissions)) {
        permissions.push(...role.permissions)
      }
    }

    return Array.from(new Set(permissions)) // Remove duplicates
  } catch (error) {
    console.error('getUserPermissions error:', error)
    return []
  }
}

// Check if user has any of the permissions
export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.some(p => userPermissions.includes(p))
}

// Check if user has all of the permissions
export async function hasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.every(p => userPermissions.includes(p))
}