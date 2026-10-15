// src/app/api/payments/uzum/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parsePaymentOrder } from '@/lib/payments/common'
import { processSuccessfulPayment } from '@/lib/payments/common'
import { createClient } from '@/lib/supabase/server'
import { UzumAcquiringCallbackData, uzumPayment } from '@/lib/payments/uzum'

export const dynamic = 'force-dynamic'

/**
 * Uzum Checkout acquiring webhook handler.
 * Spec: https://developer.uzumbank.uz/en/checkout/#tag/Callbacks
 * Payload Schema: AcquiringCallbackData
 */
export async function POST(request: NextRequest) {
  try {
    const body: UzumAcquiringCallbackData & Record<string, any> = await request.json()

    console.log('🔔 Uzum acquiring webhook received:', body)

    const orderId = body.orderId || body.order_id
    const orderNumber = body.orderNumber || body.order_id
    const operationState = body.operationState || (body.status === 'completed' ? 'SUCCESS' : body.status)
    const operationType = body.operationType || 'COMPLETE'

    if (!orderId && !orderNumber) {
      console.warn('⚠️ Uzum callback missing both orderId and orderNumber:', body)
      return NextResponse.json({ error: 'Missing order identifier' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Resolve pending transaction from payment_transactions
    let tx: any = null

    if (orderId) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('external_id', orderId)
        .maybeSingle()
      tx = data
    }

    if (!tx && orderNumber) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('external_id', orderNumber)
        .maybeSingle()
      tx = data
    }

    // 2. Resolve parsed order metadata
    let parsedOrder = tx?.external_data?.order
    if (!parsedOrder && tx?.external_data?.rawTransactionId) {
      parsedOrder = parsePaymentOrder(tx.external_data.rawTransactionId)
    }
    if (!parsedOrder && orderNumber) {
      parsedOrder = parsePaymentOrder(orderNumber)
    }

    // 3. Handle successful transaction
    const isSuccess =
      operationState === 'SUCCESS' &&
      (operationType === 'COMPLETE' || operationType === 'AUTHORIZE' || operationType === 'TOP_UP_COMPLETED')

    if (isSuccess) {
      console.log(`✅ Uzum payment confirmed for order ${orderId || orderNumber}`)

      // Determine amount in UZS
      let finalAmount = tx?.amount
      if (!finalAmount && orderId && uzumPayment.isConfigured()) {
        try {
          const statusResp = await uzumPayment.getOrderStatus(orderId)
          if (statusResp?.completedAmount || statusResp?.amount) {
            finalAmount = (statusResp.completedAmount || statusResp.amount) / 100 // convert tiyin to UZS
          }
        } catch (statusErr) {
          console.warn('⚠️ Could not fetch order status from Uzum API:', statusErr)
        }
      }
      if (!finalAmount && body.amount) {
        finalAmount = parseFloat(body.amount)
      }

      if (parsedOrder) {
        await processSuccessfulPayment(supabase, {
          provider: 'uzum',
          order: parsedOrder,
          amount: finalAmount || 0,
          externalId: orderId || orderNumber,
          externalData: body,
          transactionRecordId: tx?.id,
        })
      } else {
        console.warn('⚠️ Unable to parse order metadata for Uzum transaction:', {
          orderId,
          orderNumber,
          externalData: tx?.external_data,
        })
      }
    } else if (operationState === 'FAIL' || body.status === 'failed' || body.status === 'cancelled') {
      console.log(`❌ Uzum payment failed or cancelled for order ${orderId || orderNumber}`)
      if (tx?.id) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            external_data: {
              ...(tx.external_data || {}),
              failed_callback: body,
            },
          })
          .eq('id', tx.id)
      }
    }

    // Uzum Checkout requires HTTP 200 OK confirmation
    return NextResponse.json({ status: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('❌ Uzum webhook error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}