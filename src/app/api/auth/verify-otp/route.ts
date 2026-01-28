// src/app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { otpService } from '@/src/lib/services/otp.service'

const verifyOTPSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/),
  code: z.string().length(6, 'Kod 6 ta raqam bo\'lishi kerak'),
  type: z.enum(['registration', 'login', 'password_reset']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate
    const result = verifyOTPSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phone, code, type } = result.data

    // Verify OTP
    const { valid, error } = await otpService.verifyOTP(phone, code, type)

    if (!valid) {
      return NextResponse.json({ error: error || 'Kod noto\'g\'ri' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Kod tasdiqlandi',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}