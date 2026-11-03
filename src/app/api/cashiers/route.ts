// src/app/api/cashiers/route.ts
// GET - List all cashiers for current store owner
// POST - Create a new cashier account for the store

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateStoreOrganization } from '@/lib/organizations/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    // Only owners/admins can view cashiers
    if (profile.role === 'cashier') {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // Find all users who are cashiers for this store owner
    const { data: cashiers, error } = await adminSupabase
      .from('users')
      .select('id, full_name, phone, username, store_name, is_active, created_at, locale_settings')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch cashiers:', error)
      return NextResponse.json({ error: 'Kassirlarni yuklashda xatolik' }, { status: 500 })
    }

    // Filter cashiers belonging to this owner
    const storeCashiers = (cashiers || [])
      .filter((u) => {
        const settings = u.locale_settings as any
        return settings?.role === 'cashier' && settings?.store_owner_id === profile.id
      })
      .map((u) => {
        const settings = u.locale_settings as any
        return {
          id: u.id,
          full_name: u.full_name,
          phone: u.phone,
          username: u.username,
          store_name: u.store_name,
          is_active: u.is_active,
          created_at: u.created_at,
          permissions: settings?.permissions || ['create_debt', 'add_payment', 'send_sms'],
        }
      })

    return NextResponse.json({
      cashiers: storeCashiers,
      count: storeCashiers.length,
    })
  } catch (error) {
    console.error('GET /api/cashiers error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

const createCashierSchema = z.object({
  full_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon formati: +998XXXXXXXXX'),
  username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 ta belgi').regex(/^[a-zA-Z0-9_]+$/, 'Faqat lotin harflari va sonlar'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  permissions: z.array(z.string()).default(['create_debt', 'add_payment', 'send_sms']),
})

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    if (profile.role === 'cashier') {
      return NextResponse.json({ error: 'Kassir yangi kassir qo\'sha olmaydi' }, { status: 403 })
    }

    const body = await request.json()
    const result = createCashierSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = result.data
    const adminSupabase = createAdminClient()

    // 1. Check if phone is already registered
    const { data: existingPhone } = await adminSupabase
      .from('users')
      .select('id')
      .eq('phone', data.phone)
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Ushbu telefon raqam allaqachon ro\'yxatdan o\'tgan' },
        { status: 400 }
      )
    }

    // 2. Check if username is already taken
    const { data: existingUsername } = await adminSupabase
      .from('users')
      .select('id')
      .eq('username', data.username.toLowerCase().trim())
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Ushbu foydalanuvchi nomi (username) allaqachon band' },
        { status: 400 }
      )
    }

    // 3. Ensure owner organization exists
    const organization = await getOrCreateStoreOrganization(adminSupabase, profile)

    // 4. Create auth user in Supabase
    const cleanPhone = data.phone.replace(/\D/g, '')
    const cashierEmail = `cashier_${cleanPhone}@debtbook.uz`

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: cashierEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        role: 'cashier',
        store_owner_id: profile.id,
      },
    })

    if (authError || !authData.user) {
      console.error('Failed to create cashier auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Kassir akkauntini yaratishda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    // 5. Insert profile into users table
    const cashierPayload = {
      id: authData.user.id,
      auth_id: authData.user.id,
      full_name: data.full_name.trim(),
      phone: data.phone,
      email: cashierEmail,
      username: data.username.toLowerCase().trim(),
      store_name: profile.store_name || "Mening Do'konim",
      auth_method: 'phone',
      phone_verified: true,
      is_active: true,
      organization_id: organization.id,
      plan_type: (profile.plan_type || 'FREE').toUpperCase(),
      locale_settings: {
        role: 'cashier',
        store_owner_id: profile.id,
        permissions: data.permissions,
        created_by_owner: profile.full_name || profile.username,
      },
    }

    const { data: insertedUser, error: insertError } = await adminSupabase
      .from('users')
      .insert(cashierPayload)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert cashier profile:', insertError)
      // Rollback auth user
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Kassir profilini saqlashda xatolik yuz berdi: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kassir muvaffaqiyatli qo\'shildi!',
      cashier: {
        id: insertedUser.id,
        full_name: insertedUser.full_name,
        phone: insertedUser.phone,
        username: insertedUser.username,
        store_name: insertedUser.store_name,
        is_active: insertedUser.is_active,
        created_at: insertedUser.created_at,
        permissions: data.permissions,
      },
    })
  } catch (error) {
    console.error('POST /api/cashiers error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
