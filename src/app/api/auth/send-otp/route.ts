// src/app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { otpService } from '@/src/lib/services/otp.service'
import { smsService } from '@/src/lib/services/sms.service'

const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon format: +998XXXXXXXXX'),
  type: z.enum(['registration', 'login', 'password_reset']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate
    const result = sendOTPSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phone, type } = result.data

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create OTP
    const { code, error } = await otpService.createOTP(
      phone,
      type,
      ipAddress,
      userAgent
    )

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Send SMS
    const sent = await smsService.sendOTP(phone, code)

    if (!sent) {
      return NextResponse.json(
        { error: 'SMS yuborishda xato' },
        { status: 500 }
      )
    }

    // In development, return code for testing
    const devCode = process.env.NODE_ENV === 'development' ? { code } : {}

    return NextResponse.json({
      success: true,
      message: 'SMS kod yuborildi',
      ...devCode,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}