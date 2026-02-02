// src/lib/payments/payme.ts
import crypto from 'crypto'

export interface PaymePaymentParams {
  amount: number // in tiyin (1 sum = 100 tiyin)
  userId: string
  planType: string
  returnUrl: string
}

export interface PaymeCheckPerformTransactionRequest {
  method: 'CheckPerformTransaction'
  params: {
    amount: number
    account: {
      subscription_id: string
    }
  }
}

export interface PaymeCreateTransactionRequest {
  method: 'CreateTransaction'
  params: {
    id: string
    time: number
    amount: number
    account: {
      subscription_id: string
    }
  }
}

export interface PaymePerformTransactionRequest {
  method: 'PerformTransaction'
  params: {
    id: string
  }
}

export interface PaymeCancelTransactionRequest {
  method: 'CancelTransaction'
  params: {
    id: string
    reason: number
  }
}

export class PaymePayment {
  private merchantId: string
  private secretKey: string
  private minAmount = 100 // 1 sum in tiyin

  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID!
    this.secretKey = process.env.PAYME_SECRET_KEY!
  }

  /**
   * Generate payment URL for Payme
   */
  generatePaymentUrl(params: PaymePaymentParams): string {
    const { amount, userId, planType, returnUrl } = params

    // Transaction ID format: user_plan_timestamp
    const subscriptionId = `${userId}_${planType}_${Date.now()}`

    // Amount in tiyin (1 sum = 100 tiyin)
    const amountTiyin = Math.round(amount * 100)

    // Encode params
    const paramsString = `m=${this.merchantId};ac.subscription_id=${subscriptionId};a=${amountTiyin};c=${returnUrl}`
    const base64Params = Buffer.from(paramsString).toString('base64')

    return `https://checkout.paycom.uz/${base64Params}`
  }

  /**
   * Verify authorization header
   */
  verifyAuthorization(authHeader: string): boolean {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false
    }

    try {
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = Buffer.from(base64Credentials, 'base64').toString()
      const [login, password] = credentials.split(':')

      return login === this.merchantId && password === this.secretKey
    } catch {
      return false
    }
  }

  /**
   * Handle CheckPerformTransaction
   */
  async checkPerformTransaction(params: any): Promise<any> {
    console.log('🔍 Payme CheckPerformTransaction:', params)

    const { amount, account } = params

    // Validate amount
    if (amount < this.minAmount) {
      return this.errorResponse(-31001, 'Incorrect amount')
    }

    // Parse subscription ID
    const subscriptionId = account.subscription_id
    const [userId, planType] = subscriptionId.split('_')

    if (!userId || !planType) {
      return this.errorResponse(-31050, 'Invalid subscription ID')
    }

    // TODO: Validate user exists
    // TODO: Validate plan type
    // TODO: Check if already paid

    return {
      result: {
        allow: true,
      },
    }
  }

  /**
   * Handle CreateTransaction
   */
  async createTransaction(params: any): Promise<any> {
    console.log('📝 Payme CreateTransaction:', params)

    const { id, time, amount, account } = params

    // Parse subscription ID
    const subscriptionId = account.subscription_id
    const [userId, planType] = subscriptionId.split('_')

    // TODO: Save transaction to database
    // State: 1 (created, waiting for payment)

    return {
      result: {
        create_time: time,
        transaction: id,
        state: 1,
      },
    }
  }

  /**
   * Handle PerformTransaction
   */
  async performTransaction(params: any): Promise<any> {
    console.log('✅ Payme PerformTransaction:', params)

    const { id } = params

    // TODO: Update transaction state to 2 (completed)
    // TODO: Update user subscription
    // TODO: Send notification

    return {
      result: {
        transaction: id,
        perform_time: Date.now(),
        state: 2,
      },
    }
  }

  /**
   * Handle CancelTransaction
   */
  async cancelTransaction(params: any): Promise<any> {
    console.log('❌ Payme CancelTransaction:', params)

    const { id, reason } = params

    // TODO: Update transaction state to -1 (cancelled)
    // TODO: Rollback if needed

    return {
      result: {
        transaction: id,
        cancel_time: Date.now(),
        state: -1,
      },
    }
  }

  /**
   * Handle CheckTransaction
   */
  async checkTransaction(params: any): Promise<any> {
    console.log('🔍 Payme CheckTransaction:', params)

    const { id } = params

    // TODO: Get transaction from database

    return {
      result: {
        create_time: Date.now(),
        perform_time: 0,
        cancel_time: 0,
        transaction: id,
        state: 1,
        reason: null,
      },
    }
  }

  /**
   * Handle GetStatement (get transactions list)
   */
  async getStatement(params: any): Promise<any> {
    console.log('📊 Payme GetStatement:', params)

    const { from, to } = params

    // TODO: Get transactions from database

    return {
      result: {
        transactions: [],
      },
    }
  }

  private errorResponse(code: number, message: string): any {
    return {
      error: {
        code,
        message,
        data: null,
      },
    }
  }
}

// Singleton instance
export const paymePayment = new PaymePayment()