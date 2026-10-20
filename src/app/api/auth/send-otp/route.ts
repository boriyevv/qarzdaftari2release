// src/app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { otpService } from '@/lib/services/otp.service'
import { smsService } from '@/lib/services/sms.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon format: +998XXXXXXXXX'),
  type: z.enum(['registration', 'login', 'password_reset']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('📱 Send OTP request:', body)

    // Validate
    const result = sendOTPSchema.safeParse(body)
    if (!result.success) {
      console.error('❌ Validation error:', result.error.issues[0].message)
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phone, type } = result.data

    // Get IP and User Agent
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('🔑 Creating OTP...')

    // Create OTP
    const { code, error } = await otpService.createOTP(
      phone,
      type,
      ipAddress,
      userAgent
    )

    console.log('📝 OTP created:', code ? 'SUCCESS' : 'FAILED', error || '')

    if (error) {
      console.error('❌ OTP creation error:', error)
      return NextResponse.json({ error }, { status: 400 })
    }

    console.log('📤 Sending SMS...')

    // Send SMS
    const sent = await smsService.sendOTP(phone, code)

    console.log('📬 SMS sent:', sent ? 'SUCCESS' : 'FAILED')

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "SMS yuborishda xato: SMS xizmati vaqtincha band yoki hisob balansi yetarli emas. Iltimos, Email orqali tezkor ro'yxatdan o'ting.",
          suggestEmail: true,
        },
        { status: 500 }
      )
    }

    // In development or test mode, return code for testing
    const isTestOrDev =
      process.env.NODE_ENV === 'development' ||
      process.env.ESKIZ_TEST_MODE === 'true'
    const devCode = isTestOrDev ? { code, isTestMode: true } : {}

    return NextResponse.json({
      success: true,
      message: 'SMS kod yuborildi',
      ...devCode,
    })
  } catch (error) {
    console.error('❌ Send OTP error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
