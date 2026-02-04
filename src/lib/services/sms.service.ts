// src/lib/services/sms.service.ts
// Eskiz.uz SMS Service - ENHANCED VERSION

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
  private readonly sender = process.env.ESKIZ_FROM || '4546'
  private readonly isTestMode = process.env.ESKIZ_TEST_MODE === 'true'

  constructor() {
    console.log('🔧 SMS Service initialized:', {
      email: this.email ? '✅ SET' : '❌ NOT SET',
      password: this.password ? '✅ SET' : '❌ NOT SET',
      sender: this.sender,
      isTestMode: this.isTestMode
    })
  }

  /**
   * Get auth token (cache for 28 days)
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      console.log('🔑 Using cached Eskiz token')
      return this.token
    }

    if (!this.email || !this.password) {
      throw new Error('Eskiz credentials not configured')
    }

    try {
      console.log('🔐 Requesting new Eskiz token...')
      
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
        throw new Error(`Eskiz auth failed: ${errorData.message || response.statusText}`)
      }

      const data: EskizAuthResponse = await response.json()
      
      if (!data.data?.token) {
        throw new Error('No token in response')
      }

      this.token = data.data.token
      // Cache for 28 days (Eskiz tokens expire in 30 days)
      this.tokenExpiry = Date.now() + (28 * 24 * 60 * 60 * 1000)
      
      console.log('✅ Eskiz token obtained and cached')
      return this.token
    } catch (error: any) {
      console.error('❌ Eskiz auth error:', error)
      throw new Error(`SMS service unavailable: ${error.message}`)
    }
  }

  /**
   * Send SMS via Eskiz.uz
   * @returns Eskiz message ID or null
   */
  async sendSMS(phone: string, message: string): Promise<string | null> {
    try {
      console.log('📱 Preparing to send SMS:', { 
        phone, 
        messageLength: message.length,
        isTestMode: this.isTestMode 
      })
      
      // Format phone (remove + and spaces)
      const formattedPhone = phone.replace(/[\s+]/g, '')

      // Validate phone format
      if (!formattedPhone.match(/^998\d{9}$/)) {
        throw new Error('Invalid phone format. Expected: 998XXXXXXXXX')
      }

      const token = await this.getToken()

      const response = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: formattedPhone,
          message: message,
          from: this.sender,
        }),
      })

      const data: EskizSendResponse = await response.json()
      
      console.log('📬 Eskiz response:', {
        status: response.status,
        responseData: data
      })

      // Handle token expiration
      if (response.status === 401 || data.message?.includes('Unauthenticated')) {
        console.log('🔄 Token expired, retrying with new token...')
        this.token = null
        this.tokenExpiry = 0
        return this.sendSMS(phone, message) // Retry once
      }

      if (!response.ok || data.status === 'error') {
        throw new Error(`SMS send failed: ${data.message}`)
      }
      
      console.log('✅ SMS sent successfully! ID:', data.id)
      return data.id || null
    } catch (error: any) {
      console.error('❌ SMS send error:', error)
      throw error
    }
  }

  /**
   * Send OTP code
   */
  async sendOTP(phone: string, code: string): Promise<boolean> {
    const message = this.isTestMode 
      ? `Bu Eskiz dan test`
      : `Qarz Daftari: Tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`
    
    try {
      await this.sendSMS(phone, message)
      
      // Test mode: show code in console
      if (this.isTestMode) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔑 OTP CODE:', code)
        console.log('📱 Phone:', phone)
        console.log('💬 SMS text:', message)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
      
      return true
    } catch (error) {
      console.error('❌ OTP send error:', error)
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
        console.log('💬 Welcome SMS sent (test mode):', { phone, name })
      }
      
      return true
    } catch (error) {
      console.error('❌ Welcome SMS error:', error)
      return false
    }
  }

  /**
   * Send debt notification (when debt is created)
   */
  async sendDebtNotification(
    phone: string, 
    debtorName: string, 
    amount: number, 
    shopName?: string,
    dueDate?: string
  ): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('uz-UZ')
    const shopText = shopName ? ` "${shopName}"` : ''
    const dueDateText = dueDate 
      ? ` To'lov muddati: ${new Date(dueDate).toLocaleDateString('uz-UZ')}.` 
      : ''
    
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Hurmatli ${debtorName}, Siz${shopText}dan ${formattedAmount} so'm qarz oldingiz.${dueDateText} Aloqa uchun: Qarz Daftari.`
    
    try {
      await this.sendSMS(phone, message)
      
      if (this.isTestMode) {
        console.log('💬 Debt notification (test):', { phone, debtorName, amount })
      }
      
      return true
    } catch (error) {
      console.error('❌ Debt notification error:', error)
      return false
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    phone: string, 
    debtorName: string, 
    amount: number, 
    dueDate: string
  ): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('uz-UZ')
    const formattedDate = new Date(dueDate).toLocaleDateString('uz-UZ')
    
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Hurmatli ${debtorName}, ${formattedAmount} so'm qarzingizni ${formattedDate} sanasigacha to'lashingizni eslatib o'tamiz. Qarz Daftari.`
    
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('❌ Payment reminder error:', error)
      return false
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    phone: string, 
    debtorName: string, 
    amount: number
  ): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('uz-UZ')
    
    const message = this.isTestMode
      ? `Bu Eskiz dan test`
      : `Hurmatli ${debtorName}, ${formattedAmount} so'm to'lovingiz qabul qilindi. Rahmat! Qarz Daftari.`
    
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('❌ Payment confirmation error:', error)
      return false
    }
  }

  /**
   * Send custom message
   */
  async sendCustomMessage(phone: string, message: string): Promise<boolean> {
    try {
      await this.sendSMS(phone, message)
      return true
    } catch (error) {
      console.error('❌ Custom message error:', error)
      return false
    }
  }

  /**
   * Get SMS balance from Eskiz
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
      const balance = data.data?.sms_count || 0
      
      console.log('💰 Eskiz balance:', balance)
      return balance
    } catch (error) {
      console.error('❌ Balance check error:', error)
      return 0
    }
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!(this.email && this.password)
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      testMode: this.isTestMode,
      sender: this.sender,
      hasToken: !!this.token,
      tokenValid: this.token && Date.now() < this.tokenExpiry,
    }
  }
}

// Singleton instance
export const smsService = new SMSService()