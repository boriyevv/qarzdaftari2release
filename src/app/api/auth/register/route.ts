// src/app/api/auth/register/route.ts
// Updated - supports both email and phone registration

import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { smsService } from '@/src/lib/services/sms.service'

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

    // Validate based on auth method
    const schema = auth_method === 'phone' ? phoneRegisterSchema : emailRegisterSchema
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = result.data
    const supabase = await createClient()

    // Check if phone exists (for both methods)
    if (data.phone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', data.phone)
        .single()

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' },
          { status: 400 }
        )
      }
    }

    // EMAIL REGISTRATION
    if (auth_method === 'email' && 'password' in data && 'email' in data) {
      // Check username
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Bu username band' },
          { status: 400 }
        )
      }

      // Check email
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' },
          { status: 400 }
        )
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
          },
        },
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Ro\'yxatdan o\'tishda xato' },
          { status: 400 }
        )
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        username: data.username,
        store_name: data.store_name,
        auth_method: 'email',
        phone_verified: false,
      })

      if (profileError) {
        console.error('Profile error:', profileError)
        return NextResponse.json(
          { error: 'Profile yaratishda xato' },
          { status: 500 }
        )
      }

      // Get profile and create defaults
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authData.user.id)
        .single()

      if (profile) {
        await supabase.from('folders').insert({
          user_id: profile.id,
          name: 'Qarzlar',
          is_default: true,
          order_index: 0,
        })

        await supabase.from('sms_credits').insert({
          user_id: profile.id,
          balance: 0,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
        auth_method: 'email',
      })
    }

    // PHONE REGISTRATION
    if (auth_method === 'phone' && 'otp_verified' in data) {
      if (!data.otp_verified) {
        return NextResponse.json(
          { error: 'Telefon raqamni tasdiqlang' },
          { status: 400 }
        )
      }

      // Generate username from phone
      const username = `user_${data.phone.slice(-8)}`

      // Create Supabase auth user (phone-based, no password)
      const randomPassword = Math.random().toString(36).slice(-16)
      const tempEmail = `${username}@qarzdaftari.temp`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: randomPassword,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            auth_method: 'phone',
          },
        },
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: 'Ro\'yxatdan o\'tishda xato' },
          { status: 400 }
        )
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        full_name: data.full_name,
        phone: data.phone,
        username,
        store_name: data.store_name,
        auth_method: 'phone',
        phone_verified: true,
        email: data.email || null,
      })

      if (profileError) {
        console.error('Profile error:', profileError)
        return NextResponse.json(
          { error: 'Profile yaratishda xato' },
          { status: 500 }
        )
      }

      // Get profile and create defaults
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authData.user.id)
        .single()

      if (profile) {
        await supabase.from('folders').insert({
          user_id: profile.id,
          name: 'Qarzlar',
          is_default: true,
          order_index: 0,
        })

        await supabase.from('sms_credits').insert({
          user_id: profile.id,
          balance: 0,
        })

        // Send welcome SMS
        await smsService.sendWelcome(data.phone, data.full_name)
      }

      return NextResponse.json({
        success: true,
        message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
        auth_method: 'phone',
      })
    }

    return NextResponse.json(
      { error: 'Noto\'g\'ri ma\'lumotlar' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}