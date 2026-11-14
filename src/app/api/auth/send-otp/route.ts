// src/app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { otpService, REVIEWER_DEMO_PHONE, REVIEWER_DEMO_OTP } from '@/lib/services/otp.service'
import { smsService } from '@/lib/services/sms.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureReviewerDemoAccount } from '@/lib/services/reviewer-demo.service'

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
    const isReviewer = phone === REVIEWER_DEMO_PHONE
    const adminSupabase = createAdminClient()

    // 0. Handle Apple & Google App Store Reviewer Demo Account
    if (isReviewer) {
      console.log('🍏 Apple/Google App Store Reviewer demo phone detected:', phone)
      await ensureReviewerDemoAccount()

      // Return static demo OTP immediately without sending real SMS
      return NextResponse.json({
        success: true,
        code: REVIEWER_DEMO_OTP,
        smsSent: true,
        message: 'Reviewer demo kodi tayyorlandi',
      })
    }

    // 1. If LOGIN: Check if phone number is registered
    if (type === 'login') {
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id, full_name')
        .eq('phone', phone)
        .maybeSingle()

      if (!existingUser) {
        console.log(`⚠️ Login OTP blocked: Phone ${phone} is not registered`)
        return NextResponse.json(
          {
            error: "Ushbu telefon raqam bilan hisob topilmadi. Iltimos, avval ro'yxatdan o'ting.",
            notRegistered: true,
          },
          { status: 404 }
        )
      }
    }

    // 2. If REGISTRATION: Check if phone number is already registered
    if (type === 'registration') {
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()

      if (existingUser) {
        console.log(`⚠️ Registration OTP blocked: Phone ${phone} is already registered`)
        return NextResponse.json(
          {
            error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring.",
            alreadyRegistered: true,
          },
          { status: 400 }
        )
      }
    }

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

    if (error) {
      console.error('❌ OTP creation error:', error)
      return NextResponse.json({ error }, { status: 400 })
    }

    // Always log OTP code prominently in server terminal console
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🔑 [SMS OTP CODE FOR CONSOLE]: ${code}`)
    console.log(`📱 Telefon raqam: ${phone}`)
    console.log(`🎯 Amaliyot turi: ${type}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📤 Sending SMS...')

    // Send SMS via Eskiz (if configured and active)
    let sent = false
    try {
      sent = await smsService.sendOTP(phone, code)
    } catch (smsErr) {
      console.warn('⚠️ Eskiz dispatch error:', smsErr)
    }

    console.log('📬 SMS sent status:', sent ? 'SUCCESS' : 'FAILED')

    // In production without Eskiz test mode, NEVER leak OTP code in response body
    const isDevOrTest =
      process.env.NODE_ENV !== 'production' ||
      process.env.ESKIZ_TEST_MODE === 'true'

    return NextResponse.json({
      success: true,
      code: isDevOrTest ? code : undefined,
      smsSent: sent,
      message: sent
        ? 'SMS kod telefoningizga yuborildi'
        : isDevOrTest
        ? "Eskiz to'lovisiz sinov rejimi: Kod tayyorlandi va ekranga chiqarildi"
        : 'SMS kod telefoningizga yuborildi',
    })
  } catch (error) {
    console.error('❌ Send OTP error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
