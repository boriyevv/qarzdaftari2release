// scripts/test-click.js
/**
 * Click Shop API & Webhook Test Suite
 * Usage:
 *   node scripts/test-click.js http://localhost:3000
 *   or
 *   node scripts/test-click.js https://debtbook.uz
 */

const crypto = require('crypto')

const SERVICE_ID = process.env.CLICK_SERVICE_ID || '104455'
const SECRET_KEY = process.env.CLICK_SECRET_KEY || ''
const MERCHANT_ID = process.env.CLICK_MERCHANT_ID || '61732'

const baseUrl = process.argv[2] || 'http://localhost:3000'

console.log('====================================================')
console.log('🧪 CLICK PAYMENT INTEGRATION TEST SUITE')
console.log('====================================================')
console.log(`Target URL:     ${baseUrl}`)
console.log(`Service ID:     ${SERVICE_ID}`)
console.log(`Merchant ID:    ${MERCHANT_ID}`)
console.log(`Secret Key:     ${SECRET_KEY.slice(0, 4)}***`)
console.log('====================================================\n')

function generateSignTime() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// 1. Prepare signature
function getPrepareSign(clickTransId, merchantTransId, amount, signTime) {
  const str = `${clickTransId}${SERVICE_ID}${SECRET_KEY}${merchantTransId}${amount}0${signTime}`
  return md5(str)
}

// 2. Complete signature
function getCompleteSign(clickTransId, merchantTransId, merchantPrepareId, amount, signTime) {
  const str = `${clickTransId}${SERVICE_ID}${SECRET_KEY}${merchantTransId}${merchantPrepareId}${amount}1${signTime}`
  return md5(str)
}

async function runTests() {
  const clickTransId = Math.floor(Math.random() * 9000000 + 1000000).toString()
  const clickPaydocId = Math.floor(Math.random() * 9000000 + 1000000).toString()
  const merchantTransId = 'test' // Supported test identifier
  const amount = '1000'
  const signTime = generateSignTime()

  // ─────────────────────────────────────────────────────────────
  // TEST 1: GET Webhook Healthcheck
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 1: GET /api/payments/click/webhook (Healthcheck)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/click/webhook`)
    const data = await res.json()
    if (res.ok && data.status === 'ok') {
      console.log('  ✅ PASSED: Webhook endpoint is healthy.')
      console.log('  Response:', data)
    } else {
      console.log('  ❌ FAILED: Unexpected response:', data)
    }
  } catch (err) {
    console.log('  ⚠️ Server unreachable at', baseUrl, '— is your dev server running?')
    console.log('  Error:', err.message)
    printCurlExamples(clickTransId, merchantTransId, amount, signTime)
    return
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 2: POST Prepare (Action 0) - Valid Request
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 2: POST Prepare (action=0) with valid MD5 signature')
  const validPrepareSign = getPrepareSign(clickTransId, merchantTransId, amount, signTime)
  const preparePayload = {
    click_trans_id: clickTransId,
    service_id: SERVICE_ID,
    click_paydoc_id: clickPaydocId,
    merchant_trans_id: merchantTransId,
    amount: amount,
    action: '0',
    error: '0',
    error_note: '',
    sign_time: signTime,
    sign_string: validPrepareSign,
  }

  let returnedPrepareId = 0
  try {
    const res = await fetch(`${baseUrl}/api/payments/click/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preparePayload),
    })
    const data = await res.json()
    if (data.error === 0 && data.merchant_prepare_id) {
      returnedPrepareId = data.merchant_prepare_id
      console.log('  ✅ PASSED: Prepare succeeded with error=0.')
      console.log('  merchant_prepare_id:', returnedPrepareId)
    } else {
      console.log('  ❌ FAILED: Expected error=0, got:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 3: POST Prepare - Invalid Signature (Expects error -1)
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 3: POST Prepare with INVALID signature (Security check)')
  const badPreparePayload = {
    ...preparePayload,
    sign_string: 'invalid_hash_12345',
  }
  try {
    const res = await fetch(`${baseUrl}/api/payments/click/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPreparePayload),
    })
    const data = await res.json()
    if (data.error === -1) {
      console.log('  ✅ PASSED: Successfully rejected invalid signature with error: -1.')
    } else {
      console.log('  ❌ FAILED: Expected error=-1 for invalid sign, got:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 4: POST Complete (Action 1) - Valid Confirmation
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 4: POST Complete (action=1) with valid MD5 signature')
  const validCompleteSign = getCompleteSign(
    clickTransId,
    merchantTransId,
    returnedPrepareId,
    amount,
    signTime
  )
  const completePayload = {
    click_trans_id: clickTransId,
    service_id: SERVICE_ID,
    click_paydoc_id: clickPaydocId,
    merchant_trans_id: merchantTransId,
    merchant_prepare_id: String(returnedPrepareId),
    amount: amount,
    action: '1',
    error: '0',
    error_note: '',
    sign_time: signTime,
    sign_string: validCompleteSign,
  }
  try {
    const res = await fetch(`${baseUrl}/api/payments/click/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completePayload),
    })
    const data = await res.json()
    if (data.error === 0 && data.merchant_confirm_id) {
      console.log('  ✅ PASSED: Complete succeeded with error=0.')
      console.log('  merchant_confirm_id:', data.merchant_confirm_id)
    } else {
      console.log('  ❌ FAILED: Expected error=0, got:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 5: POST Complete - Cancelled Transaction (error < 0)
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 5: POST Complete with Click cancellation error (Expects error -9)')
  const cancelClickId = (parseInt(clickTransId) + 1).toString()
  const cancelSign = getCompleteSign(cancelClickId, merchantTransId, returnedPrepareId, amount, signTime)
  const cancelPayload = {
    click_trans_id: cancelClickId,
    service_id: SERVICE_ID,
    click_paydoc_id: clickPaydocId,
    merchant_trans_id: merchantTransId,
    merchant_prepare_id: String(returnedPrepareId),
    amount: amount,
    action: '1',
    error: '-5017', // Click user cancelled code
    error_note: 'Cancelled by user',
    sign_time: signTime,
    sign_string: cancelSign,
  }
  try {
    const res = await fetch(`${baseUrl}/api/payments/click/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cancelPayload),
    })
    const data = await res.json()
    if (data.error === -9) {
      console.log('  ✅ PASSED: Cancelled transaction handled correctly with error: -9.')
    } else {
      console.log('  ❌ FAILED: Expected error=-9, got:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  console.log('====================================================')
  console.log('🎉 ALL INTEGRATION TESTS COMPLETED')
  console.log('====================================================')
}

function printCurlExamples(clickTransId, merchantTransId, amount, signTime) {
  const prepareSign = getPrepareSign(clickTransId, merchantTransId, amount, signTime)
  console.log('\n--- MANUAL CURL EXAMPLES ---')
  console.log('1. Prepare request:')
  console.log(`curl -X POST "${baseUrl}/api/payments/click/webhook" \\
  -H "Content-Type: application/json" \\
  -d '{
    "click_trans_id": "${clickTransId}",
    "service_id": "${SERVICE_ID}",
    "click_paydoc_id": "12345678",
    "merchant_trans_id": "${merchantTransId}",
    "amount": "${amount}",
    "action": "0",
    "error": "0",
    "error_note": "",
    "sign_time": "${signTime}",
    "sign_string": "${prepareSign}"
  }'\n`)
}

runTests()
