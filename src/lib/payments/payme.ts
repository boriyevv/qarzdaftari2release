// src/lib/payments/payme.ts

export interface PaymePaymentParams {
  amount: number // in sum (NOT tiyin)
  userId: string
  planType: string
  returnUrl: string
}

export class PaymePayment {
  private merchantId: string
  private secretKey: string

  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID!
    this.secretKey = process.env.PAYME_SECRET_KEY!
  }

  // ─── Checkout URL ────────────────────────────────────────────────

  generatePaymentUrl(params: PaymePaymentParams): string {
    const { amount, userId, planType, returnUrl } = params
    const amountTiyin = Math.round(amount * 100)

    const paramsString = [
      `m=${this.merchantId}`,
      `ac.user_id=${userId}`,
      `ac.plan_type=${planType}`,
      `a=${amountTiyin}`,
      `c=${returnUrl}`,
    ].join(';')

    const base64 = Buffer.from(paramsString).toString('base64')

    // Test yoki production
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://checkout.paycom.uz'
      : 'https://checkout.test.paycom.uz'

    return `${baseUrl}/${base64}`
  }
  // ─── Authorization ───────────────────────────────────────────────

  verifyAuthorization(authHeader: string): boolean {
    if (!authHeader?.startsWith('Basic ')) return false
    try {
      const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
      const [login, password] = decoded.split(':')
      return login === this.merchantId && password === this.secretKey
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

    if (!amount || amount < 49900) {
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

    const detail = {
      receipt_type: 0,
      items: [
        {
          title: `Qarz Daftari ${plan_type} obuna`,
          price: amount,
          count: 1,
          code: '10399002001000000', //  Ахборот-коммуникация технологиялари соҳасида (шу жумладан, Интернет жаҳон ахборот тармоғи орқали) таълим бериш хизматлари
          package_code: '1545637',
          vat_percent: 12,
        },
      ],
    }

    return { result: { allow: true, detail } }
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
      transaction.status === 'completed' ? 2
        : transaction.status === 'cancelled' ? -1
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