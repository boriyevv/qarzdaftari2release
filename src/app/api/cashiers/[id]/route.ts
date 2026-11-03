// src/app/api/cashiers/[id]/route.ts
// PATCH - Update cashier status, permissions, or password
// DELETE - Remove cashier from store

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const updateCashierSchema = z.object({
  full_name: z.string().min(2).optional(),
  is_active: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(6).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    if (profile.role === 'cashier') {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const body = await request.json()
    const result = updateCashierSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch target cashier to verify store ownership
    const { data: targetUser, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, full_name, phone, is_active, locale_settings')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Kassir topilmadi' }, { status: 404 })
    }

    const settings = (targetUser.locale_settings as any) || {}
    if (settings.role !== 'cashier' || settings.store_owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Ushbu kassir sizning do\'koningizga tegishli emas' },
        { status: 403 }
      )
    }

    // 2. Prepare updates
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof result.data.is_active === 'boolean') {
      updates.is_active = result.data.is_active
    }

    if (result.data.full_name) {
      updates.full_name = result.data.full_name.trim()
    }

    if (result.data.permissions) {
      updates.locale_settings = {
        ...settings,
        permissions: result.data.permissions,
      }
    }

    // 3. Update in database
    const { data: updated, error: updateError } = await adminSupabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update cashier profile:', updateError)
      return NextResponse.json({ error: 'O\'zgartirishlarni saqlashda xatolik' }, { status: 500 })
    }

    // 4. Update password in Supabase Auth if provided
    if (result.data.password) {
      try {
        await adminSupabase.auth.admin.updateUserById(params.id, {
          password: result.data.password,
        })
      } catch (authErr) {
        console.error('Failed to update cashier auth password:', authErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kassir ma\'lumotlari yangilandi',
      cashier: updated,
    })
  } catch (error) {
    console.error('PATCH /api/cashiers/[id] error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    if (profile.role === 'cashier') {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // Verify ownership
    const { data: targetUser, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, full_name, locale_settings')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Kassir topilmadi' }, { status: 404 })
    }

    const settings = (targetUser.locale_settings as any) || {}
    if (settings.role !== 'cashier' || settings.store_owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Ushbu kassir sizning do\'koningizga tegishli emas' },
        { status: 403 }
      )
    }

    // Delete user from users table
    const { error: deleteUserError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (deleteUserError) {
      console.error('Failed to delete cashier profile:', deleteUserError)
      return NextResponse.json({ error: 'Kassirni o\'chirishda xatolik' }, { status: 500 })
    }

    // Delete from Supabase Auth
    try {
      await adminSupabase.auth.admin.deleteUser(params.id)
    } catch (authDeleteErr) {
      console.warn('Failed to delete auth user, non-fatal:', authDeleteErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Kassir hisobi muvaffaqiyatli o\'chirildi',
    })
  } catch (error) {
    console.error('DELETE /api/cashiers/[id] error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
