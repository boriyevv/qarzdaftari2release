// src/app/api/payments/click/webhook/route.ts
import { clickPayment, ClickShopApiRequest } from '@/lib/payments/click'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	const rawBody = Object.fromEntries(
		await request.formData(),
	) as unknown as ClickShopApiRequest

	console.log('🔔 Click webhook received:', rawBody)

	try {
		const action = parseInt(rawBody.action)

		// Action 0: Prepare
		if (action === 0) {
			const response = await clickPayment.handlePrepare(rawBody)

			if (response.error === 0) {
				const parsed = parsePaymentOrder(rawBody.merchant_trans_id)
				if (parsed) {
					const supabase = await createClient()
					await supabase.from('payment_transactions').insert({
						user_id: parsed.userId,
						provider: 'click',
						amount: parseFloat(rawBody.amount),
						status: 'pending',
						external_id: rawBody.click_trans_id,
						external_data: rawBody,
					})
				}
			}

			return NextResponse.json(response)
		}

		// Action 1: Complete
		if (action === 1) {
			const response = await clickPayment.handleComplete(rawBody)

			if (response.error === 0) {
				try {
					const parsed = parsePaymentOrder(rawBody.merchant_trans_id)
					if (!parsed) {
						throw new Error(`Invalid transaction param: ${rawBody.merchant_trans_id}`)
					}

					const supabase = await createClient()
					await processSuccessfulPayment(supabase, {
						provider: 'click',
						order: parsed,
						amount: parseFloat(rawBody.amount),
						externalId: rawBody.click_trans_id,
						externalData: rawBody,
					})
				} catch (err) {
					console.error('❌ DB update failed after confirmed payment:', err)
					return NextResponse.json({
						...response,
						error: -9,
						error_note: 'System error',
					})
				}
			}

			return NextResponse.json(response)
		}

		return NextResponse.json({
			click_trans_id: rawBody.click_trans_id,
			merchant_trans_id: rawBody.merchant_trans_id,
			error: -3,
			error_note: 'Invalid action',
		})
	} catch (error) {
		console.error('❌ Click webhook error:', error)
		return NextResponse.json({
			click_trans_id: rawBody?.click_trans_id ?? '',
			merchant_trans_id: rawBody?.merchant_trans_id ?? '',
			error: -9,
			error_note: 'System error',
		})
	}
}
