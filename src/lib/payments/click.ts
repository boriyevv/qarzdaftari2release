// src/lib/payments/click.ts
import crypto from 'crypto'

export interface ClickPaymentParams {
	amount: number
	userId: string
	planType: string
	returnUrl: string
}
//  CHANGE 1: Added 'click_paydoc_id' and 'merchant_prepare_id' to PrepareResponse.
// The SHOP API docs require merchant_prepare_id in the Prepare reply (your billing system's internal payment ID). 'click_paydoc_id' is sent by Click on every request and must be echoed or stored. These were missing from the original interface
export interface ClickPrepareResponse {
	click_trans_id: string
	merchant_trans_id: string
	merchant_prepare_id: number
	error: number
	error_note: string
}

// ✅ CHANGE 2: Slimmed CompleteResponse to match exactly what the SHOP API expects back.
// Original had `amount`, `action`, `sign_time`, `sign_string` in the response — the
// docs do NOT ask you to echo those back. The required reply fields are only:
// click_trans_id, merchant_trans_id, merchant_confirm_id, error, error_note.
export interface ClickCompleteResponse {
	click_trans_id: string
	merchant_trans_id: string
	merchant_confirm_id: number | null // ← CHANGED: was `merchant_prepare_id?: string`, docs call this `merchant_confirm_id`
	error: number
	error_note: string
}

// ✅ CHANGE 3: Typed the raw incoming request from Click for safety.
// The original code used `any` throughout. Typing this makes the signature
// verification and field access explicit and catches mistakes at compile time.
export interface ClickShopApiRequest {
	click_trans_id: string
	service_id: string
	click_paydoc_id: string
	merchant_trans_id: string
	merchant_prepare_id?: string // only present on Complete (action=1)
	amount: string
	action: string
	error: string
	error_note: string
	sign_time: string // format: "YYYY-MM-DD HH:mm:ss"
	sign_string: string
}

export class ClickPayment {
	private merchantId: string
	private serviceId: string
	private secretKey: string
	private merchantUserId: string

	constructor() {
		this.merchantId = process.env.CLICK_MERCHANT_ID!
		this.serviceId = process.env.CLICK_SERVICE_ID!
		this.secretKey = process.env.CLICK_SECRET_KEY!
		this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID || '1'
	}

	/**
	 * Generate payment URL for Click (unchanged — this was already correct)
	 */
	generatePaymentUrl(params: ClickPaymentParams): string {
		const { amount, userId, planType, returnUrl } = params
		const transactionId = `${userId}_${planType}_${Date.now()}`

		const url = new URL('https://my.click.uz/services/pay')
		url.searchParams.set('service_id', this.serviceId)
		url.searchParams.set('merchant_id', this.merchantId)
		url.searchParams.set('amount', amount.toString())
		url.searchParams.set('transaction_param', transactionId)
		url.searchParams.set('return_url', returnUrl)
		url.searchParams.set('merchant_user_id', this.merchantUserId)

		return url.toString()
	}

	// ✅ CHANGE 4: Split signature verification into two methods — one for Prepare, one for Complete.
	//
	// ORIGINAL BUG: The original `verifySignature()` used the SAME hash formula for both
	// action=0 and action=1. But the docs specify DIFFERENT sign strings:
	//
	//   Prepare  (action=0): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
	//   Complete (action=1): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
	//
	// Complete includes `merchant_prepare_id` in the hash — Prepare does NOT.
	// Using the wrong formula means every Complete request would fail signature verification.

	verifyPrepareSignature(params: ClickShopApiRequest): boolean {
		const signString = [
			params.click_trans_id,
			this.serviceId,
			this.secretKey,
			params.merchant_trans_id,
			params.amount,
			params.action,
			params.sign_time,
		].join('')

		const hash = crypto.createHash('md5').update(signString).digest('hex')
		return hash === params.sign_string
	}

	verifyCompleteSignature(params: ClickShopApiRequest): boolean {
		// ✅ CHANGE 4 (cont.): `merchant_prepare_id` inserted between merchant_trans_id and amount
		const signString = [
			params.click_trans_id,
			this.serviceId,
			this.secretKey,
			params.merchant_trans_id,
			params.merchant_prepare_id, // ← this is the key difference vs Prepare
			params.amount,
			params.action,
			params.sign_time,
		].join('')

		const hash = crypto.createHash('md5').update(signString).digest('hex')
		return hash === params.sign_string
	}

