// src/lib/payments/uzum.ts
import crypto from 'crypto'

export interface UzumPaymentParams {
  amount: number
  userId: string
  planType: string
  returnUrl: string
}

export class UzumPayment {
  private merchantId: string
  private serviceId: string
  private secretKey: string

  constructor() {
    this.merchantId = process.env.UZUM_MERCHANT_ID!
    this.serviceId = process.env.UZUM_SERVICE_ID!
    this.secretKey = process.env.UZUM_SECRET_KEY!
  }

  /**
   * Generate payment URL for Uzum
   * Note: Uzum uses similar format to Click
   */
  generatePaymentUrl(params: UzumPaymentParams): string {
    const { amount, userId, planType, returnUrl } = params

    // Transaction ID format: user_plan_timestamp
    const transactionId = `${userId}_${planType}_${Date.now()}`

    // Uzum payment URL (similar to Click format)
    const url = new URL('https://api.uzum.uz/api/v1/checkout')
    url.searchParams.set('service_id', this.serviceId)
    url.searchParams.set('merchant_id', this.merchantId)
    url.searchParams.set('amount', amount.toString())
    url.searchParams.set('order_id', transactionId)
    url.searchParams.set('return_url', returnUrl)

    return url.toString()
  }

  /**
   * Verify signature from Uzum
   */
  verifySignature(params: any): boolean {
    const signString = [
      params.transaction_id,
      this.serviceId,
      this.secretKey,
      params.order_id,
      params.amount,
      params.status,
    ].join('')

    const hash = crypto
      .createHash('sha256')
      .update(signString)
      .digest('hex')

    return hash === params.signature
  }

  /**
   * Handle payment notification
   */
  async handleNotification(params: any): Promise<any> {
    console.log('🔔 Uzum notification:', params)

    // Verify signature
    if (!this.verifySignature(params)) {
      return this.errorResponse(-1, 'Invalid signature')
    }

    const { status, order_id } = params

    // Parse transaction ID
    const [userId, planType] = order_id.split('_')

    if (!userId || !planType) {
      return this.errorResponse(-5, 'Invalid order ID')
    }

    // Handle different statuses
    switch (status) {
      case 'pending':
        return {
          status: 'success',
          message: 'Payment pending',
        }

      case 'completed':
        // TODO: Update subscription
        // TODO: Save payment transaction
        return {
          status: 'success',
          message: 'Payment completed',
        }

      case 'failed':
        return {
          status: 'success',
          message: 'Payment failed',
        }

      case 'cancelled':
        return {
          status: 'success',
          message: 'Payment cancelled',
        }

      default:
        return this.errorResponse(-3, 'Unknown status')
    }
  }

  private errorResponse(code: number, message: string): any {
    return {
      status: 'error',
      error_code: code,
      error_message: message,
    }
  }
}

// Singleton instance
export const uzumPayment = new UzumPayment()