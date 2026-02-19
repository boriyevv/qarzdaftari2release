// src/app/api/auth/login/route.ts

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const auth_method = body.auth_method || 'email'

    const supabase = await createClient()

    if (auth_method === 'email') {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: 'Email yoki parol noto\'g\'ri' }, { status: 401 })
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single()

      // ✅ Cookie'larni response'ga qo'shish
      const response = NextResponse.json({
        success: true,
        user: authData.user,
        profile,
      })

      // Session cookie'larini olish va response'ga qo'shish
      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()
      
      allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 kun
        })
      })

      return response
    }

    // ... phone login ham xuddi shunday
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}