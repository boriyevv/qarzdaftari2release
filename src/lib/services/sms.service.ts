// src/lib/services/sms.service.ts
// Eskiz.uz SMS Service

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

  /**
   * Get auth token (cache for 29 days)
   */
  private async getToken(): Promise<string> {
    // Check if token is still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      })

      if (!response.ok) {
        throw new Error('Eskiz auth failed')
      }

      const data: EskizAuthResponse = await response.json()
      
      this.token = data.data.token
      // Token valid for 29 days, we cache for 28 days
      this.tokenExpiry = Date.now() + (28 * 24 * 60 * 60 * 1000)
      
      return this.token
    } catch (error) {
      console.error('Eskiz auth error:', error)
      throw new Error('SMS service unavailable')
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(phone: string, message: string): Promise<string | null> {
    // Development mode - simulate sending
    if (process.env.NODE_ENV === 'development' && !this.email) {
      console.log('📱 SMS SIMULATION:', { phone, message })
      return 'dev-message-id'
    }

    try {
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
          from: '4546', // Default Eskiz sender
        }),
      })

      if (!response.ok) {
        throw new Error('SMS send failed')
      }

      const data: EskizSendResponse = await response.json()
      
      return data.id || null
    } catch (error) {
      console.error('SMS send error:', error)
      throw error
    }
  }

  /**
   * Send OTP code
   */
  async sendOTP(phone: string, code: string): Promise<boolean> {
    const message = `Qarz Daftari: Tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`
    
    try {
      await this.sendSMS(phone, message)
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
    const message = `Xush kelibsiz, ${name}! Qarz Daftari platformasiga muvaffaqiyatli ro'yxatdan o'tdingiz.`
    
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('Welcome SMS error:', error)
      return false
    }
  }

  /**
   * Get SMS balance (Eskiz.uz)
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