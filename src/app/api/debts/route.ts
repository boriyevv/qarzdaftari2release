// src/app/api/debts/route.ts
// GET - List debts with filters
// POST - Create new debt

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List debts
export async function GET(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    // Parse query params
    const { searchParams } = new URL(request.url)
    const folder_id = searchParams.get('folder_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = adminSupabase
      .from('debts')
      .select(`
        *,
        folder:folders(id, name, color),
        payments:payments(id, amount, payment_date)
      `)
      .eq('user_id', storeOwnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (folder_id && folder_id !== 'all') {
      query = query.eq('folder_id', folder_id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`debtor_name.ilike.%${search}%,debtor_phone.ilike.%${search}%`)
    }

    const { data: debts, error } = await query

    if (error) {
      console.error('Debts fetch error:', error)
      return NextResponse.json({ error: 'Qarzlar olishda xato' }, { status: 500 })
    }

    // Calculate totals
    const total_amount = debts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
    const total_paid = debts?.reduce((sum, d) => sum + (d.paid_amount || 0), 0) || 0
    const total_remaining = total_amount - total_paid

    return NextResponse.json({
      debts,
      totals: {
        total_amount,
        total_paid,
        total_remaining,
        count: debts?.length || 0,
      },
    })
  } catch (error) {
    console.error('Debts API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Validation schema for creating debt
const createDebtSchema = z.object({
  folder_id: z.string().uuid().nullable().optional().or(z.literal('')).transform((val) => val || undefined),
  debtor_name: z.string().min(2, 'Ism kamida 2 ta belgi'),
  debtor_phone: z
    .string()
    .regex(/^\+998\d{9}$/, 'Telefon format: +998XXXXXXXXX')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => val || ''),
  amount: z.number().positive('Summa musbat bo\'lishi kerak'),
  debt_date: z.string().nullable().optional().or(z.literal('')).transform((val) => val || undefined),
  due_date: z.string().nullable().optional().or(z.literal('')).transform((val) => val || null),
  note: z.string().nullable().optional().or(z.literal('')).transform((val) => val || null),
})

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createDebtSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()
    const storeOwnerId = profile.store_owner_id || profile.id

    // Check plan limits (only active debts count)
    const { count } = await adminSupabase
      .from('debts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', storeOwnerId)
      .in('status', ['pending', 'overdue'])
      .is('deleted_at', null)

    const limits: Record<string, number> = {
      free: 50,
      plus: 500,
      pro: 999999,
    }

    const userPlan = (profile.plan_type || 'free').toLowerCase()
    const maxDebts = limits[userPlan] || 50

    if (count && count >= maxDebts) {
      return NextResponse.json(
        { error: `Maksimal ${maxDebts} ta aktiv qarz. Tarifni yangilang.` },
        { status: 403 }
      )
    }

    // Get default folder if not provided
    let folderId = result.data.folder_id

    if (!folderId) {
      const { data: defaultFolder } = await adminSupabase
        .from('folders')
        .select('id')
        .eq('user_id', storeOwnerId)
        .eq('is_default', true)
        .single()

      folderId = defaultFolder?.id
    }

    // Cashier attribution in note
    let debtNote = result.data.note || ''
    if (profile.role === 'cashier') {
      const cashierTag = `[Kassir: ${profile.full_name}]`
      debtNote = debtNote ? `${debtNote} ${cashierTag}` : cashierTag
    }

    // Create debt
    const { data: debt, error } = await adminSupabase
      .from('debts')
      .insert({
        user_id: storeOwnerId,
        folder_id: folderId || null,
        debtor_name: result.data.debtor_name,
        debtor_phone: result.data.debtor_phone,
        amount: result.data.amount,
        paid_amount: 0,
        debt_date: result.data.debt_date || new Date().toISOString().split('T')[0],
        due_date: result.data.due_date || null,
        note: debtNote,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Debt create error:', error)
      return NextResponse.json({ error: 'Qarz yaratishda xato' }, { status: 500 })
    }

    return NextResponse.json({ debt })
  } catch (error) {
    console.error('Debts POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
