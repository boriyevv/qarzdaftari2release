// src/app/api/folders/[id]/route.ts
// PATCH - Update folder
// DELETE - Delete folder

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH - Update folder
const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order_index: z.number().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateFolderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
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

    // Check ownership
    const { data: folder } = await supabase
      .from('folders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .single()

    if (!folder) {
      return NextResponse.json({ error: 'Folder topilmadi' }, { status: 404 })
    }

    // Can't rename default folder
    if (folder.is_default && result.data.name) {
      return NextResponse.json(
        { error: 'Default folder nomini o\'zgartirish mumkin emas' },
        { status: 400 }
      )
    }

    // Update folder
    const { data: updated, error } = await supabase
      .from('folders')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Folder update error:', error)
      return NextResponse.json({ error: 'Yangilashda xato' }, { status: 500 })
    }

    return NextResponse.json({ folder: updated })
  } catch (error) {
    console.error('Folders PATCH error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// DELETE - Delete folder
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check ownership
    const { data: folder } = await supabase
      .from('folders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .single()

    if (!folder) {
      return NextResponse.json({ error: 'Folder topilmadi' }, { status: 404 })
    }

    // Can't delete default folder
    if (folder.is_default) {
      return NextResponse.json(
        { error: 'Default folder o\'chirish mumkin emas' },
        { status: 400 }
      )
    }

    // Move debts to default folder
    const { data: defaultFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', profile.id)
      .eq('is_default', true)
      .single()

    if (defaultFolder) {
      await supabase
        .from('debts')
        .update({ folder_id: defaultFolder.id })
        .eq('folder_id', params.id)
    }

    // Delete folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Folder delete error:', error)
      return NextResponse.json({ error: 'O\'chirishda xato' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Folders DELETE error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}