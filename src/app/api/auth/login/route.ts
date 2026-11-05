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
          maxAge: 60 * 60 * 24 * 30, // 30 kun
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

      if (profile.is_active === false) {
        return NextResponse.json(
          { error: "Akkauntingiz vaqtincha to'xtatilgan. Do'kon ma'muriyatiga murojaat qiling." },
          { status: 403 }
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
        maxAge: 60 * 60 * 24 * 30, // 30 kun
      })

      return response
    }

    // 3. Cashier Login (Phone or Username + Password)
    if (auth_method === 'cashier') {
      const { identifier, password } = body
      if (!identifier || !password) {
        return NextResponse.json(
          { error: "Telefon/foydalanuvchi nomi va parol kiritilishi shart" },
          { status: 400 }
        )
      }

      const raw = String(identifier).trim()
      const cleanPhone = raw.startsWith('+') ? raw : '+998' + raw.replace(/\D/g, '')

      // Look up cashier by phone or username
      let { data: profile } = await adminSupabase
        .from('users')
        .select('*')
        .or(`phone.eq.${cleanPhone},username.ilike.${raw}`)
        .maybeSingle()

      if (!profile) {
        return NextResponse.json(
          { error: "Kassir hisobi topilmadi. Ma'lumotlarni tekshiring." },
          { status: 404 }
        )
      }

      if (profile.is_active === false) {
        return NextResponse.json(
          { error: "Ushbu kassir hisobi do'kon egasi tomonidan vaqtincha to'xtatilgan." },
          { status: 403 }
        )
      }

      const cashierEmail = profile.email || `cashier_${(profile.phone || '').replace(/\D/g, '')}@debtbook.uz`

      // Authenticate via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cashierEmail,
        password,
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: "Kassir paroli noto'g'ri kiritildi" },
          { status: 401 }
        )
      }

      const role = profile.locale_settings?.role || 'cashier'
      const store_owner_id = profile.locale_settings?.store_owner_id || profile.id
      const permissions = profile.locale_settings?.permissions || ['*']

      const response = NextResponse.json({
        success: true,
        user: authData.user,
        profile: {
          ...profile,
          role,
          store_owner_id,
          permissions,
        },
      })

      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()

      allCookies.forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 kun
        })
      })

      // Also set phone session cookie as backup
      response.cookies.set('phone_user_session', profile.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 kun
      })

      return response
    }

    return NextResponse.json({ error: "Noto'g'ri autentifikatsiya usuli" }, { status: 400 })
  } catch (error) {
    console.error('❌ Login API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
