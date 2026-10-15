// src/app/api/payments/payme/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { paymePayment } from '@/lib/payments/payme'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

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
          const { user_id, plan_type } = params.account ?? {}
          const parsed = parsePaymentOrder(plan_type, user_id)
          if (parsed) {
            await processSuccessfulPayment(supabase, {
              provider: 'payme',
              order: parsed,
              amount: (params.amount || 0) / 100,
              externalId: params.id,
              externalData: params,
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