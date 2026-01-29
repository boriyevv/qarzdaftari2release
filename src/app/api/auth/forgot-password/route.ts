// src/app/api/auth/forgot-password/route.ts
import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }
    
    const { email } = result.data
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    
    if (error) {
      console.error('Password reset error:', error)
    }
    
    // Always return success (security)
    return NextResponse.json({
      success: true,
      message: 'Agar email mavjud bo\'lsa, tiklash havolasi yuborildi',
    })
    
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    )
  }
}