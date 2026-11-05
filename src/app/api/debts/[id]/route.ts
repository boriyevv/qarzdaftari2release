// src/app/api/debts/[id]/route.ts
// GET - Get single debt
// PATCH - Update debt
// DELETE - Delete debt (restricted to Store Owner)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get single debt
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    const { data: debt, error } = await adminSupabase
      .from('debts')
      .select(`
        *,
        folder:folders(id, name, color),
        payments:payments(*)
      `)
      .eq('id', params.id)
      .eq('user_id', storeOwnerId)
      .is('deleted_at', null)
      .single()

    if (error || !debt) {
      return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 })
    }

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Debt GET error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// PATCH - Update debt
const updateDebtSchema = z.object({
  debtor_name: z.string().min(2).optional(),
  debtor_phone: z.string().regex(/^\+998\d{9}$/).optional(),
  amount: z.number().positive().optional(),
  due_date: z.string().nullable().optional().or(z.literal('')).transform((val) => val || null),
  note: z.string().nullable().optional().or(z.literal('')).transform((val) => val || null),
  folder_id: z.string().uuid().nullable().optional().or(z.literal('')).transform((val) => val || null),
  status: z.enum(['pending', 'paid', 'overdue', 'blacklisted']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateDebtSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    // Check ownership
    const { data: existing } = await adminSupabase
      .from('debts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', storeOwnerId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 })
    }

    // Update debt
    const { data: debt, error } = await adminSupabase
      .from('debts')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Debt update error:', error)
      return NextResponse.json({ error: 'Yangilashda xato' }, { status: 500 })
    }

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Debt PATCH error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// DELETE - Soft delete debt (Only store owner / admin allowed)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CASHIER PERMISSION CHECK: Cashiers cannot delete debts
    if (profile.role === 'cashier') {
      return NextResponse.json(
        { error: 'Kassir qarzni o\'chirish huquqiga ega emas. Faqat do\'kon egasi o\'chira oladi.' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    // Check ownership
    const { data: existing } = await adminSupabase
      .from('debts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', storeOwnerId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 })
    }

    // Soft delete
    const { error } = await adminSupabase
      .from('debts')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'deleted',
      })
      .eq('id', params.id)

    if (error) {
      console.error('Debt delete error:', error)
      return NextResponse.json({ error: 'O\'chirishda xato' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Debt DELETE error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
