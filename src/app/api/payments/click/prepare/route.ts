// src/app/api/payments/click/prepare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clickPayment, parseClickRequest } from '@/lib/payments/click'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let rawBody: any = null
  try {
    rawBody = await parseClickRequest(request)
    console.log('🔔 [Click Prepare Route] Received:', rawBody)

    // Ensure action=0
    const payload = {
      ...rawBody,
      action: rawBody?.action !== undefined ? String(rawBody.action) : '0',
    }

    const supabase = createAdminClient()
    const response = await clickPayment.handlePrepare(payload, supabase)
    console.log('📤 [Click Prepare Route] Response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Click Prepare Route] Error:', error)
    return NextResponse.json({
      click_trans_id: rawBody?.click_trans_id ?? '',
      merchant_trans_id: rawBody?.merchant_trans_id ?? '',
      merchant_prepare_id: 0,
      error: -7,
      error_note: 'Failed to update user',
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'click_prepare',
    service: 'Qarz Daftari',
  })
}
