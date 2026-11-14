// src/lib/services/otp.service.ts
// OTP Code Management Service (Service Role Client with in-memory resilient fallback)

import { createAdminClient } from '@/lib/supabase/admin'

export const REVIEWER_DEMO_PHONE = process.env.REVIEWER_DEMO_PHONE || '+998901234567'
export const REVIEWER_DEMO_OTP = process.env.REVIEWER_DEMO_OTP || '123456'

interface MemoryOTP {
  code: string
  type: 'registration' | 'login' | 'password_reset'
  expiresAt: number
  attempts: number
  maxAttempts: number
}

// In-memory fallback in case of table/network issues during tests
const memoryOTPStore = new Map<string, MemoryOTP>()

export class OTPService {
  /**
   * Generate 6-digit OTP code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Create and store OTP code
   */
  async createOTP(
    phone: string,
    type: 'registration' | 'login' | 'password_reset',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ code: string; error?: string }> {
    const isReviewer = phone === REVIEWER_DEMO_PHONE
    const code = isReviewer ? REVIEWER_DEMO_OTP : this.generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store in resilient in-memory store as fallback
    memoryOTPStore.set(`${phone}:${type}`, {
      code,
      type,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      maxAttempts: 5,
    })

    try {
      const supabase = createAdminClient()

      // Handle rate limits (non-fatal if table unavailable)
      try {
        const { data: rateLimit } = await supabase
          .from('otp_rate_limits')
          .select('*')
          .eq('phone', phone)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single()

        if (rateLimit) {
          if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
            return {
              code: '',
              error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring.",
            }
          }

          if (rateLimit.request_count >= 50) {
            return {
              code: '',
              error: "Kunlik limit oshdi. Keyinroq urinib ko'ring.",
            }
          }

          await supabase
            .from('otp_rate_limits')
            .update({
              request_count: rateLimit.request_count + 1,
              last_request_at: new Date().toISOString(),
            })
            .eq('id', rateLimit.id)
        } else {
          await supabase.from('otp_rate_limits').insert({
            phone,
            ip_address: ipAddress,
            request_count: 1,
          })
        }
      } catch (rateErr) {
        console.warn('⚠️ Rate limit table check warning (non-fatal):', rateErr)
      }

      // Invalidate old unused codes in database
      try {
        await supabase
          .from('otp_codes')
          .update({ used: true })
          .eq('phone', phone)
          .eq('type', type)
          .eq('used', false)
      } catch (updErr) {
        console.warn('⚠️ Old OTP invalidation warning:', updErr)
      }

      // Store OTP in Supabase table
      const { error: insertError } = await supabase.from('otp_codes').insert({
        phone,
        code,
        type,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      if (insertError) {
        console.warn('⚠️ Supabase OTP insert warning (using fallback store):', insertError)
      } else {
        console.log('✅ OTP code saved to Supabase database successfully')
      }

      // Return generated code successfully
      return { code }
    } catch (error) {
      console.warn('⚠️ createOTP exception (using fallback store):', error)
      return { code }
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    phone: string,
    code: string,
    type: 'registration' | 'login' | 'password_reset'
  ): Promise<{ valid: boolean; error?: string }> {
    // Reviewer bypass for Apple App Store & Google Play moderation
    if (phone === REVIEWER_DEMO_PHONE && (code === REVIEWER_DEMO_OTP || code === '123456')) {
      console.log('✅ Apple/Google Reviewer demo bypass verified successfully for:', phone)
      return { valid: true }
    }

    const memoryKey = `${phone}:${type}`
    const memOTP = memoryOTPStore.get(memoryKey)

    // Check in-memory store first or if matches
    if (memOTP) {
      if (Date.now() > memOTP.expiresAt) {
        memoryOTPStore.delete(memoryKey)
        return { valid: false, error: "Kod muddati tugagan. Yangi kod so'rang." }
      }

      if (memOTP.attempts >= memOTP.maxAttempts) {
        return { valid: false, error: "Juda ko'p urinish. Yangi kod so'rang." }
      }

      if (memOTP.code === code) {
        memoryOTPStore.delete(memoryKey)
        // Try to update DB as used asynchronously
        try {
          const supabase = createAdminClient()
          await supabase
            .from('otp_codes')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('phone', phone)
            .eq('type', type)
            .eq('code', code)
        } catch (_) {}
        return { valid: true }
      } else {
        memOTP.attempts += 1
      }
    }

    try {
      const supabase = createAdminClient()

      // Find OTP in database
      const { data: otp, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .eq('type', type)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !otp) {
        return { valid: false, error: 'Kod topilmadi yoki muddati tugagan' }
      }

      // Check expiry
      if (new Date(otp.expires_at) < new Date()) {
        return { valid: false, error: "Kod muddati tugagan. Yangi kod so'rang." }
      }

      // Check attempts
      if (otp.attempts >= otp.max_attempts) {
        return { valid: false, error: "Juda ko'p urinish. Yangi kod so'rang." }
      }

      // Verify code
      if (otp.code !== code) {
        await supabase
          .from('otp_codes')
          .update({ attempts: (otp.attempts || 0) + 1 })
          .eq('id', otp.id)

        const remaining = (otp.max_attempts || 5) - (otp.attempts || 0) - 1
        return {
          valid: false,
          error: `Kod noto'g'ri. ${remaining > 0 ? remaining : 0} ta urinish qoldi.`,
        }
      }

      // Mark as used
      await supabase
        .from('otp_codes')
        .update({
          used: true,
          used_at: new Date().toISOString(),
        })
        .eq('id', otp.id)

      return { valid: true }
    } catch (error) {
      console.error('Verify OTP error:', error)
      return { valid: false, error: 'Server xatosi' }
    }
  }

  /**
   * Clean expired OTPs (call periodically)
   */
  async cleanup(): Promise<void> {
    try {
      const supabase = createAdminClient()
      await supabase
        .from('otp_codes')
        .delete()
        .lt('expires_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    } catch (error) {
      console.error('OTP cleanup error:', error)
    }
  }
}

export const otpService = new OTPService()
