// src/app/api/payments/click/invoice/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const invoiceId = searchParams.get('invoiceId')

    if (!transactionId && !invoiceId) {
      return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let query = supabase.from('payment_transactions').select('id, status, amount, completed_at')

    if (transactionId) {
      query = query.or(`external_id.eq.${transactionId},external_id.eq.${invoiceId || transactionId}`)
    } else if (invoiceId) {
      query = query.eq('external_id', invoiceId)
    }

    const { data: tx } = await query.maybeSingle()

    return NextResponse.json({
      status: tx?.status || 'pending',
      isCompleted: tx?.status === 'completed',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
