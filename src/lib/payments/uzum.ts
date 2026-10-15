// src/lib/payments/uzum.ts
import crypto from 'crypto'
import { parsePaymentOrder, ParsedPaymentOrder } from './common'

/**
 * Uzum Checkout API v1.10.3 integration
 * Official documentation: https://developer.uzumbank.uz/en/checkout/
 */

export interface UzumCartItem {
  name: string
  count: number
  sum: number // Amount in tiyins (1 UZS = 100 tiyins)
  spic?: string // IKPU / MXIK product classification code from tasnif.soliq.uz
  packageCode?: string // Package code from tasnif.soliq.uz
  vatPercent?: number // VAT percentage (e.g. 0 or 12)
}

export interface UzumCart {
  cartId: string
  receiptType?: number // 1: Sales receipt, 2: Prepaid, etc.
  items: UzumCartItem[]
  total: number // Total cost in tiyins
}

export interface UzumRegisterPaymentParams {
  amount: number // In UZS sums (will be converted to tiyins)
  clientId: string // User ID in merchant system
  orderNumber?: string // Merchant order ID (strictly 1 to 36 characters)
  returnUrl: string
  failureUrl?: string
  paymentDetails?: string
  sessionTimeoutSecs?: number // 600 - 1800 seconds (default: 1200)
  cart?: UzumCart
}

export interface UzumPaymentParams {
  amount: number // In UZS sums
  userId: string
  planType?: string
  transactionId?: string
  returnUrl: string
  supabase?: any
}

export interface UzumAcquiringCallbackData {
  orderId: string
  orderNumber: string
  operationState: 'SUCCESS' | 'FAIL'
  operationType: 'AUTHORIZE' | 'COMPLETE' | 'REFUND' | 'REVERSE' | 'TOP_UP_COMPLETED'
  cardType?: 1 | 2 // 1: Corporate, 2: Personal
  rrn?: string
  merchantOperationId?: string
}

export interface UzumGetOrderStatusResponse {
  orderId: string
  status:
    | 'REGISTERED'
    | 'AUTHORIZED'
    | 'TOP_UP_COMPLETED'
    | 'COMPLETED'
    | 'REFUNDED'
    | 'REVERSED'
    | 'DECLINED'
  merchantOrderId: string
  amount: number // in tiyins
  totalAmount: number
  completedAmount: number
  refundedAmount: number
  reversedAmount: number
  actionCode?: number
}

export class UzumPayment {
  private baseUrl: string
  private terminalId: string
  private apiKey: string
  private lang: string

  constructor() {
    this.baseUrl = process.env.UZUM_BASE_URL || 'https://checkout.uzumbank.uz'
    // Support official credentials with fallbacks to legacy env names
    this.terminalId = process.env.UZUM_TERMINAL_ID || process.env.UZUM_SERVICE_ID || ''
    this.apiKey = process.env.UZUM_API_KEY || process.env.UZUM_SECRET_KEY || ''
    this.lang = process.env.UZUM_LANG || 'uz-UZ'
  }

  /**
   * Registers a one-step payment session via Uzum Checkout API:
   * POST /api/v1/payment/register
   * Returns orderId and paymentRedirectUrl
   */
  async registerPayment(params: UzumRegisterPaymentParams): Promise<{
    paymentUrl: string
    orderId: string
    orderNumber: string
  }> {
    if (!this.terminalId || !this.apiKey) {
      throw new Error(
        'Uzum credentials missing: Please configure UZUM_TERMINAL_ID and UZUM_API_KEY in environment variables.'
      )
    }

    // Uzum strictly enforces orderNumber maxLength of 36 chars
    const orderNumber =
      params.orderNumber && params.orderNumber.length <= 36
        ? params.orderNumber
        : crypto.randomUUID()

    // Uzum amounts are strictly in tiyins (1 UZS = 100 tiyins)
    const amountInTiyin = Math.round(params.amount * 100)

    const payload: Record<string, any> = {
      amount: amountInTiyin,
      currency: 860, // UZS ISO 4217 numeric code
      clientId: params.clientId,
      orderNumber,
      viewType: 'REDIRECT',
      paymentParams: {
        payType: 'ONE_STEP',
      },
      sessionTimeoutSecs: params.sessionTimeoutSecs || 1200,
      successUrl: params.returnUrl,
      failureUrl:
        params.failureUrl ||
        `${params.returnUrl}${params.returnUrl.includes('?') ? '&' : '?'}status=failed`,
    }

    if (params.paymentDetails) {
      payload.paymentDetails = params.paymentDetails
    }

    if (params.cart) {
      payload.merchantParams = {
        cart: params.cart,
      }
    }

    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/v1/payment/register`

    console.log('🚀 Uzum payment/register request:', {
      endpoint,
      orderNumber,
      amountInTiyin,
      clientId: params.clientId,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Terminal-Id': this.terminalId,
        'X-API-Key': this.apiKey,
        'Content-Language': this.lang,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Uzum register payment HTTP error:', response.status, errorText)
      throw new Error(`Uzum registration failed with HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('📥 Uzum register payment response:', data)

    if (data.errorCode !== 0 || !data.result?.paymentRedirectUrl) {
      throw new Error(
        `Uzum registration rejected (code ${data.errorCode}): ${data.message || 'Unknown error'}`
      )
    }

    return {
      paymentUrl: data.result.paymentRedirectUrl,
      orderId: data.result.orderId,
      orderNumber,
    }
  }

