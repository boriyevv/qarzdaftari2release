import { parsePaymentOrder } from './common'

export interface PaymePaymentParams {
  amount: number // in sum (NOT tiyin)
  userId: string
  planType: string
  transactionId?: string
  returnUrl: string
}

export class PaymePayment {
  private merchantId: string
  private secretKey: string
  private testKey: string

  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID || '698082dc2b69c9940f33a385'
    this.secretKey = process.env.PAYME_SECRET_KEY || 'JW13I1p#%Mv5UG#EA7I0obh4WK46vmrNz1OH'
    this.testKey = process.env.PAYME_TEST_KEY || 'qnNPJ9eraE6E8?tB@5PX7IBrGSYDFmSPbfik'
  }

  // ─── Payme Subscribe (Card) API ───────────────────────────────────

  private getApiUrl(): string {
    const isTest = process.env.PAYME_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production'
    return isTest ? 'https://test.paycom.uz/api' : 'https://checkout.paycom.uz/api'
  }

  private getAuthHeader(): string {
    const isTest = process.env.PAYME_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production'
    const key = isTest && this.testKey ? this.testKey : this.secretKey
    return `${this.merchantId}:${key}`
  }

  private async callPaymeApi(method: string, params: any) {
    const url = this.getApiUrl()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth': this.getAuthHeader(),
      },
      body: JSON.stringify({
        id: Math.floor(Date.now() / 1000),
        method,
        params,
      }),
    })

    if (!response.ok) {
      throw new Error(`Payme API HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Register card and request SMS OTP
   */
  async createCardToken(params: {
    cardNumber: string
    expireDate: string
  }): Promise<{
    success: boolean
    cardToken?: string
    phone?: string
    wait?: number
    error?: string
    error_code?: number
  }> {
    try {
      const cleanCard = params.cardNumber.replace(/\D/g, '')
      const cleanExpire = params.expireDate.replace(/\D/g, '')

      // 1. Create card
      const resCreate = await this.callPaymeApi('cards.create', {
        card: { number: cleanCard, expire: cleanExpire },
        save: false,
      })

      if (resCreate.error) {
        const errorMsg =
          resCreate.error.message?.uz ||
          resCreate.error.message?.ru ||
          resCreate.error.message ||
          'Karta raqami yoki amal qilish muddati noto\'g\'ri'
        return {
          success: false,
          error: errorMsg,
          error_code: resCreate.error.code,
        }
      }

      const token = resCreate.result?.card?.token
      if (!token) {
        return { success: false, error: 'Karta tokeni olinmadi' }
      }

      // 2. Request OTP verification code
      const resOtp = await this.callPaymeApi('cards.get_verify_code', {
        token,
      })

      if (resOtp.error) {
        const errorMsg =
          resOtp.error.message?.uz ||
          resOtp.error.message?.ru ||
          resOtp.error.message ||
          'SMS tasdiqlash kodini yuborib bo\'lmadi'
        return {
          success: false,
          cardToken: token,
          error: errorMsg,
          error_code: resOtp.error.code,
        }
      }

      return {
        success: true,
        cardToken: token,
        phone: resOtp.result?.phone,
        wait: resOtp.result?.wait || 60000,
      }
    } catch (err: any) {
      console.error('❌ Payme createCardToken error:', err)
      return {
        success: false,
        error: err.message || 'Payme tizimi bilan bog\'lanishda xatolik',
      }
    }
  }

  /**
   * Verify card with SMS OTP and charge the amount
   */
  async verifyAndPayCard(params: {
    cardToken: string
    smsCode: string
    amount: number // in sum
    transactionId: string
    userId: string
    planType?: string
  }): Promise<{
    success: boolean
    paymentId?: string
    error?: string
    error_code?: number
  }> {
    try {
      // 1. Verify card with OTP
      const resVerify = await this.callPaymeApi('cards.verify', {
        token: params.cardToken,
        code: String(params.smsCode).trim(),
      })

      if (resVerify.error) {
        const errorMsg =
          resVerify.error.message?.uz ||
          resVerify.error.message?.ru ||
          resVerify.error.message ||
          'SMS tasdiqlash kodi noto\'g\'ri'
        return {
          success: false,
          error: errorMsg,
          error_code: resVerify.error.code,
        }
      }

      // 2. Create receipt
      const amountTiyin = Math.round(params.amount * 100)
      const resReceipt = await this.callPaymeApi('receipts.create', {
        amount: amountTiyin,
        account: {
          user_id: params.userId,
          plan_type: params.transactionId || params.planType || 'PLUS',
        },
      })

      if (resReceipt.error) {
        const errorMsg =
          resReceipt.error.message?.uz ||
          resReceipt.error.message?.ru ||
          resReceipt.error.message ||
          'Chek yaratishda xatolik'
        return {
          success: false,
          error: errorMsg,
          error_code: resReceipt.error.code,
        }
      }

      const receiptId = resReceipt.result?.receipt?._id
      if (!receiptId) {
        return { success: false, error: 'Chek identifikatori topilmadi' }
      }

      // 3. Pay receipt
      const resPay = await this.callPaymeApi('receipts.pay', {
        id: receiptId,
        token: params.cardToken,
      })

      if (resPay.error) {
        const errorMsg =
          resPay.error.message?.uz ||
          resPay.error.message?.ru ||
          resPay.error.message ||
          'To\'lovni amalga oshirib bo\'lmadi (mablag\' yetarli emas yoki karta bloklangan)'
        return {
          success: false,
          error: errorMsg,
          error_code: resPay.error.code,
        }
      }

      return {
        success: true,
        paymentId: receiptId,
      }
    } catch (err: any) {
      console.error('❌ Payme verifyAndPayCard error:', err)
      return {
        success: false,
        error: err.message || 'To\'lov jarayonida xatolik yuz berdi',
      }
    }
  }

  // ─── Checkout URL ────────────────────────────────────────────────

  generatePaymentUrl(params: PaymePaymentParams): string {
    const { amount, userId, planType, transactionId: customTxId, returnUrl } = params
    const amountTiyin = Math.round(amount * 100)
    const targetPlan = customTxId || planType

    const paramsString = [
      `m=${this.merchantId}`,
      `ac.user_id=${userId}`,
      `ac.plan_type=${targetPlan}`,
      `a=${amountTiyin}`,
      `c=${returnUrl}`,
    ].join(';')

    const base64 = Buffer.from(paramsString).toString('base64')

    // Test yoki production
    const isTest = process.env.PAYME_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production'
    const baseUrl = isTest ? 'https://test.paycom.uz' : 'https://checkout.paycom.uz'

    return `${baseUrl}/${base64}`
  }

  // ─── Authorization ───────────────────────────────────────────────

  verifyAuthorization(authHeader: string): boolean {
    if (!authHeader?.startsWith('Basic ')) return false
    try {
      const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
      const [login, password] = decoded.split(':')
      return (
        login === 'Paycom' &&
        (password === this.secretKey ||
          password === this.testKey ||
          password === process.env.PAYME_SECRET_KEY ||
          password === process.env.PAYME_TEST_KEY ||
          password === 'JW13I1p#%Mv5UG#EA7I0obh4WK46vmrNz1OH' ||
          password === 'qnNPJ9eraE6E8?tB@5PX7IBrGSYDFmSPbfik' ||
          password === 'JW13I1p')
      )
    } catch {
      return false
    }
  }

  // ─── CheckPerformTransaction ─────────────────────────────────────

  async checkPerformTransaction(params: any, supabase: any) {
    const { amount, account } = params
    const { user_id, plan_type } = account ?? {}

    if (!user_id || !plan_type) {
      return this.error(-31050, 'Noto\'g\'ri account', 'user_id')
    }

    if (!amount || amount < 100) {
      return this.error(-31001, 'Noto\'g\'ri summa', 'amount')
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (!user) {
      return this.error(-31050, 'Foydalanuvchi topilmadi', 'user_id')
    }

    const parsedOrder = parsePaymentOrder(plan_type, user_id)
    const itemTitle =
      parsedOrder?.type === 'sms'
        ? `Qarz Daftari ${parsedOrder.credits} ta SMS paketi`
        : `Qarz Daftari ${parsedOrder?.planType || 'PLUS'} obuna`

    return {
      result: {
        allow: true,
        detail: {
          receipt_type: 0,
          items: [
            {
              title: itemTitle,
              price: amount,
              count: 1,
              code: '10399002001000000',
              package_code: '1545637',
              vat_percent: 12,
            },
          ],
        },
      },
    }
  }

  // ─── CreateTransaction ───────────────────────────────────────────

  async createTransaction(params: any, supabase: any) {
    const { id, time, amount, account } = params
    const { user_id, plan_type } = account ?? {}

    // Mavjud tranzaksiyani tekshirish
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', id)
      .single()

    if (existing) {
      return {
        result: {
          create_time: new Date(existing.created_at).getTime(),
          transaction: existing.id,
          state: 1,
        },
      }
    }

    // Yangi tranzaksiya
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        provider: 'payme',
        amount: amount / 100,
        status: 'pending',
        external_id: id,
        external_data: params,
      })
      .select()
      .single()

    if (error || !transaction) {
      return this.error(-32400, 'Tranzaksiya yaratishda xato', null)
    }

    return {
      result: {
        create_time: time,
        transaction: transaction.id,
        state: 1,
      },
    }
  }

  // ─── PerformTransaction ──────────────────────────────────────────

  async performTransaction(params: any, supabase: any) {
    const { id } = params

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', id)
      .single()

    if (!transaction) {
      return this.error(-31003, 'Tranzaksiya topilmadi', null)
    }

    if (transaction.status === 'completed') {
      return {
        result: {
          transaction: transaction.id,
          perform_time: new Date(transaction.completed_at).getTime(),
          state: 2,
        },
      }
    }

    const performTime = Date.now()

    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('external_id', id)

    return {
      result: {
        transaction: transaction.id,
        perform_time: performTime,
        state: 2,
      },
    }
  }

  // ─── CancelTransaction ───────────────────────────────────────────

  async cancelTransaction(params: any, supabase: any) {
    const { id, reason } = params

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', id)
      .single()

    if (!transaction) {
      return this.error(-31003, 'Tranzaksiya topilmadi', null)
    }

    if (transaction.status === 'completed') {
      return this.error(-31008, 'Tugallangan tranzaksiyani bekor qilib bo\'lmaydi', null)
    }

    const cancelTime = Date.now()

    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        external_data: { ...transaction.external_data, cancel_reason: reason },
      })
      .eq('external_id', id)

    return {
      result: {
        transaction: transaction.id,
        cancel_time: cancelTime,
        state: -1,
      },
    }
  }

  // ─── CheckTransaction ────────────────────────────────────────────

  async checkTransaction(params: any, supabase: any) {
    const { id } = params

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', id)
      .single()

    if (!transaction) {
      return this.error(-31003, 'Tranzaksiya topilmadi', null)
    }

    const state =
      transaction.status === 'completed'
        ? 2
        : transaction.status === 'cancelled'
        ? -1
        : 1

    return {
      result: {
        create_time: new Date(transaction.created_at).getTime(),
        perform_time: transaction.completed_at
          ? new Date(transaction.completed_at).getTime()
          : 0,
        cancel_time: 0,
        transaction: transaction.id,
        state,
        reason: null,
      },
    }
  }

  // ─── GetStatement ────────────────────────────────────────────────

  async getStatement(params: any, supabase: any) {
    const { from, to } = params

    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('provider', 'payme')
      .gte('created_at', new Date(from).toISOString())
      .lte('created_at', new Date(to).toISOString())

    const list = (transactions ?? []).map((t: any) => ({
      id: t.external_id,
      time: new Date(t.created_at).getTime(),
      amount: t.amount * 100,
      account: t.external_data?.account ?? {},
      create_time: new Date(t.created_at).getTime(),
      perform_time: t.completed_at ? new Date(t.completed_at).getTime() : 0,
      cancel_time: 0,
      transaction: t.id,
      state: t.status === 'completed' ? 2 : t.status === 'cancelled' ? -1 : 1,
      reason: null,
    }))

    return { result: { transactions: list } }
  }

  // ─── Error helper ────────────────────────────────────────────────

  private error(code: number, message: string, data: any) {
    return {
      error: {
        code,
        message: { ru: message, uz: message, en: message },
        data,
      },
    }
  }
}

export const paymePayment = new PaymePayment()
