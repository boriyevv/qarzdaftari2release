// src/lib/payments/click.ts
import crypto from 'crypto'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { parsePaymentOrder, processSuccessfulPayment } from './common'

export interface ClickPaymentParams {
  amount: number
  userId: string
  planType?: string
  transactionId?: string
  returnUrl: string
}

export interface ClickPrepareResponse {
  click_trans_id: string | number
  merchant_trans_id: string
  merchant_prepare_id: number
  error: number
  error_note: string
}

export interface ClickCompleteResponse {
  click_trans_id: string | number
  merchant_trans_id: string
  merchant_confirm_id: number | null
  error: number
  error_note: string
}

export interface ClickShopApiRequest {
  click_trans_id: string
  service_id: string
  click_paydoc_id: string
  merchant_trans_id: string
  merchant_prepare_id?: string
  amount: string
  action: string
  error: string
  error_note: string
  sign_time: string
  sign_string: string
}

/**
 * Click Shop API error codes per docs.click.uz
 */
export const CLICK_ERRORS = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_DOES_NOT_EXIST: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE_USER: -7,
  REQUEST_ERROR: -8,
  TRANSACTION_CANCELLED: -9,
} as const

export class ClickPayment {
  private merchantId: string
  private serviceId: string
  private secretKey: string
  private merchantUserId: string

  constructor() {
    this.merchantId = process.env.CLICK_MERCHANT_ID || '61732'
    this.serviceId = process.env.CLICK_SERVICE_ID || '104455'
    this.secretKey = process.env.CLICK_SECRET_KEY || '9movgAQjKcSY29Q'
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID || '85700'
  }

  /**
   * Helper: Generate a safe 32-bit integer ID for merchant_prepare_id and merchant_confirm_id.
   * Standard Click systems store these as 32-bit signed integers (max 2,147,483,647).
   */
  private generateSafe32BitId(): number {
    return Math.floor(Date.now() / 1000) % 2147483647
  }

  /**
   * Structured logger as recommended in Click integration instructions
   */
  private log(step: 'PREPARE' | 'COMPLETE', message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const prefix = `[Click API][${timestamp}][${step}]`
    if (data !== undefined) {
      console.log(`${prefix} ${message}:`, JSON.stringify(data, null, 2))
    } else {
      console.log(`${prefix} ${message}`)
    }
  }

  /**
   * Generate payment URL for Click checkout
   */
  generatePaymentUrl(params: ClickPaymentParams): string {
    const { amount, userId, planType, transactionId: customTxId, returnUrl } = params
    const transactionId = customTxId
      ? customTxId
      : planType && planType.startsWith(userId)
      ? planType
      : `${userId}_${planType || 'PLUS'}_${Date.now()}`

    const url = new URL('https://my.click.uz/services/pay')
    url.searchParams.set('service_id', this.serviceId)
    url.searchParams.set('merchant_id', this.merchantId)
    url.searchParams.set('amount', amount.toString())
    url.searchParams.set('transaction_param', transactionId)
    url.searchParams.set('return_url', returnUrl)
    url.searchParams.set('merchant_user_id', this.merchantUserId)

    return url.toString()
  }

  /**
   * Signature verification for Prepare (action=0)
   * Formula: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
   */
  verifyPrepareSignature(params: ClickShopApiRequest): boolean {
    const signString = [
      params.click_trans_id,
      this.serviceId,
      this.secretKey,
      params.merchant_trans_id,
      params.amount,
      params.action,
      params.sign_time,
    ].join('')

    const hash = crypto.createHash('md5').update(signString).digest('hex')
    const isValid = hash.toLowerCase() === (params.sign_string || '').toLowerCase()

    if (!isValid) {
      this.log('PREPARE', 'Signature mismatch', {
        expectedSignString: signString,
        computedHash: hash,
        receivedSign: params.sign_string,
      })
    }
    return isValid
  }

