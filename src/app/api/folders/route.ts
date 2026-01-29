// src/app/api/folders/route.ts
// GET - List all folders for current user
// POST - Create new folder

import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET - List folders
export async function GET() {
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

    // Get folders with debt counts
    const { data: folders, error } = await supabase
      .from('folders')
      .select(`
        *,
        debts:debts(count)
      `)
      .eq('user_id', profile.id)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Folders fetch error:', error)
      return NextResponse.json({ error: 'Folders olishda xato' }, { status: 500 })
    }

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Folders GET error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// POST - Create folder
const createFolderSchema = z.object({
  name: z.string().min(1, 'Nom kiritilmagan').max(100, 'Nom juda uzun'),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createFolderSchema.safeParse(body)

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

    // Check plan limits
    const { count } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    const limits: Record<string, number> = {
      free: 2,
      plus: 10,
      pro: 999,
    }

    const maxFolders = limits[profile.plan_type] || 2

    if (count && count >= maxFolders) {
      return NextResponse.json(
        { error: `Maksimal ${maxFolders} ta folder yaratish mumkin. Tarifni yangilang.` },
        { status: 403 }
      )
    }

    // Get max order_index
    const { data: lastFolder } = await supabase
      .from('folders')
      .select('order_index')
      .eq('user_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const newOrderIndex = (lastFolder?.order_index || 0) + 1

    // Create folder
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: profile.id,
        name: result.data.name,
        color: result.data.color || '#3B82F6',
        icon: result.data.icon || 'folder',
        order_index: newOrderIndex,
        is_default: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Folder create error:', error)
      return NextResponse.json({ error: 'Folder yaratishda xato' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Folders POST error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}