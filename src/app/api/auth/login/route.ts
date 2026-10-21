// src/app/api/auth/login/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const auth_method = body.auth_method || 'email'

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Email + Password Login
    if (auth_method === 'email') {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 })
      }

      const { data: profile } = await adminSupabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single()

      const response = NextResponse.json({
        success: true,
        user: authData.user,
        profile,
      })

      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()

      allCookies.forEach((cookie) => {
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

    // 2. Phone + OTP Login
    if (auth_method === 'phone') {
      const { phone, otp_verified } = body

      if (!phone || !otp_verified) {
        return NextResponse.json(
          { error: "Telefon raqami yoki tasdiqlash kodi kiritilmagan" },
          { status: 400 }
        )
      }

      console.log('📱 Phone login request for:', phone)

      // Look up user profile in database using admin client to bypass RLS
      const { data: profile, error: profileError } = await adminSupabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()

      if (profileError) {
        console.error('❌ Profile lookup error:', profileError)
        return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
      }

      if (!profile) {
        return NextResponse.json(
          { error: "Ushbu telefon raqam bilan foydalanuvchi topilmadi. Avval ro'yxatdan o'ting." },
          { status: 404 }
        )
      }

      const response = NextResponse.json({
        success: true,
        profile,
      })

      // Set secure session cookie for phone authenticated user
      response.cookies.set('phone_user_session', profile.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 kun
      })

      return response
    }

    return NextResponse.json({ error: "Noto'g'ri autentifikatsiya usuli" }, { status: 400 })
  } catch (error) {
    console.error('❌ Login API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
