// src/app/api/payments/click/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clickPayment, parseClickRequest } from '@/lib/payments/click'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let rawBody: any = null
  try {
    rawBody = await parseClickRequest(request)
    console.log('🔔 [Click Webhook] Received payload:', rawBody)

    const action = parseInt(rawBody?.action ?? '-1')
    const supabase = createAdminClient()

    // Action 0: Prepare
    if (action === 0) {
      const response = await clickPayment.handlePrepare(rawBody, supabase)
      console.log('📤 [Click Webhook] Prepare response:', response)
      return NextResponse.json(response)
    }

    // Action 1: Complete
    if (action === 1) {
      const response = await clickPayment.handleComplete(rawBody, supabase)
      console.log('📤 [Click Webhook] Complete response:', response)
      return NextResponse.json(response)
    }

    // Invalid action
    console.warn('⚠️ [Click Webhook] Invalid action received:', rawBody?.action)
    return NextResponse.json({
      click_trans_id: rawBody?.click_trans_id ?? '',
      merchant_trans_id: rawBody?.merchant_trans_id ?? '',
      error: -3,
      error_note: 'Action not found',
    })
  } catch (error) {
    console.error('❌ [Click Webhook] Uncaught error:', error)
    return NextResponse.json({
      click_trans_id: rawBody?.click_trans_id ?? '',
      merchant_trans_id: rawBody?.merchant_trans_id ?? '',
      error: -7,
      error_note: 'Failed to update user',
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'click',
    service: 'Qarz Daftari (debtbook.uz)',
    endpoints: {
      webhook: '/api/payments/click/webhook',
      prepare: '/api/payments/click/prepare',
      complete: '/api/payments/click/complete',
    },
    service_id: process.env.CLICK_SERVICE_ID || '104455',
    merchant_id: process.env.CLICK_MERCHANT_ID || '61732',
  })
}
