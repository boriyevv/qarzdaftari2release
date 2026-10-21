// src/app/api/folders/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder nomi kerak'),
  color: z.string().default('#3B82F6'),
})

export async function GET() {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    console.log('📁 Fetching folders for user:', profile.id)

    // Get folders
    const { data: folders, error: foldersError } = await adminSupabase
      .from('folders')
      .select('*')
      .eq('user_id', profile.id)
      .order('order_index')

    if (foldersError) {
      console.error('❌ Folders error:', foldersError)
      return NextResponse.json({ error: 'Folders fetch failed' }, { status: 500 })
    }

    console.log('📂 Found folders:', folders?.length || 0)

    // Get debt counts for each folder
    const foldersWithCounts = await Promise.all(
      (folders || []).map(async (folder) => {
        const { count, error: countError } = await adminSupabase
          .from('debts')
          .select('id', { count: 'exact', head: true })
          .eq('folder_id', folder.id)
          .is('deleted_at', null)

        if (countError) {
          console.error('Count error for folder', folder.id, ':', countError)
        }

        return {
          ...folder,
          debt_count: count || 0,
        }
      })
    )

    return NextResponse.json({ folders: foldersWithCounts })
  } catch (error) {
    console.error('❌ Folders API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUser()
    if (!profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const result = createFolderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Check folder limit based on plan
    const { count: folderCount } = await adminSupabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    const limits: Record<string, number> = {
      FREE: 2,
      PLUS: 10,
      PRO: 999,
    }

    const userPlan = (profile.plan_type || 'FREE').toUpperCase()
    const limit = limits[userPlan] || 2

    if ((folderCount || 0) >= limit) {
      return NextResponse.json(
        { error: `Folder limiti oshdi (${limit} ta)` },
        { status: 400 }
      )
    }

    // Get max order_index
    const { data: maxFolder } = await adminSupabase
      .from('folders')
      .select('order_index')
      .eq('user_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxFolder?.order_index || 0) + 1

    // Create folder
    const { data: folder, error: createError } = await adminSupabase
      .from('folders')
      .insert({
        user_id: profile.id,
        name: result.data.name,
        color: result.data.color,
        order_index: nextOrder,
        is_default: false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Create error:', createError)
      return NextResponse.json({ error: 'Folder yaratishda xato' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
