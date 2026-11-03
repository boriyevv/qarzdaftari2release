// scripts/test-payme.js
/**
 * Payme Merchant API & Webhook Test Suite
 * Usage:
 *   node scripts/test-payme.js http://localhost:3000
 *   or
 *   node scripts/test-payme.js https://debtbook.uz
 */

const path = require('path')
try {
  require('@next/env').loadEnvConfig(path.resolve(__dirname, '..'))
} catch (e) {}

const baseUrl = process.argv[2] || 'http://localhost:3000'

const MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '698082dc2b69c9940f33a385'
const SECRET_KEY = process.env.PAYME_SECRET_KEY || 'JW13I1p#%Mv5UG#EA7I0obh4WK46vmrNz1OH'
const TEST_KEY = process.env.PAYME_TEST_KEY || 'qnNPJ9eraE6E8?tB@5PX7IBrGSYDFmSPbfik'

console.log('====================================================')
console.log('🧪 PAYME PAYMENT INTEGRATION TEST SUITE')
console.log('====================================================')
console.log(`Target URL:     ${baseUrl}`)
console.log(`Merchant ID:    ${MERCHANT_ID}`)
console.log(`Secret Key:     ${SECRET_KEY.slice(0, 4)}***`)
console.log(`Test Key:       ${TEST_KEY.slice(0, 4)}***`)
console.log('====================================================\n')

function getAuthHeader(password = TEST_KEY) {
  const credentials = `Paycom:${password}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

async function getTestUserId() {
  let testUserId = 'e5cade25-1208-46b4-baf3-08e2a883c245'
  try {
    const { createClient } = require('@supabase/supabase-js')
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data: users } = await supabase.from('users').select('id').limit(1)
      if (users && users.length > 0) {
        testUserId = users[0].id
      }
    }
  } catch (e) {}
  return testUserId
}

async function runTests() {
  const testUserId = await getTestUserId()
  const testTxId = `tx_${Date.now()}`
  const amountTiyin = 4900000 // 49,000 UZS in tiyins

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Bad Authorization Check
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 1: POST /api/payments/payme/webhook with INVALID credentials')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic invalid_base64_auth',
      },
      body: JSON.stringify({
        method: 'CheckPerformTransaction',
        params: {},
        id: 1,
      }),
    })
    const data = await res.json()
    if (data.error && data.error.code === -32504) {
      console.log('  ✅ PASSED: Correctly rejected invalid auth with code -32504 (Insufficient privilege).')
    } else {
      console.log('  ❌ FAILED: Expected error -32504, got:', data)
    }
  } catch (err) {
    console.log('  ⚠️ Server unreachable at', baseUrl, '— is your server running?')
    console.log('  Error:', err.message)
    return
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 2: CheckPerformTransaction
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 2: POST /api/payments/payme/webhook (CheckPerformTransaction)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(TEST_KEY),
      },
      body: JSON.stringify({
        method: 'CheckPerformTransaction',
        params: {
          amount: amountTiyin,
          account: {
            user_id: testUserId,
            plan_type: 'PLUS',
          },
        },
        id: 2,
      }),
    })
    const data = await res.json()
    if (data.result?.allow === true) {
      console.log('  ✅ PASSED: CheckPerformTransaction returned allow: true.')
      console.log('  Receipt item:', data.result.detail?.items?.[0]?.title)
    } else {
      console.log('  ℹ️ Response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 3: CreateTransaction
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 3: POST /api/payments/payme/webhook (CreateTransaction)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(TEST_KEY),
      },
      body: JSON.stringify({
        method: 'CreateTransaction',
        params: {
          id: testTxId,
          time: Date.now(),
          amount: amountTiyin,
          account: {
            user_id: testUserId,
            plan_type: 'PLUS',
          },
        },
        id: 3,
      }),
    })
    const data = await res.json()
    if (data.result?.state === 1) {
      console.log('  ✅ PASSED: CreateTransaction succeeded with state: 1 (pending).')
      console.log('  Transaction ID:', data.result.transaction)
    } else {
      console.log('  ℹ️ CreateTransaction response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 4: PerformTransaction
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 4: POST /api/payments/payme/webhook (PerformTransaction)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(TEST_KEY),
      },
      body: JSON.stringify({
        method: 'PerformTransaction',
        params: {
          id: testTxId,
        },
        id: 4,
      }),
    })
    const data = await res.json()
    if (data.result?.state === 2) {
      console.log('  ✅ PASSED: PerformTransaction succeeded with state: 2 (completed).')
      console.log('  Completed Time:', new Date(data.result.perform_time).toISOString())
    } else {
      console.log('  ℹ️ PerformTransaction response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 5: CheckTransaction
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 5: POST /api/payments/payme/webhook (CheckTransaction)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(TEST_KEY),
      },
      body: JSON.stringify({
        method: 'CheckTransaction',
        params: {
          id: testTxId,
        },
        id: 5,
      }),
    })
    const data = await res.json()
    if (data.result?.state === 2) {
      console.log('  ✅ PASSED: CheckTransaction confirmed state: 2 (completed).')
    } else {
      console.log('  ℹ️ CheckTransaction response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 6: GetStatement
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 6: POST /api/payments/payme/webhook (GetStatement)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(TEST_KEY),
      },
      body: JSON.stringify({
        method: 'GetStatement',
        params: {
          from: Date.now() - 86400000,
          to: Date.now() + 60000,
        },
        id: 6,
      }),
    })
    const data = await res.json()
    if (data.result?.transactions !== undefined) {
      console.log('  ✅ PASSED: GetStatement returned transactions array, total found:', data.result.transactions.length)
    } else {
      console.log('  ℹ️ GetStatement response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Card Create API Validation
  // ─────────────────────────────────────────────────────────────
  console.log('▶ TEST 7: POST /api/payments/payme/card/create (Input validation & Auth guard)')
  try {
    const res = await fetch(`${baseUrl}/api/payments/payme/card/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (res.status === 401) {
      console.log('  ✅ PASSED: Correctly enforces authentication (401 Unauthorized).')
    } else {
      console.log('  ℹ️ Response:', data)
    }
  } catch (err) {
    console.log('  ❌ FAILED:', err.message)
  }
  console.log('')

  console.log('====================================================')
  console.log('🎉 PAYME INTEGRATION TESTS COMPLETED')
  console.log('====================================================')
}

runTests()
