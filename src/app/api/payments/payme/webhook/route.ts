// src/app/api/payments/payme/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { paymePayment } from '@/lib/payments/payme'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Authorization tekshirish
    const authHeader = request.headers.get('Authorization')

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
          await updateSubscription(params, supabase)
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

async function updateSubscription(params: any, supabase: any) {
  try {
    const { user_id, plan_type } = params.account

    if (!user_id || !plan_type) {
      console.error('❌ updateSubscription: user_id yoki plan_type yo\'q', params)
      return
    }

    // Billing cycle aniqlash — plan_type formatida saqlangan bo'lishi mumkin
    // transactionId: userId_PLUS_monthly_timestamp
    const parts = plan_type.split('_')
    const actualPlanType = parts[0] // PLUS yoki PRO
    const billingCycle = parts[1] ?? 'monthly' // monthly, semi_annual, annual

    const months =
      billingCycle === 'annual' ? 12
      : billingCycle === 'semi_annual' ? 6
      : 1

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)

    console.log('📝 Updating subscription:', { user_id, actualPlanType, billingCycle, months })

    // User planini yangilash
    const { error: userError } = await supabase
      .from('users')
      .update({
        plan_type: actualPlanType,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        last_payment_date: new Date().toISOString(),
      })
      .eq('id', user_id)

    if (userError) {
      console.error('❌ User update error:', userError)
      return
    }

    // Tranzaksiyani olish
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('id, amount')
      .eq('external_id', params.id)
      .single()

    // Subscription record yaratish
    await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_type: actualPlanType,
        billing_cycle: billingCycle,
        status: 'active',
        amount: transaction?.amount ?? params.amount / 100,
        currency: 'UZS',
        payment_provider: 'payme',
        payment_transaction_id: transaction?.id ?? null,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    console.log('✅ Subscription updated:', user_id, actualPlanType, billingCycle)
  } catch (error) {
    console.error('❌ updateSubscription error:', error)
  }
}