// src/lib/payments/click.ts
import crypto from 'crypto'

export interface ClickPaymentParams {
  amount: number
  userId: string
  planType: string
  returnUrl: string
}

export interface ClickPrepareResponse {
  click_trans_id: string
  merchant_trans_id: string
  amount: number
  action: number
  error: number
  error_note: string
  sign_time: string
  sign_string: string
}

export interface ClickCompleteResponse {
  click_trans_id: string
  merchant_trans_id: string
  amount: number
  action: number
  error: number
  error_note: string
  sign_time: string
  sign_string: string
  merchant_prepare_id?: string
}

export class ClickPayment {
  private merchantId: string
  private serviceId: string
  private secretKey: string
  private merchantUserId: string

  constructor() {
    this.merchantId = process.env.CLICK_MERCHANT_ID!
    this.serviceId = process.env.CLICK_SERVICE_ID!
    this.secretKey = process.env.CLICK_SECRET_KEY!
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID || '1'
  }

  /**
   * Generate payment URL for Click
   */
  generatePaymentUrl(params: ClickPaymentParams): string {
    const { amount, userId, planType, returnUrl } = params

    // Transaction ID format: user_plan_timestamp
    const transactionId = `${userId}_${planType}_${Date.now()}`

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
   * Verify signature from Click
   */
  verifySignature(params: any): boolean {
    const signString = [
      params.click_trans_id,
      this.serviceId,
      this.secretKey,
      params.merchant_trans_id,
      params.amount,
      params.action,
      params.sign_time,
    ].join('')

    const hash = crypto
      .createHash('md5')
      .update(signString)
      .digest('hex')

    return hash === params.sign_string
  }

  /**
   * Handle prepare request (action=0)
   */
  async handlePrepare(params: any): Promise<ClickPrepareResponse> {
    console.log('📝 Click prepare:', params)

    // Verify signature
    if (!this.verifySignature(params)) {
      return this.errorResponse(params, -1, 'Invalid signature')
    }

    // Parse transaction ID
    const [userId, planType] = params.merchant_trans_id.split('_')

    if (!userId || !planType) {
      return this.errorResponse(params, -5, 'Invalid transaction ID')
    }

    // TODO: Validate user exists
    // TODO: Validate plan type
    // TODO: Check if already paid

    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      amount: params.amount,
      action: 0,
      error: 0,
      error_note: 'Success',
      sign_time: params.sign_time,
      sign_string: params.sign_string,
    }
  }

  /**
   * Handle complete request (action=1)
   */
  async handleComplete(params: any): Promise<ClickCompleteResponse> {
    console.log('✅ Click complete:', params)

    // Verify signature
    if (!this.verifySignature(params)) {
      return this.errorResponse(params, -1, 'Invalid signature')
    }

    // Parse transaction ID
    const [userId, planType] = params.merchant_trans_id.split('_')

    if (!userId || !planType) {
      return this.errorResponse(params, -5, 'Invalid transaction ID')
    }

    // TODO: Update subscription
    // TODO: Save payment transaction
    // TODO: Send notification

    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      amount: params.amount,
      action: 1,
      error: 0,
      error_note: 'Success',
      sign_time: params.sign_time,
      sign_string: params.sign_string,
      merchant_prepare_id: params.merchant_prepare_id,
    }
  }

  private errorResponse(params: any, error: number, error_note: string): any {
    return {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      amount: params.amount,
      action: params.action,
      error,
      error_note,
      sign_time: params.sign_time,
      sign_string: params.sign_string,
    }
  }
}

// Singleton instance
export const clickPayment = new ClickPayment()