  /**
   * Signature verification for Complete (action=1)
   * Formula: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
   */
  verifyCompleteSignature(params: ClickShopApiRequest): boolean {
    const signString = [
      params.click_trans_id,
      this.serviceId,
      this.secretKey,
      params.merchant_trans_id,
      params.merchant_prepare_id,
      params.amount,
      params.action,
      params.sign_time,
    ].join('')

    const hash = crypto.createHash('md5').update(signString).digest('hex')
    const isValid = hash.toLowerCase() === (params.sign_string || '').toLowerCase()

    if (!isValid) {
      this.log('COMPLETE', 'Signature mismatch', {
        expectedSignString: signString,
        computedHash: hash,
        receivedSign: params.sign_string,
      })
    }
    return isValid
  }

  /**
   * Handle Prepare request (action=0)
   * Click queries whether the order is valid, amount is correct, and ready to be paid.
   */
  async handlePrepare(
    params: ClickShopApiRequest,
    supabase?: SupabaseClient
  ): Promise<ClickPrepareResponse> {
    this.log('PREPARE', 'Incoming Prepare request', params)

    // 1. Verify Prepare signature
    if (!this.verifyPrepareSignature(params)) {
      const resp = this.prepareErrorResponse(params, CLICK_ERRORS.SIGN_CHECK_FAILED, 'SIGN CHECK FAILED')
      this.log('PREPARE', 'Responding with error', resp)
      return resp
    }

    // 2. Validate Service ID
    if (String(params.service_id) !== String(this.serviceId)) {
      const resp = this.prepareErrorResponse(params, CLICK_ERRORS.ALREADY_PAID, 'Wrong service ID')
      this.log('PREPARE', 'Responding with error (wrong service_id)', resp)
      return resp
    }

    // 3. Validate Amount
    const amount = parseFloat(params.amount)
    if (isNaN(amount) || amount <= 0) {
      const resp = this.prepareErrorResponse(params, CLICK_ERRORS.INCORRECT_AMOUNT, 'Incorrect parameter amount')
      this.log('PREPARE', 'Responding with error (incorrect amount)', resp)
      return resp
    }

    // 4. Handle test requests (e.g. transaction_param=test from Click manual instructions)
    const isTestTx =
      params.merchant_trans_id === 'test' ||
      params.merchant_trans_id.toLowerCase().startsWith('test')

    if (isTestTx) {
      const merchantPrepareId = this.generateSafe32BitId()
      this.log('PREPARE', '🧪 Test transaction handled successfully', {
        merchant_trans_id: params.merchant_trans_id,
        merchant_prepare_id: merchantPrepareId,
      })

      if (supabase) {
        try {
          await supabase.from('payment_transactions').insert({
            user_id: null,
            provider: 'click',
            amount,
            status: 'pending',
            external_id: String(params.click_trans_id),
            external_data: { ...params, merchant_prepare_id: merchantPrepareId, is_test: true },
          })
        } catch (dbErr) {
          // Non-fatal for test transactions
          this.log('PREPARE', 'Test tx DB log note (safe to continue)', dbErr)
        }
      }

      return {
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
        merchant_prepare_id: merchantPrepareId,
        error: CLICK_ERRORS.SUCCESS,
        error_note: 'Success',
      }
    }

    // 5. Parse and validate order
    const parsedOrder = parsePaymentOrder(params.merchant_trans_id)
    if (!parsedOrder || !parsedOrder.userId) {
      const resp = this.prepareErrorResponse(params, CLICK_ERRORS.USER_DOES_NOT_EXIST, 'User does not exist')
      this.log('PREPARE', 'Responding with error (invalid order format)', resp)
      return resp
    }

    // 6. Database checks with Supabase
    if (supabase) {
      try {
        // Verify user exists
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, is_active')
          .eq('id', parsedOrder.userId)
          .maybeSingle()

        if (userError || !user) {
          this.log('PREPARE', 'User not found in database', { userId: parsedOrder.userId, error: userError })
          const resp = this.prepareErrorResponse(params, CLICK_ERRORS.USER_DOES_NOT_EXIST, 'User does not exist')
          return resp
        }

        // Check if transaction is already completed (idempotency guard)
        const { data: existingTx } = await supabase
          .from('payment_transactions')
          .select('id, status, external_data')
          .eq('external_id', String(params.click_trans_id))
          .maybeSingle()

        if (existingTx) {
          if (existingTx.status === 'completed') {
            this.log('PREPARE', 'Transaction already completed', { click_trans_id: params.click_trans_id })
            const resp = this.prepareErrorResponse(params, CLICK_ERRORS.ALREADY_PAID, 'Already paid')
            return resp
          }
          if (existingTx.status === 'pending') {
            const existingPrepareId =
              existingTx.external_data?.merchant_prepare_id || this.generateSafe32BitId()
            this.log('PREPARE', 'Pending transaction re-prepared idempotently', {
              click_trans_id: params.click_trans_id,
              merchant_prepare_id: existingPrepareId,
            })
            return {
              click_trans_id: params.click_trans_id,
              merchant_trans_id: params.merchant_trans_id,
              merchant_prepare_id: existingPrepareId,
              error: CLICK_ERRORS.SUCCESS,
              error_note: 'Success',
            }
          }
        }

        // Create pending payment record
        const merchantPrepareId = this.generateSafe32BitId()
        const { error: insertError } = await supabase.from('payment_transactions').insert({
          user_id: parsedOrder.userId,
          provider: 'click',
          amount,
          status: 'pending',
          external_id: String(params.click_trans_id),
          external_data: {
            ...params,
            order: parsedOrder,
            merchant_prepare_id: merchantPrepareId,
          },
        })

        if (insertError) {
          this.log('PREPARE', '⚠️ Warning: Could not insert pending transaction', insertError)
        }

        this.log('PREPARE', 'Order successfully prepared', {
          click_trans_id: params.click_trans_id,
          merchant_prepare_id: merchantPrepareId,
        })

        return {
          click_trans_id: params.click_trans_id,
          merchant_trans_id: params.merchant_trans_id,
          merchant_prepare_id: merchantPrepareId,
          error: CLICK_ERRORS.SUCCESS,
          error_note: 'Success',
        }
      } catch (err) {
        this.log('PREPARE', '❌ Prepare DB exception', err)
        return this.prepareErrorResponse(params, CLICK_ERRORS.FAILED_TO_UPDATE_USER, 'Failed to update user')
      }
    }

    // Fallback if supabase not provided (e.g. standalone test)
    const merchantPrepareId = this.generateSafe32BitId()
    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      merchant_prepare_id: merchantPrepareId,
      error: CLICK_ERRORS.SUCCESS,
      error_note: 'Success',
    }
  }

  /**
   * Handle Complete request (action=1)
   * Click calls this after payment is processed. error=0 indicates successful payment.
   * error < 0 indicates Click cancelled the transaction.
   */
  async handleComplete(
    params: ClickShopApiRequest,
    supabase?: SupabaseClient
  ): Promise<ClickCompleteResponse> {
    this.log('COMPLETE', 'Incoming Complete request', params)

    // 1. Verify Complete signature
    if (!this.verifyCompleteSignature(params)) {
      const resp = this.completeErrorResponse(params, CLICK_ERRORS.SIGN_CHECK_FAILED, 'SIGN CHECK FAILED')
      this.log('COMPLETE', 'Responding with error', resp)
      return resp
    }

    // 2. Validate Service ID
    if (String(params.service_id) !== String(this.serviceId)) {
      const resp = this.completeErrorResponse(params, CLICK_ERRORS.ALREADY_PAID, 'Wrong service ID')
      this.log('COMPLETE', 'Responding with error (wrong service_id)', resp)
      return resp
    }

    // 3. Handle cancellation from Click (error < 0)
    if (parseInt(params.error) < 0) {
      this.log('COMPLETE', `Payment cancelled by Click with error ${params.error}`)
      if (supabase) {
        await supabase
          .from('payment_transactions')
          .update({ status: 'cancelled', completed_at: new Date().toISOString() })
          .eq('external_id', String(params.click_trans_id))
      }
      return this.completeErrorResponse(params, CLICK_ERRORS.TRANSACTION_CANCELLED, 'Transaction cancelled')
    }

    // 4. Handle test requests
    const isTestTx =
      params.merchant_trans_id === 'test' ||
      params.merchant_trans_id.toLowerCase().startsWith('test')

    if (isTestTx) {
      const merchantConfirmId = this.generateSafe32BitId()
      this.log('COMPLETE', '🧪 Test transaction confirmed successfully', {
        merchant_trans_id: params.merchant_trans_id,
        merchant_confirm_id: merchantConfirmId,
      })

      if (supabase) {
        try {
          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              external_data: { ...params, merchant_confirm_id: merchantConfirmId, is_test: true },
            })
            .eq('external_id', String(params.click_trans_id))
        } catch (dbErr) {
          this.log('COMPLETE', 'Test tx DB update note', dbErr)
        }
      }

      return {
        click_trans_id: params.click_trans_id,
        merchant_trans_id: params.merchant_trans_id,
        merchant_confirm_id: merchantConfirmId,
        error: CLICK_ERRORS.SUCCESS,
        error_note: 'Success',
      }
    }

    // 5. Database lookup & fulfillment with Supabase
    if (supabase) {
      try {
        // Find existing transaction
        const { data: existingTx } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('external_id', String(params.click_trans_id))
          .maybeSingle()

        // Check if already completed (prevent duplicate execution)
        if (existingTx?.status === 'completed') {
          this.log('COMPLETE', 'Duplicate Complete call - transaction already completed', {
            click_trans_id: params.click_trans_id,
          })
          // Click testing suite step 8 expects -4 for duplicate complete
          return this.completeErrorResponse(params, CLICK_ERRORS.ALREADY_PAID, 'Already paid')
        }

        // Resolve order details
        let parsedOrder = existingTx?.external_data?.order
        if (!parsedOrder) {
          parsedOrder = parsePaymentOrder(params.merchant_trans_id)
        }

        if (!parsedOrder || !parsedOrder.userId) {
          this.log('COMPLETE', 'Transaction / user order not found', {
            merchant_trans_id: params.merchant_trans_id,
          })
          return this.completeErrorResponse(params, CLICK_ERRORS.TRANSACTION_NOT_FOUND, 'Transaction not found')
        }

        // Fulfill service via processSuccessfulPayment
        const merchantConfirmId = this.generateSafe32BitId()
        await processSuccessfulPayment(supabase, {
          provider: 'click',
          order: parsedOrder,
          amount: parseFloat(params.amount),
          externalId: String(params.click_trans_id),
          externalData: {
            ...params,
            merchant_confirm_id: merchantConfirmId,
          },
          transactionRecordId: existingTx?.id,
        })

        this.log('COMPLETE', '✅ Payment fulfilled and recorded successfully', {
          click_trans_id: params.click_trans_id,
          merchant_confirm_id: merchantConfirmId,
          userId: parsedOrder.userId,
        })

        return {
          click_trans_id: params.click_trans_id,
          merchant_trans_id: params.merchant_trans_id,
          merchant_confirm_id: merchantConfirmId,
          error: CLICK_ERRORS.SUCCESS,
          error_note: 'Success',
        }
      } catch (err) {
        this.log('COMPLETE', '❌ Complete processing error', err)
        return this.completeErrorResponse(params, CLICK_ERRORS.FAILED_TO_UPDATE_USER, 'Failed to update user')
      }
    }

    const merchantConfirmId = this.generateSafe32BitId()
    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      merchant_confirm_id: merchantConfirmId,
      error: CLICK_ERRORS.SUCCESS,
      error_note: 'Success',
    }
  }

  private prepareErrorResponse(
    params: ClickShopApiRequest,
    error: number,
    error_note: string
  ): ClickPrepareResponse {
    return {
      click_trans_id: params?.click_trans_id ?? '',
      merchant_trans_id: params?.merchant_trans_id ?? '',
      merchant_prepare_id: 0,
      error,
      error_note,
    }
  }

  private completeErrorResponse(
    params: ClickShopApiRequest,
    error: number,
    error_note: string
  ): ClickCompleteResponse {
    return {
      click_trans_id: params?.click_trans_id ?? '',
      merchant_trans_id: params?.merchant_trans_id ?? '',
      merchant_confirm_id: null,
      error,
      error_note,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MERCHANT API METHODS (Client-side / On-site payments via Click)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Click Merchant API Authentication Header
   * Format: merchant_user_id:digest:timestamp
   * Digest: sha1(timestamp + secret_key)
   */
  getMerchantAuthHeader(): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const digest = crypto
      .createHash('sha1')
      .update(`${timestamp}${this.secretKey}`)
      .digest('hex')
    return `${this.merchantUserId}:${digest}:${timestamp}`
  }

  /**
   * Helper to make authenticated requests to Click Merchant API v2
   */
  async merchantRequest<T = any>(endpoint: string, data: any): Promise<T> {
    const cleanEndpoint = endpoint.replace(/^\//, '')
    const url = `https://api.click.uz/v2/merchant/${cleanEndpoint}`
    const authHeader = this.getMerchantAuthHeader()

    console.log(`📡 [Click Merchant API] POST ${url}:`, JSON.stringify(data))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Auth: authHeader,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    console.log(`📥 [Click Merchant API] Response from ${cleanEndpoint}:`, JSON.stringify(result))
    return result as T
  }

  /**
   * 1. Create card token (Step 1 of on-site card payment)
   * Sends card_number and expire_date (MMYY). Click triggers SMS OTP to cardholder.
   */
  async createCardToken(params: {
    cardNumber: string
    expireDate: string // MMYY
    temporary?: number
  }): Promise<{
    error_code: number
    error_note?: string
    card_token?: string
    phone?: string
  }> {
    const cleanCard = params.cardNumber.replace(/\D/g, '')
    const cleanExpire = params.expireDate.replace(/\D/g, '')

    return this.merchantRequest('/card/create', {
      service_id: parseInt(this.serviceId),
      card_number: cleanCard,
      expire_date: cleanExpire,
      temporary: params.temporary ?? 1,
    })
  }

  /**
   * 2. Verify card token with SMS OTP (Step 2 of on-site card payment)
   */
  async verifyCardToken(params: {
    cardToken: string
    smsCode: string | number
  }): Promise<{
    error_code: number
    error_note?: string
  }> {
    return this.merchantRequest('/card/verify', {
      service_id: parseInt(this.serviceId),
      card_token: params.cardToken,
      sms_code: String(params.smsCode).trim(),
    })
  }

  /**
   * 3. Process payment with verified card token (Step 3 of on-site card payment)
   */
  async payWithCardToken(params: {
    cardToken: string
    amount: number
    merchantTransId: string
  }): Promise<{
    error_code: number
    error_note?: string
    payment_id?: number
  }> {
    return this.merchantRequest('/card/payment', {
      service_id: parseInt(this.serviceId),
      card_token: params.cardToken,
      amount: params.amount,
      merchant_trans_id: params.merchantTransId,
    })
  }

  /**
   * 4. Create direct invoice by phone number (Click Up Push Invoice)
   */
  async createInvoice(params: {
    phoneNumber: string
    amount: number
    merchantTransId: string
  }): Promise<{
    error_code: number
    error_note?: string
    invoice_id?: number
  }> {
    const cleanPhone = params.phoneNumber.replace(/\D/g, '')
    return this.merchantRequest('/invoice/create', {
      service_id: parseInt(this.serviceId),
      phone_number: cleanPhone,
      amount: params.amount,
      merchant_trans_id: params.merchantTransId,
    })
  }

  /**
   * 5. Check payment status
   */
  async checkPaymentStatus(paymentId: number | string): Promise<{
    error_code: number
    error_note?: string
    status?: number | string
    payment_id?: number
  }> {
    return this.merchantRequest('/payment/status', {
      service_id: parseInt(this.serviceId),
      payment_id: paymentId,
    })
  }
}

/**
 * Universal body parser for incoming Click HTTP POST requests.
 * Safely handles application/x-www-form-urlencoded, multipart/form-data, and JSON.
 */
export async function parseClickRequest(request: NextRequest): Promise<ClickShopApiRequest> {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await request.json()) as ClickShopApiRequest
  }

  try {
    const formData = await request.formData()
    return Object.fromEntries(formData) as unknown as ClickShopApiRequest
  } catch {
    const text = await request.text()
    const searchParams = new URLSearchParams(text)
    return Object.fromEntries(searchParams.entries()) as unknown as ClickShopApiRequest
  }
}

// Singleton instance
export const clickPayment = new ClickPayment()
