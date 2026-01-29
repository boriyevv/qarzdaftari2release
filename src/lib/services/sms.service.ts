// src/lib/services/sms.service.ts
// Eskiz.uz SMS Service - REAL SMS ONLY

interface EskizAuthResponse {
  message: string
  data: {
    token: string
  }
}

interface EskizSendResponse {
  status: string
  message: string
  id?: string
}

class SMSService {
  private token: string | null = null
  private tokenExpiry: number = 0
  
  private readonly baseUrl = 'https://notify.eskiz.uz/api'
  private readonly email = process.env.ESKIZ_EMAIL || ''
  private readonly password = process.env.ESKIZ_PASSWORD || ''
  private readonly isTestMode = process.env.ESKIZ_TEST_MODE === 'true'

  constructor() {
    console.log('🔧 SMS Service initialized:', {
      email: this.email ? 'SET' : 'NOT SET',
      password: this.password ? 'SET' : 'NOT SET',
      isTestMode: this.isTestMode
    })
  }

  /**
   * Get auth token (cache for 29 days)
   */
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    if (!this.email || !this.password) {
      throw new Error('Eskiz credentials not configured')
    }

    try {
      console.log('🔐 Eskiz auth:', this.email)
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Eskiz auth failed:', errorData)
        throw new Error('Eskiz auth failed')
      }

      const data: EskizAuthResponse = await response.json()
      
      this.token = data.data.token
      this.tokenExpiry = Date.now() + (28 * 24 * 60 * 60 * 1000)
      
      console.log('✅ Eskiz auth success')
      return this.token
    } catch (error) {
      console.error('Eskiz auth error:', error)
      throw new Error('SMS service unavailable')
    }
  }

  /**
   * Send SMS via Eskiz.uz
   */
  async sendSMS(phone: string, message: string): Promise<string | null> {
    try {
      console.log('📱 Sending SMS:', { phone, messageLength: message.length })
      
      const token = await this.getToken()

      const response = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: phone.replace('+', ''),
          message: message,
          from: '4546',
        }),
      })

      const data: EskizSendResponse = await response.json()
      
      console.log('📬 Eskiz response:', {
        status: response.status,
        data: data
      })

      if (!response.ok || data.status === 'error') {
        throw new Error('SMS send failed: ' + data.message)
      }
      
      console.log('✅ SMS sent successfully!')
      return data.id || null
    } catch (error) {
      console.error('❌ SMS send error:', error)
      throw error
    }
  }

  /**
   * Send OTP code
   */
  async sendOTP(phone: string, code: string): Promise<boolean> {
    // Test mode: Eskiz faqat ma'lum textlarni qabul qiladi
    const message = this.isTestMode 
      ? `Bu Eskiz dan test`
      : `Qarz Daftari: Tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`
    
    try {
      await this.sendSMS(phone, message)
      
      // Test mode da console ga haqiqiy kodni chiqaramiz
      if (this.isTestMode) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔑 OTP CODE:', code)
        console.log('📱 Phone:', phone)
        console.log('💬 SMS text:', message)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
      
      return true
    } catch (error) {
      console.error('OTP send error:', error)
      return false
    }
  }

  /**
   * Send welcome message
   */
  async sendWelcome(phone: string, name: string): Promise<boolean> {
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Xush kelibsiz, ${name}! Qarz Daftari platformasiga muvaffaqiyatli ro'yxatdan o'tdingiz. Bizni tanlaganingiz uchun rahmat!`
    
    try {
      await this.sendSMS(phone, message)
      
      if (this.isTestMode) {
        console.log('💬 Welcome SMS (test mode):', { phone, name })
      }
      
      return true
    } catch (error) {
      console.error('Welcome SMS error:', error)
      return false
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phone: string, debtorName: string, amount: number, dueDate: string): Promise<boolean> {
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Hurmatli ${debtorName}, ${amount.toLocaleString()} so'm qarzingizni ${dueDate} sanasigacha to'lashingizni eslatib o'tamiz. Qarz Daftari.`
    
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('Payment reminder error:', error)
      return false
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(phone: string, debtorName: string, amount: number): Promise<boolean> {
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Hurmatli ${debtorName}, ${amount.toLocaleString()} so'm to'lovingiz qabul qilindi. Rahmat! Qarz Daftari.`
    
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return false
    }
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<number> {
    try {
      const token = await this.getToken()

      const response = await fetch(`${this.baseUrl}/user/get-limit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Balance check failed')
      }

      const data = await response.json()
      return data.data?.sms_count || 0
    } catch (error) {
      console.error('Balance check error:', error)
      return 0
    }
  }
}

// Singleton instance
export const smsService = new SMSService()