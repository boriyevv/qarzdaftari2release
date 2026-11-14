// scripts/test-telegram.js
/**
 * Telegram Bot & Webhook CLI Helper
 * Usage:
 *   node scripts/test-telegram.js
 *   node scripts/test-telegram.js set-webhook https://debtbook.uz/api/telegram/webhook
 *   node scripts/test-telegram.js send-test <CHAT_ID>
 */

const fs = require('fs')
const path = require('path')

// Load .env.local manually if not in process.env
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim()
      let val = trimmed.substring(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1)
      }
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  })
}


const token = process.env.TELEGRAM_BOT_TOKEN
const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'debtbookuz_bot'
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || 'debtbook_tg_secret_2026'

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is missing in .env.local')
  process.exit(1)
}

const baseUrl = `https://api.telegram.org/bot${token}`

async function main() {
  const [,, command, arg1] = process.argv

  console.log(`🤖 Telegram Bot Helper: @${botUsername}`)
  console.log('----------------------------------------------------')

  // 1. Get bot info
  const meRes = await fetch(`${baseUrl}/getMe`).then((r) => r.json())
  if (!meRes.ok) {
    console.error('❌ Failed to get bot info:', meRes)
    return
  }
  console.log(`✅ Bot Connected: ${meRes.result.first_name} (@${meRes.result.username})`)

  if (command === 'set-webhook') {
    const webhookUrl = arg1 || 'https://debtbook.uz/api/telegram/webhook'
    console.log(`📡 Setting webhook to: ${webhookUrl}`)
    const setRes = await fetch(`${baseUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ['message', 'callback_query'],
      }),
    }).then((r) => r.json())
    console.log('Result:', setRes)
    return
  }

  if (command === 'delete-webhook') {
    console.log('🗑️ Deleting webhook...')
    const delRes = await fetch(`${baseUrl}/deleteWebhook`).then((r) => r.json())
    console.log('Result:', delRes)
    return
  }

  if (command === 'send-test') {
    if (!arg1) {
      console.error('❌ Please provide chat_id: node scripts/test-telegram.js send-test <chat_id>')
      return
    }
    console.log(`📤 Sending test message to chat ${arg1}...`)
    const sendRes = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: arg1,
        text: '🔔 <b>Salom!</b> Qarz Daftari boti muvaffaqiyatli ishga tushdi.',
        parse_mode: 'HTML',
      }),
    }).then((r) => r.json())
    console.log('Result:', sendRes)
    return
  }

  if (command === 'poll') {
    console.log('🔄 Starting long polling mode for localhost development...')
    console.log('Target: http://localhost:3000/api/telegram/webhook')
    let offset = 0
    while (true) {
      try {
        const res = await fetch(`${baseUrl}/getUpdates?offset=${offset}&timeout=15`).then((r) => r.json())
        if (res.ok && res.result && res.result.length > 0) {
          for (const update of res.result) {
            console.log(`📩 Received update ${update.update_id}:`, update.message ? update.message.text : 'non-message')
            offset = update.update_id + 1
            const hookRes = await fetch('http://localhost:3000/api/telegram/webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-telegram-bot-api-secret-token': webhookSecret,
              },
              body: JSON.stringify(update),
            }).then((r) => r.json()).catch((err) => ({ error: err.message }))
            console.log('Webhook response:', hookRes)
          }
        }
      } catch (err) {
        console.error('Polling error:', err.message)
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  // Default: Show webhook info
  const infoRes = await fetch(`${baseUrl}/getWebhookInfo`).then((r) => r.json())
  console.log('Current Webhook Info:')
  console.log(infoRes.result)
  console.log('----------------------------------------------------')
  console.log('Commands:')
  console.log('  node scripts/test-telegram.js set-webhook [url]')
  console.log('  node scripts/test-telegram.js delete-webhook')
  console.log('  node scripts/test-telegram.js send-test <chat_id>')
}

main().catch(console.error)
