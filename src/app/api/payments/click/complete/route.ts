// src/app/api/payments/click/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clickPayment, parseClickRequest } from '@/lib/payments/click'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let rawBody: any = null
  try {
    rawBody = await parseClickRequest(request)
    console.log('🔔 [Click Complete Route] Received:', rawBody)

    // Ensure action=1
    const payload = {
      ...rawBody,
      action: rawBody?.action !== undefined ? String(rawBody.action) : '1',
    }

    const supabase = createAdminClient()
    const response = await clickPayment.handleComplete(payload, supabase)
    console.log('📤 [Click Complete Route] Response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Click Complete Route] Error:', error)
    return NextResponse.json({
      click_trans_id: rawBody?.click_trans_id ?? '',
      merchant_trans_id: rawBody?.merchant_trans_id ?? '',
      merchant_confirm_id: null,
      error: -7,
      error_note: 'Failed to update user',
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'click_complete',
    service: 'Qarz Daftari',
  })
}
