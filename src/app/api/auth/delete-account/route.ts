// src/app/api/auth/delete-account/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Avtorizatsiyadan o\'tilmagan' },
        { status: 401 }
      )
    }

    let reason = 'Ilova orqali hisob o\'chirildi'
    try {
      const body = await request.json()
      if (body?.reason && typeof body.reason === 'string') {
        reason = body.reason.slice(0, 500)
      }
    } catch {
      // Body is optional
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()
    const originalPhone = user.phone || ''
    // Archive original phone so it is freed for future registration if desired
    const archivedPhone = originalPhone ? `deleted_${Date.now()}_${originalPhone}` : null

    console.log(`🗑️ Processing account deletion request for user: ${user.id} (${user.phone})`)

    // 1. Mark user as inactive, record deletion timestamp & reason, clear Telegram link and free phone
    const { error: updateError } = await adminSupabase
      .from('users')
      .update({
        is_active: false,
        deletion_requested_at: now,
        deletion_reason: reason,
        telegram_chat_id: null,
        telegram_username: null,
        telegram_linked_at: null,
        phone: archivedPhone || user.phone,
        updated_at: now,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user record for deletion:', updateError)
      return NextResponse.json(
        { error: 'Hisobni o\'chirishda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    // 2. Sign out Supabase auth session if one exists
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch (signOutErr) {
      console.warn('⚠️ Supabase signOut error on delete:', signOutErr)
    }

    const response = NextResponse.json({
      success: true,
      message: 'Hisobingiz muvaffaqiyatli o\'chirildi',
    })

    // 3. Clear phone session cookie and Supabase auth token cookies
    response.cookies.delete('phone_user_session')
    try {
      const cookieStore = await cookies()
      cookieStore.getAll().forEach((c) => {
        if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
          response.cookies.delete(c.name)
        }
      })
    } catch (cookieErr) {
      console.warn('⚠️ Error clearing auth cookies:', cookieErr)
    }

    console.log(`✅ User ${user.id} successfully deactivated and marked for deletion`)
    return response
  } catch (error) {
    console.error('❌ Delete account exception:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