  /**
   * Generates a payment URL for Uzum Checkout.
   * - Records a pending transaction with the 36-char orderNumber UUID
   * - Registers the session via POST /api/v1/payment/register
   * - Updates transaction with Uzum orderId and returns redirect URL
   */
  async generatePaymentUrl(params: UzumPaymentParams): Promise<string> {
    const { amount, userId, planType, transactionId: customTxId, returnUrl, supabase } = params

    // Generate compliant 36-character UUID for Uzum orderNumber
    const orderNumber = crypto.randomUUID()

    const rawTransactionId = customTxId
      ? customTxId
      : planType && planType.startsWith(userId)
      ? planType
      : `${userId}_${planType || 'PLUS'}_${Date.now()}`

    const parsedOrder = parsePaymentOrder(rawTransactionId, userId)

    let txRecordId: string | number | undefined

    // If Supabase client was provided, pre-create a pending transaction
    if (supabase) {
      try {
        const { data: insertedTx, error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            provider: 'uzum',
            amount,
            status: 'pending',
            external_id: orderNumber,
            external_data: {
              orderNumber,
              rawTransactionId,
              order: parsedOrder,
            },
          })
          .select('id')
          .maybeSingle()

        if (!txError && insertedTx) {
          txRecordId = insertedTx.id
        }
      } catch (err) {
        console.warn('⚠️ Could not insert pending Uzum payment_transaction:', err)
      }
    }

    const failureUrl = returnUrl.includes('?')
      ? `${returnUrl}&payment=failed`
      : `${returnUrl}?payment=failed`

    // Call Uzum API to register session
    const regResult = await this.registerPayment({
      amount,
      clientId: userId,
      orderNumber,
      returnUrl,
      failureUrl,
      paymentDetails: `Qarz Daftari: ${planType || 'Subscription'}`,
    })

    // Update pending transaction with Uzum's orderId
    if (supabase) {
      try {
        await supabase
          .from('payment_transactions')
          .update({
            external_id: regResult.orderId,
            external_data: {
              orderNumber,
              orderId: regResult.orderId,
              paymentRedirectUrl: regResult.paymentUrl,
              rawTransactionId,
              order: parsedOrder,
            },
          })
          .eq(txRecordId ? 'id' : 'external_id', txRecordId || orderNumber)
      } catch (updateErr) {
        console.warn('⚠️ Could not update Uzum payment_transaction with orderId:', updateErr)
      }
    }

    return regResult.paymentUrl
  }

  /**
   * Retrieves the current status of an order via Uzum Checkout API:
   * POST /api/v1/payment/getOrderStatus
   */
  async getOrderStatus(orderId: string): Promise<UzumGetOrderStatusResponse> {
    if (!this.terminalId || !this.apiKey) {
      throw new Error(
        'Uzum credentials missing: Please configure UZUM_TERMINAL_ID and UZUM_API_KEY in environment variables.'
      )
    }

    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/v1/payment/getOrderStatus`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Terminal-Id': this.terminalId,
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({ orderId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Uzum getOrderStatus failed with HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    if (data.errorCode !== 0 || !data.result) {
      throw new Error(
        `Uzum getOrderStatus rejected (code ${data.errorCode}): ${data.message || 'Unknown error'}`
      )
    }

    return data.result
  }

  /**
   * Performs full or partial refund via Uzum Checkout API:
   * POST /api/v1/acquiring/refund
   */
  async refundPayment(orderId: string, amount: number, cart?: any): Promise<any> {
    if (!this.terminalId || !this.apiKey) {
      throw new Error(
        'Uzum credentials missing: Please configure UZUM_TERMINAL_ID and UZUM_API_KEY in environment variables.'
      )
    }

    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/v1/acquiring/refund`
    const payload: any = {
      orderId,
      amount: Math.round(amount * 100), // in tiyins
    }
    if (cart) payload.cart = cart

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Terminal-Id': this.terminalId,
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Uzum refund failed with HTTP ${response.status}: ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Helper to verify if Uzum credentials are configured
   */
  isConfigured(): boolean {
    return Boolean(this.terminalId && this.apiKey)
  }
}

// Singleton instance
export const uzumPayment = new UzumPayment()