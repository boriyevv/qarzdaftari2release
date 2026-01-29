// src/lib/services/otp.service.ts
// OTP Code Management Service

import { createClient } from '@/src/lib/supabase/server'

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
    try {
      const supabase = await createClient()

      // Check rate limit
      const { data: rateLimit } = await supabase
        .from('otp_rate_limits')
        .select('*')
        .eq('phone', phone)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (rateLimit) {
        // Check if blocked
        if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
          return {
            code: '',
            error: 'Juda ko\'p urinish. Keyinroq qayta urinib ko\'ring.',
          }
        }

        // Check daily limit (10 per day)
        if (rateLimit.request_count >= 10) {
          // Block for 1 hour
          await supabase
            .from('otp_rate_limits')
            .update({
              blocked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            })
            .eq('id', rateLimit.id)

          return {
            code: '',
            error: 'Kunlik limit oshdi. 1 soatdan keyin urinib ko\'ring.',
          }
        }

        // Increment counter
        await supabase
          .from('otp_rate_limits')
          .update({
            request_count: rateLimit.request_count + 1,
            last_request_at: new Date().toISOString(),
          })
          .eq('id', rateLimit.id)
      } else {
        // Create new rate limit entry
        await supabase.from('otp_rate_limits').insert({
          phone,
          ip_address: ipAddress,
          request_count: 1,
        })
      }

      // Invalidate old unused codes
      await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('phone', phone)
        .eq('type', type)
        .eq('used', false)

      // Generate new code
      const code = this.generateCode()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Store OTP
      const { error: insertError } = await supabase.from('otp_codes').insert({
        phone,
        code,
        type,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      if (insertError) {
        console.error('OTP insert error:', insertError)
        return { code: '', error: 'Kod yaratishda xato' }
      }

      return { code }
    } catch (error) {
      console.error('Create OTP error:', error)
      return { code: '', error: 'Server xatosi' }
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
    try {
      const supabase = await createClient()

      // Find OTP
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
        return { valid: false, error: 'Kod muddati tugagan. Yangi kod so\'rang.' }
      }

      // Check attempts
      if (otp.attempts >= otp.max_attempts) {
        return { valid: false, error: 'Juda ko\'p urinish. Yangi kod so\'rang.' }
      }

      // Verify code
      if (otp.code !== code) {
        // Increment attempts
        await supabase
          .from('otp_codes')
          .update({ attempts: otp.attempts + 1 })
          .eq('id', otp.id)

        return {
          valid: false,
          error: `Kod noto'g'ri. ${otp.max_attempts - otp.attempts - 1} ta urinish qoldi.`,
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
      const supabase = await createClient()

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