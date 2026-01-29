// src/app/api/folders/route.ts
import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder nomi kerak'),
  color: z.string().default('#3B82F6'),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('📁 Fetching folders for user:', user.id)

    // Get user profile
    let profile = null
    
    // Try auth_id first (email users)
    const { data: authProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (authProfile) {
      profile = authProfile
    } else if (user.phone) {
      // Try phone (phone-only users)
      const { data: phoneProfile } = await supabase
        .from('users')
        .select('id')
        .eq('phone', user.phone)
        .single()
      
      profile = phoneProfile
    }

    if (!profile) {
      console.error('❌ Profile not found for user:', user.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('✅ Profile found:', profile.id)

    // Get folders
    const { data: folders, error: foldersError } = await supabase
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
        const { count, error: countError } = await supabase
          .from('debts')
          .select('id', { count: 'exact', head: true })
          .eq('folder_id', folder.id)
          .is('deleted_at', null)

        if (countError) {
          console.error('Count error for folder', folder.id, ':', countError)
        }

        console.log(`📊 Folder "${folder.name}" has ${count || 0} debts`)

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
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

    // Get user profile
    let profile = null
    
    const { data: authProfile } = await supabase
      .from('users')
      .select('id, plan_type')
      .eq('auth_id', user.id)
      .single()

    if (authProfile) {
      profile = authProfile
    } else if (user.phone) {
      const { data: phoneProfile } = await supabase
        .from('users')
        .select('id, plan_type')
        .eq('phone', user.phone)
        .single()
      
      profile = phoneProfile
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check folder limit based on plan
    const { count: folderCount } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    const limits: Record<string, number> = {
      FREE: 2,
      PLUS: 10,
      PRO: 999,
    }

    const limit = limits[profile.plan_type] || 2

    if ((folderCount || 0) >= limit) {
      return NextResponse.json(
        { error: `Folder limiti oshdi (${limit} ta)` },
        { status: 400 }
      )
    }

    // Get max order_index
    const { data: maxFolder } = await supabase
      .from('folders')
      .select('order_index')
      .eq('user_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxFolder?.order_index || 0) + 1

    // Create folder
    const { data: folder, error: createError } = await supabase
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