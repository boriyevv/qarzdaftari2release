// src/app/api/payments/payme/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { paymePayment } from '@/lib/payments/payme'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Authorization tekshirish
    const authHeader = request.headers.get('Authorization')
    console.log('🔑 Auth header:', authHeader)

    if (!authHeader || !paymePayment.verifyAuthorization(authHeader)) {
      return NextResponse.json({
        error: {
          code: -32504,
          message: {
            ru: 'Недостаточно привилегий',
            uz: 'Ruxsat yo\'q',
            en: 'Insufficient privilege',
          },
          data: null,
        },
      })
    }

    const body = await request.json()
    const { method, params, id } = body

    console.log('🔔 Payme webhook:', method, params)

    const supabase = createAdminClient()

    let result: any

    switch (method) {
      case 'CheckPerformTransaction':
        result = await paymePayment.checkPerformTransaction(params, supabase)
        break

      case 'CreateTransaction':
        result = await paymePayment.createTransaction(params, supabase)
        break

      case 'PerformTransaction':
        result = await paymePayment.performTransaction(params, supabase)
        if (result.result?.state === 2) {
          // Payme PerformTransaction payload only has `id`.
          // Retrieve the account info saved during CreateTransaction from payment_transactions:
          const { data: tx } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('external_id', params.id)
            .maybeSingle()

          const account = tx?.external_data?.account ?? params.account ?? {}
          const userId = tx?.user_id ?? account.user_id
          const planType = account.plan_type
          const parsed = parsePaymentOrder(planType, userId)

          if (parsed) {
            await processSuccessfulPayment(supabase, {
              provider: 'payme',
              order: parsed,
              amount: tx?.amount ?? (params.amount || 0) / 100,
              externalId: params.id,
              externalData: tx?.external_data ?? params,
              transactionRecordId: tx?.id,
            })
          }
        }
        break

      case 'CancelTransaction':
        result = await paymePayment.cancelTransaction(params, supabase)
        break

      case 'CheckTransaction':
        result = await paymePayment.checkTransaction(params, supabase)
        break

      case 'GetStatement':
        result = await paymePayment.getStatement(params, supabase)
        break

      default:
        result = {
          error: {
            code: -32601,
            message: {
              ru: 'Метод не найден',
              uz: 'Metod topilmadi',
              en: 'Method not found',
            },
            data: method,
          },
        }
    }

    // Payme RPC formatida javob — id ni qaytarish shart
    return NextResponse.json({ ...result, id })
  } catch (error) {
    console.error('❌ Payme webhook error:', error)
    return NextResponse.json({
      error: {
        code: -32400,
        message: {
          ru: 'Системная ошибка',
          uz: 'Tizim xatosi',
          en: 'System error',
        },
        data: null,
      },
    })
  }
}
