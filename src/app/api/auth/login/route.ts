// src/app/api/auth/login/route.ts
// Updated - supports both email and phone login
// Phone login works for ANY user with phone (email or phone auth_method)

import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Email login schema
const emailLoginSchema = z.object({
  auth_method: z.literal('email'),
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi'),
})

// Phone login schema
const phoneLoginSchema = z.object({
  auth_method: z.literal('phone'),
  phone: z.string().regex(/^\+998\d{9}$/),
  otp_verified: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const auth_method = body.auth_method || 'email'

    console.log('🔐 Login attempt:', auth_method, body.email || body.phone)

    const supabase = await createClient()

    // ============================================
    // EMAIL LOGIN (with Supabase Auth)
    // ============================================
    if (auth_method === 'email') {
      const result = emailLoginSchema.safeParse(body)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        )
      }

      const { email, password } = result.data

      // Supabase auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📧 Email auth result:', authError ? 'ERROR' : 'SUCCESS')

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: 'Email yoki parol noto\'g\'ri' },
          { status: 401 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Login xatosi' },
          { status: 401 }
        )
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single()

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        return NextResponse.json(
          { error: 'Profile topilmadi' },
          { status: 404 }
        )
      }

      // Get SMS credits
      const { data: smsCredits } = await supabase
        .from('sms_credits')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      return NextResponse.json({
        success: true,
        user: authData.user,
        profile: {
          ...profile,
          sms_credits: smsCredits,
        },
        auth_method: 'email',
      })
    }

    // ============================================
    // PHONE LOGIN (OTP-based, works for ANY user)
    // ============================================
    if (auth_method === 'phone') {
      const result = phoneLoginSchema.safeParse(body)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        )
      }

      const { phone, otp_verified } = result.data

      if (!otp_verified) {
        return NextResponse.json(
          { error: 'OTP tasdiqlanmagan' },
          { status: 400 }
        )
      }

      console.log('📱 Phone login:', phone)

      // Find user by phone (ANY auth_method - email OR phone!)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single()

      console.log('👤 Profile found:', profile ? 'YES' : 'NO', profile?.auth_method || 'N/A')

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        return NextResponse.json(
          { error: 'Bu telefon raqam ro\'yxatdan o\'tmagan' },
          { status: 404 }
        )
      }

      // Get SMS credits
      const { data: smsCredits } = await supabase
        .from('sms_credits')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      // If user has Supabase auth (email method), sign them in
      if (profile.auth_id) {
        console.log('✅ User has auth_id, signing in via Supabase')
        
        // Get auth user
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(
          profile.auth_id
        )

        return NextResponse.json({
          success: true,
          user: authUser,
          profile: {
            ...profile,
            sms_credits: smsCredits,
          },
          auth_method: 'phone',
        })
      }

      // Phone-only user (no Supabase auth)
      console.log('✅ Phone-only user, no Supabase auth')
      
      return NextResponse.json({
        success: true,
        profile: {
          ...profile,
          sms_credits: smsCredits,
        },
        auth_method: 'phone',
      })
    }

    return NextResponse.json(
      { error: 'Noto\'g\'ri ma\'lumotlar' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}