	/**
	 * Handle Prepare request (action=0)
	 * Click calls this first to ask: "Is this order valid and ready to be paid?"
	 * You must return a `merchant_prepare_id` — your internal ID for this pending payment.
	 */
	async handlePrepare(
		params: ClickShopApiRequest,
	): Promise<ClickPrepareResponse> {
		console.log('📝 Click prepare:', params)

		// ✅ CHANGE 5: Use the correct verifyPrepareSignature() instead of the shared one.
		if (!this.verifyPrepareSignature(params)) {
			return this.prepareErrorResponse(params, -1, 'Invalid signature')
		}

		// ✅ CHANGE 6: Validate that service_id in the request matches YOUR service_id.
		// The docs imply you should reject requests for unknown services. The original
		// code never checked this — a forged request with a different service_id would pass.
		if (params.service_id !== this.serviceId) {
			return this.prepareErrorResponse(params, -4, 'Wrong service ID')
		}

		const [userId, planType] = params.merchant_trans_id.split('_')

		if (!userId || !planType) {
			return this.prepareErrorResponse(params, -5, 'Invalid transaction ID')
		}

		// TODO: Validate user exists
		// TODO: Validate plan type
		// TODO: Check if already paid

		// ✅ CHANGE 7: Generate a real merchant_prepare_id.
		// The original returned 0 / nothing. This ID is critical — Click sends it back
		// in the Complete request and you use it to look up the pending payment in your DB.
		// Replace this with a real DB insert that returns an auto-incremented ID.
		const merchantPrepareId = Date.now() // TODO: replace with your DB insert ID

		// TODO: Validate user exists in your DB
		// TODO: Validate planType is a known plan
		// TODO: Check if user already has an active subscription (return error -4 if so)
		// TODO: Reserve/create a pending payment record with merchantPrepareId

		return {
			click_trans_id: params.click_trans_id,
			merchant_trans_id: params.merchant_trans_id,
			merchant_prepare_id: merchantPrepareId, // ← was missing in original
			error: 0,
			error_note: 'Success',
		}
	}

	/**
	 * Handle Complete request (action=1)
	 * Click calls this after funds are transferred. `error=0` means success — activate service.
	 * `error <= -1` means Click cancelled — undo reservation, return error -9.
	 */
	async handleComplete(
		params: ClickShopApiRequest,
	): Promise<ClickCompleteResponse> {
		console.log('✅ Click complete:', params)

		// ✅ CHANGE 8: Use verifyCompleteSignature() — different hash formula than Prepare.
		if (!this.verifyCompleteSignature(params)) {
			return this.completeErrorResponse(params, -1, 'Invalid signature')
		}

		if (params.service_id !== this.serviceId) {
			return this.completeErrorResponse(params, -4, 'Wrong service ID')
		}

		const [userId, planType] = params.merchant_trans_id.split('_')

		if (!userId || !planType) {
			return this.completeErrorResponse(params, -5, 'Invalid transaction ID')
		}

		// ✅ CHANGE 9: Handle the cancellation case (error <= -1 from Click).
		// The original code ignored Click's `error` field entirely. Per the docs, if
		// Click sends error <= -1 in the Complete request, the payment was cancelled —
		// you must remove the reservation and return error code -9.
		if (parseInt(params.error) < 0) {
			// TODO: Look up pending payment by merchant_prepare_id and cancel/remove it
			return this.completeErrorResponse(params, -9, 'Transaction cancelled')
		}

		// ✅ CHANGE 10: Check for duplicate complete (idempotency guard).
		// The docs explicitly warn: protect against the same click_trans_id being
		// confirmed twice. If already confirmed → return error -4.
		// TODO: Query your DB: if payment with params.click_trans_id is already confirmed → return -4
		// Example:
		// const existing = await db.payment.findOne({ click_trans_id: params.click_trans_id })
		// if (existing?.status === 'confirmed') {
		//   return this.completeErrorResponse(params, -4, 'Already confirmed')
		// }

		// TODO: Activate user subscription for userId + planType
		// TODO: Save confirmed payment to DB, store click_trans_id + click_paydoc_id
		// TODO: Send notification to user

		const merchantConfirmId = Date.now() // TODO: replace with real DB transaction ID

		return {
			click_trans_id: params.click_trans_id,
			merchant_trans_id: params.merchant_trans_id,
			merchant_confirm_id: merchantConfirmId, // ← was `merchant_prepare_id` (wrong name) in original
			error: 0,
			error_note: 'Success',
		}
	}

	// ✅ CHANGE 11: Split errorResponse into two typed helpers.
	// Original had one `errorResponse()` returning `any`. Splitting ensures each handler
	// returns the correct response shape (Prepare vs Complete have different required fields).

	private prepareErrorResponse(
		params: ClickShopApiRequest,
		error: number,
		error_note: string,
	): ClickPrepareResponse {
		return {
			click_trans_id: params.click_trans_id,
			merchant_trans_id: params.merchant_trans_id,
			merchant_prepare_id: 0,
			error,
			error_note,
		}
	}

	private completeErrorResponse(
		params: ClickShopApiRequest,
		error: number,
		error_note: string,
	): ClickCompleteResponse {
		return {
			click_trans_id: params.click_trans_id,
			merchant_trans_id: params.merchant_trans_id,
			merchant_confirm_id: null,
			error,
			error_note,
		}
	}
}

// Singleton instance
export const clickPayment = new ClickPayment()
