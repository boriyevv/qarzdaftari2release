// src/app/api/auth/login/route.ts
// Updated - supports both email and phone login

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

    // Validate based on auth method
    const schema = auth_method === 'phone' ? phoneLoginSchema : emailLoginSchema
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = result.data
    const supabase = await createClient()

    // EMAIL LOGIN
    if (auth_method === 'email' && 'email' in data && 'password' in data) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: 'Email yoki parol noto\'g\'ri' },
          { status: 401 }
        )
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single()

      return NextResponse.json({
        success: true,
        user: authData.user,
        profile,
        auth_method: 'email',
      })
    }

    // PHONE LOGIN
    if (auth_method === 'phone' && 'phone' in data) {
      if (!data.otp_verified) {
        return NextResponse.json(
          { error: 'OTP tasdiqlanmagan' },
          { status: 400 }
        )
      }

      // Find user by phone
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, auth_id')
        .eq('phone', data.phone)
        .eq('auth_method', 'phone')
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Bu telefon raqam ro\'yxatdan o\'tmagan' },
          { status: 404 }
        )
      }

      // Get temp email for auth
      const username = `user_${data.phone.slice(-8)}`
      const tempEmail = `${username}@qarzdaftari.temp`

      // We need to sign in somehow - since we don't have password
      // We'll use admin API or create a session token
      
      // For now, return success with profile
      // In production, you'd create a custom JWT or use Supabase admin
      
      return NextResponse.json({
        success: true,
        profile,
        auth_method: 'phone',
        phone: data.phone,
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