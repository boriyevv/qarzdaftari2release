// src/app/api/payments/click/webhook/route.ts
import { clickPayment, ClickShopApiRequest } from '@/lib/payments/click'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	// BUG 1 FIX: Click sends form data, not JSON — parse accordingly
	const rawBody = Object.fromEntries(
		await request.formData(),
	) as unknown as ClickShopApiRequest

	console.log('🔔 Click webhook received:', rawBody)

	try {
		const action = parseInt(rawBody.action)

		// Action 0: Prepare
		if (action === 0) {
			const response = await clickPayment.handlePrepare(rawBody)

			// BUG 5 FIX: Save pending payment record so Complete can validate merchant_prepare_id
			if (response.error === 0) {
				const supabase = await createClient()
				await supabase.from('payment_transactions').insert({
					id: response.merchant_prepare_id,
					user_id: rawBody.merchant_trans_id.split('_')[0],
					provider: 'click',
					// BUG 7 FIX: parse amount to float
					amount: parseFloat(rawBody.amount),
					status: 'pending',
					external_id: rawBody.click_trans_id,
					external_data: rawBody,
				})
			}

			return NextResponse.json(response)
		}

		// Action 1: Complete
		if (action === 1) {
			const response = await clickPayment.handleComplete(rawBody)

			if (response.error === 0) {
				// BUG 2 FIX: if DB update fails, return error -9 to Click
				try {
					await updateSubscription(rawBody)
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
		// BUG 9 FIX: echo back transaction IDs even on system error
		return NextResponse.json({
			click_trans_id: rawBody?.click_trans_id ?? '',
			merchant_trans_id: rawBody?.merchant_trans_id ?? '',
			error: -9,
			error_note: 'System error',
		})
	}
}

async function updateSubscription(params: ClickShopApiRequest) {
	// BUG 3 FIX: errors are re-thrown so the caller can handle them
	const supabase = await createClient()

	const [userId, planType] = params.merchant_trans_id.split('_')

	// BUG 4 FIX: idempotency — skip if this click_trans_id was already processed
	const { data: existing } = await supabase
		.from('payment_transactions')
		.select('id')
		.eq('external_id', params.click_trans_id)
		.eq('status', 'completed')
		.single()

	if (existing) {
		console.log('⚠️ Duplicate complete ignored:', params.click_trans_id)
		return
	}

	// BUG 5 FIX: validate merchant_prepare_id exists as a pending payment
	const { data: pendingPayment } = await supabase
		.from('payment_transactions')
		.select('id')
		.eq('id', params.merchant_prepare_id)
		.eq('status', 'pending')
		.single()

	if (!pendingPayment) {
		throw new Error(
			`No pending payment found for merchant_prepare_id: ${params.merchant_prepare_id}`,
		)
	}

	console.log('📝 Updating subscription:', { userId, planType })

	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + 30)

	// Mark the pending transaction as completed
	await supabase
		.from('payment_transactions')
		.update({
			status: 'completed',
			// BUG 7 FIX: amount stored as float, not raw string
			amount: parseFloat(params.amount),
			external_data: params,
			completed_at: new Date().toISOString(),
		})
		.eq('id', params.merchant_prepare_id)

	await supabase
		.from('users')
		.update({
			plan_type: planType,
			subscription_status: 'active',
			subscription_expires_at: expiresAt.toISOString(),
			last_payment_date: new Date().toISOString(),
		})
		.eq('id', userId)

	// BUG 6 FIX: deactivate old subscriptions before inserting new one
	await supabase
		.from('subscriptions')
		.update({ status: 'expired' })
		.eq('user_id', userId)
		.eq('status', 'active')

	await supabase.from('subscriptions').insert({
		user_id: userId,
		plan_type: planType,
		status: 'active',
		amount: parseFloat(params.amount), // BUG 7 FIX
		currency: 'UZS',
		payment_provider: 'click',
		payment_transaction_id: pendingPayment.id,
		started_at: new Date().toISOString(),
		expires_at: expiresAt.toISOString(),
	})

	console.log('✅ Subscription updated successfully')

	// TODO: Send notification to user
	// TODO: Log activity
}
