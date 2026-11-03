import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { smsService } from '@/lib/services/sms.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Email registration schema
const emailRegisterSchema = z.object({
  auth_method: z.literal('email'),
  full_name: z.string().min(2, 'Ism kamida 2 ta belgi'),
  email: z.string().email('Email noto\'g\'ri'),
  username: z.string().min(3, 'Username kamida 3 ta belgi'),
  store_name: z.string().min(2, 'Do\'kon nomi kamida 2 ta belgi'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi'),
  phone: z.string().optional(),
})

// Phone registration schema
const phoneRegisterSchema = z.object({
  auth_method: z.literal('phone'),
  full_name: z.string().min(2, 'Ism kamida 2 ta belgi'),
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon format: +998XXXXXXXXX'),
  store_name: z.string().min(2, 'Do\'kon nomi kamida 2 ta belgi'),
  otp_verified: z.boolean(),
  email: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const auth_method = body.auth_method || 'email'

    console.log('📝 Registration attempt:', auth_method)

    // Validate based on auth method
    const schema = auth_method === 'phone' ? phoneRegisterSchema : emailRegisterSchema
    const result = schema.safeParse(body)

    if (!result.success) {
      console.error('❌ Validation error:', result.error.issues[0].message)
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = result.data
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Resilient profile inserter that complies with database users_plan_type_check constraint
    const insertUserProfile = async (profilePayload: Record<string, any>) => {
      // 1. Try with 'free' (lowercase)
      let res = await adminSupabase
        .from('users')
        .insert({ ...profilePayload, plan_type: 'free' })
        .select()
        .single()

      // 2. If check constraint fails, try with 'FREE' (uppercase)
      if (res.error && res.error.message?.includes('users_plan_type_check')) {
        console.warn('⚠️ users_plan_type_check constraint triggered for "free", trying "FREE"...')
        res = await adminSupabase
          .from('users')
          .insert({ ...profilePayload, plan_type: 'FREE' })
          .select()
          .single()
      }

      // 3. Fallback: if check constraint still complains, try without plan_type
      if (res.error && res.error.message?.includes('users_plan_type_check')) {
        console.warn('⚠️ Retrying insert without explicit plan_type...')
        res = await adminSupabase
          .from('users')
          .insert(profilePayload)
          .select()
          .single()
      }

      return res
    }

    // Check if phone exists (for both methods)
    if (data.phone) {
      const { data: existingPhone } = await adminSupabase
        .from('users')
        .select('id')
        .eq('phone', data.phone)
        .maybeSingle()

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' },
          { status: 400 }
        )
      }
    }

    // Normalize email if provided
    const candidateEmail =
      data.email && typeof data.email === 'string' && data.email.trim()
        ? data.email.trim().toLowerCase()
        : null

    // Check if email exists (for both methods)
    if (candidateEmail) {
      const { data: existingEmail } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', candidateEmail)
        .maybeSingle()

      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              auth_method === 'phone'
                ? 'Bu email allaqachon boshqa foydalanuvchi tomonidan ro\'yxatdan o\'tkazilgan. Boshqa email kiriting yoki bo\'sh qoldiring.'
                : 'Bu email allaqachon ro\'yxatdan o\'tgan',
          },
          { status: 400 }
        )
      }
    }

    // ============================================
    // EMAIL REGISTRATION (with Supabase Auth)
    // ============================================
    if (auth_method === 'email' && 'password' in data && 'email' in data) {
      console.log('📧 Email registration for:', data.email)

      // Check username
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Bu username band' },
          { status: 400 }
        )
      }

      // Check email
      const { data: existingEmail } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .maybeSingle()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' },
          { status: 400 }
        )
      }

      console.log('🔐 Creating Supabase auth user...')

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone || null,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        },
      })

      if (authError) {
        console.error('❌ Supabase auth error:', authError)
        return NextResponse.json(
          { error: authError.message || 'Ro\'yxatdan o\'tishda xato' },
          { status: 400 }
        )
      }

      if (!authData.user) {
        console.error('❌ No auth user returned')
        return NextResponse.json(
          { error: 'Ro\'yxatdan o\'tishda xato' },
          { status: 400 }
        )
      }

      console.log('✅ Auth user created:', authData.user.id)
      console.log('📝 Creating profile in database...')

      // Create user profile using resilient helper
      const { data: profileData, error: profileError } = await insertUserProfile({
        auth_id: authData.user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        username: data.username,
        store_name: data.store_name,
        auth_method: 'email',
        phone_verified: false,
      })

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        console.error('Error details:', JSON.stringify(profileError, null, 2))
        
        // ROLLBACK: Delete auth user if profile creation fails
        console.log('🔄 Rolling back: deleting auth user...')
        try {
          await adminSupabase.auth.admin.deleteUser(authData.user.id)
          console.log('✅ Auth user deleted (rollback successful)')
        } catch (deleteError) {
          console.error('❌ Rollback failed:', deleteError)
        }
        
        let friendlyMessage = 'Profile yaratishda xato: ' + profileError.message
        if (
          profileError.code === '23505' &&
          (profileError.message?.includes('email') || profileError.details?.includes('email'))
        ) {
          friendlyMessage = 'Bu email allaqachon boshqa foydalanuvchi tomonidan ro\'yxatdan o\'tkazilgan.'
        }
        
        return NextResponse.json(
          { error: friendlyMessage },
          { status: profileError.code === '23505' ? 400 : 500 }
        )
      }

      console.log('✅ Profile created successfully:', profileData.id)

      // Create default folder
      console.log('📁 Creating default folder...')
      const { error: folderError } = await adminSupabase.from('folders').insert({
        user_id: profileData.id,
        name: 'Qarzlar',
        is_default: true,
        order_index: 0,
      })

      if (folderError) {
        console.error('⚠️ Folder creation error:', folderError)
      } else {
        console.log('✅ Default folder created')
      }

      // Create SMS credits
      console.log('💳 Creating SMS credits...')
      const { error: creditsError } = await adminSupabase.from('sms_credits').insert({
        user_id: profileData.id,
        balance: 0,
        total_purchased: 0,
        total_used: 0,
      })

      if (creditsError) {
        console.error('⚠️ SMS credits error:', creditsError)
      } else {
        console.log('✅ SMS credits created')
      }

      console.log('🎉 Email registration complete!')

      return NextResponse.json({
        success: true,
        message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
        auth_method: 'email',
      })
    }

    // ============================================
    // PHONE REGISTRATION (WITHOUT Supabase Auth)
    // ============================================
    if (auth_method === 'phone' && 'otp_verified' in data) {
      console.log('📱 Phone registration for:', data.phone)

      if (!data.otp_verified) {
        return NextResponse.json(
          { error: 'Telefon raqamni tasdiqlang' },
          { status: 400 }
        )
      }

      // Check if phone already exists
      const { data: existingPhone } = await adminSupabase
        .from('users')
        .select('id')
        .eq('phone', data.phone)
        .maybeSingle()

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' },
          { status: 400 }
        )
      }

      // Generate username from phone
      const username = `user_${data.phone.slice(-8)}`

      console.log('📝 Creating phone-only profile...')

      // Create user profile using resilient helper
      const { data: profile, error: profileError } = await insertUserProfile({
        auth_id: null,
        full_name: data.full_name,
        phone: data.phone,
        username,
        store_name: data.store_name,
        auth_method: 'phone',
        phone_verified: true,
        email: candidateEmail,
      })

      if (profileError) {
        console.error('❌ Phone profile error:', profileError)
        if (
          profileError.code === '23505' &&
          (profileError.message?.includes('email') || profileError.details?.includes('email'))
        ) {
          return NextResponse.json(
            {
              error:
                'Bu email allaqachon boshqa hisobda ro\'yxatdan o\'tgan. Iltimos, boshqa email kiriting yoki uni bo\'sh qoldiring.',
            },
            { status: 400 }
          )
        }
        if (
          profileError.code === '23505' &&
          (profileError.message?.includes('phone') || profileError.details?.includes('phone'))
        ) {
          return NextResponse.json(
            { error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Profil yaratishda xato yuz berdi: ' + profileError.message },
          { status: 500 }
        )
      }

      console.log('✅ Phone profile created:', profile.id)

      // Create default folder
      console.log('📁 Creating default folder...')
      const { error: folderError } = await adminSupabase.from('folders').insert({
        user_id: profile.id,
        name: 'Qarzlar',
        is_default: true,
        order_index: 0,
      })

      if (folderError) {
        console.error('⚠️ Folder error:', folderError)
      } else {
        console.log('✅ Folder created')
      }

      // Create SMS credits
      console.log('💳 Creating SMS credits...')
      const { error: creditsError } = await adminSupabase.from('sms_credits').insert({
        user_id: profile.id,
        balance: 0,
        total_purchased: 0,
        total_used: 0,
      })

      if (creditsError) {
        console.error('⚠️ Credits error:', creditsError)
      } else {
        console.log('✅ Credits created')
      }

      // Send welcome SMS
      console.log('📨 Sending welcome SMS...')
      try {
        await smsService.sendWelcome(data.phone, data.full_name)
        console.log('✅ Welcome SMS sent')
      } catch (error) {
        console.error('⚠️ Welcome SMS error:', error)
      }

      console.log('🎉 Phone registration complete!')

      const response = NextResponse.json({
        success: true,
        message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
        auth_method: 'phone',
        user_id: profile.id,
        profile,
      })

      // Set session cookie immediately so user doesn't have to log in again
      response.cookies.set('phone_user_session', profile.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 kun
      })

      return response
    }

    return NextResponse.json(
      { error: 'Noto\'g\'ri ma\'lumotlar' },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ Register API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
