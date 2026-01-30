// src/app/api/debts/route.ts
// GET - List debts with filters
// POST - Create new debt

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List debts
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const folder_id = searchParams.get('folder_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('debts')
      .select(`
        *,
        folder:folders(id, name, color),
        payments:payments(id, amount, payment_date)
      `)
      .eq('user_id', profile.id)
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

    return NextResponse.json({ debts })
  } catch (error) {
    console.error('Debts GET error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// POST - Create debt
const createDebtSchema = z.object({
  folder_id: z.string().uuid().optional(),
  debtor_name: z.string().min(2, 'Ism kamida 2 ta belgi'),
  debtor_phone: z.string().regex(/^\+998\d{9}$/, 'Telefon format: +998XXXXXXXXX'),
  amount: z.number().positive('Summa musbat bo\'lishi kerak'),
  debt_date: z.string().optional(),
  due_date: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, plan_type')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check plan limits (only active debts count)
    const { count } = await supabase
      .from('debts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .in('status', ['pending', 'overdue'])
      .is('deleted_at', null)

    const limits: Record<string, number> = {
      free: 50,
      plus: 500,
      pro: 999999,
    }

    const maxDebts = limits[profile.plan_type] || 50

    if (count && count >= maxDebts) {
      return NextResponse.json(
        { error: `Maksimal ${maxDebts} ta aktiv qarz. Tarifni yangilang.` },
        { status: 403 }
      )
    }

    // Get default folder if not provided
    let folderId = result.data.folder_id

    if (!folderId) {
      const { data: defaultFolder } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', profile.id)
        .eq('is_default', true)
        .single()

      folderId = defaultFolder?.id
    }

    // Create debt
    const { data: debt, error } = await supabase
      .from('debts')
      .insert({
        user_id: profile.id,
        folder_id: folderId,
        debtor_name: result.data.debtor_name,
        debtor_phone: result.data.debtor_phone,
        amount: result.data.amount,
        paid_amount: 0,
        debt_date: result.data.debt_date || new Date().toISOString().split('T')[0],
        due_date: result.data.due_date,
        note: result.data.note,
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