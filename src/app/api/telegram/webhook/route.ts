// src/app/api/telegram/webhook/route.ts
// Handles Telegram Webhook updates & bot commands

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { telegramService } from '@/lib/services/telegram.service'
import { formatCurrency } from '@/lib/utils/currency'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debtbook.uz'
const SAFE_APP_URL = APP_URL.startsWith('https://') ? APP_URL : 'https://debtbook.uz'

export async function GET(request: NextRequest) {
  const secretKey = request.nextUrl.searchParams.get('secret')
  const action = request.nextUrl.searchParams.get('action')

  // Get current status
  if (!action) {
    const isConfigured = telegramService.isConfigured()
    let info = null
    if (isConfigured) {
      try {
        info = await telegramService.getWebhookInfo()
      } catch (err: any) {
        info = { error: err.message }
      }
    }
    return NextResponse.json({
      status: 'ok',
      configured: isConfigured,
      botUsername: telegramService.botUsername,
      telegramWebhookInfo: info,
    })
  }

  // Admin action to register/set webhook directly via URL
  const expectedSecret = process.env.CRON_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET
  if (secretKey !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'setWebhook') {
    const targetUrl = `${APP_URL}/api/telegram/webhook`
    const result = await telegramService.setWebhook(targetUrl, telegramService.webhookSecret)
    return NextResponse.json({ action: 'setWebhook', targetUrl, result })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    // Optional secret token verification from Telegram header
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
    if (telegramService.webhookSecret && secretHeader && secretHeader !== telegramService.webhookSecret) {
      console.warn('[Telegram Webhook] Invalid secret token received')
      return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 })
    }

    const update = await request.json().catch(() => null)
    if (!update) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    if (!message || !message.chat) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const username = message.from?.username || message.chat?.username || ''
    const text = (message.text || '').trim()

    const adminSupabase = createAdminClient()

    // 1. Handle /start command
    if (text.startsWith('/start')) {
      const parts = text.split(' ')
      const payload = parts[1] || ''

      // Case A: Deep-link account linking: /start link_<userId>
      if (payload.startsWith('link_')) {
        const userId = payload.replace('link_', '').trim()
        const linkResult = await telegramService.linkUser(adminSupabase, userId, chatId, username)

        if (linkResult.success && linkResult.user) {
          const storeTitle = linkResult.user.store_name || linkResult.user.full_name || "Mening Do'konim"
          const welcomeMsg = `🎉 <b>Tabriklaymiz! Hisobingiz ulandi</b>\n\n` +
            `Do'kon: <b>${storeTitle}</b>\n\n` +
            `Endi siz:\n` +
            `• 📊 Har kuni ertalab 09:00 da avtomatik hisobot olasiz\n` +
            `• ⚡️ «Bugungi hisobot» tugmasi orqali tezkor ko'rsatkichlarni bilasiz\n` +
            `• 🚀 Ilovani to'g'ridan-to'g'ri Telegram ichida ochasiz`

          await telegramService.sendMessage(chatId, welcomeMsg, {
            parse_mode: 'HTML',
            reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL),
          })
          return NextResponse.json({ ok: true })
        } else {
          await telegramService.sendMessage(
            chatId,
            `⚠️ <b>Hisobni ulashda xatolik yuz berdi.</b>\n` +
            `Foydalanuvchi topilmadi yoki havola muddati tugagan. Iltimos, <a href="${APP_URL}/profile">debtbook.uz/profile</a> sahifasidagi havolani qaytadan bosing.`,
            { parse_mode: 'HTML' }
          )
          return NextResponse.json({ ok: true })
        }
      }

      // Case B: General /start
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (existingUser) {
        const storeTitle = existingUser.store_name || existingUser.full_name || "Do'koningiz"
        const greeting = `Assalomu alaykum, <b>${storeTitle}</b>! 👋\n\n` +
          `Qarz Daftari yordamchingiz tayyor. Quyidagi tugmalar orqali kerakli bo'limga o'tishingiz mumkin:`

        await telegramService.sendMessage(chatId, greeting, {
          parse_mode: 'HTML',
          reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL),
        })
      } else {
        const guestMsg = `Assalomu alaykum! 📖 <b>Qarz Daftari</b> rasmiy botiga xush kelibsiz.\n\n` +
          `Do'koningiz hisobini botga ulash va kunlik hisobotlarni olish uchun:\n` +
          `1️⃣ <a href="${APP_URL}">debtbook.uz</a> saytiga kiring\n` +
          `2️⃣ <b>Profil</b> bo'limiga o'ting\n` +
          `3️⃣ <b>«Telegram botga ulash»</b> tugmasini bosing.`

        await telegramService.sendMessage(chatId, guestMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: "🌐 debtbook.uz ga o'tish", url: `${SAFE_APP_URL}/profile` }],
            ],
          },
        })
      }

      return NextResponse.json({ ok: true })
    }

    // 2. Handle "📊 Bugungi hisobot" or /hisobot
    if (text === '📊 Bugungi hisobot' || text === '/hisobot' || text.toLowerCase() === 'hisobot') {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (!existingUser) {
        await telegramService.sendMessage(
          chatId,
          `⚠️ Hisobingiz hali ulanmagan. Iltimos, avval <a href="${SAFE_APP_URL}/profile">profilingizdan</a> Telegram botni ulang.`,
          { parse_mode: 'HTML' }
        )
        return NextResponse.json({ ok: true })
      }

      const stats = await telegramService.getStoreStats(adminSupabase, existingUser.id)
      const dateFormatted = new Date().toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const storeTitle = existingUser.store_name || existingUser.full_name || "Do'kon"

      const reportMsg = `📊 <b>${storeTitle} — Hisobot</b>\n` +
        `📅 <i>${dateFormatted}</i>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 <b>Jami faol qarzlar:</b>\n` +
        `└ <b>${formatCurrency(stats.totalDebtAmount)} so'm</b> (${stats.totalDebts} ta qarz)\n\n` +
        `⚠️ <b>Muddati o'tgan qarzlar:</b>\n` +
        `└ <b>${formatCurrency(stats.overdueAmount)} so'm</b> (${stats.overdueCount} ta mijoz)\n\n` +
        `⏳ <b>Bugun kutilayotgan:</b>\n` +
        `└ <b>${formatCurrency(stats.dueTodayAmount)} so'm</b> (${stats.dueTodayCount} ta mijoz)\n\n` +
        `━━━━━━━━━━━━━━━━━━━━`

      await telegramService.sendMessage(chatId, reportMsg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Barcha qarzlarni ko\'rish',
                web_app: { url: `${SAFE_APP_URL}/dashboard` },
              },
            ],
          ],
        },
      })
      return NextResponse.json({ ok: true })
    }

    // 3. Handle "⚙️ Sozlamalar va Holat" or /status
    if (text === '⚙️ Sozlamalar va Holat' || text === '/status') {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (existingUser) {
        const storeTitle = existingUser.store_name || existingUser.full_name || '-'
        const phone = existingUser.phone || '-'
        const plan = (existingUser.plan_type || 'FREE').toUpperCase()

        const statusMsg = `⚙️ <b>Qarz Daftari — Ulanish holati</b>\n\n` +
          `🏪 Do'kon: <b>${storeTitle}</b>\n` +
          `📞 Telefon: <code>${phone}</code>\n` +
          `⭐️ Tarif: <b>${plan}</b>\n` +
          `✅ Telegram: <b>Faol ulangan</b>\n\n` +
          `<i>Agar hisobni ushbu botdan uzmoqchi bo'lsangiz, /unlink buyrug'ini yuboring.</i>`

        await telegramService.sendMessage(chatId, statusMsg, { parse_mode: 'HTML' })
      } else {
        await telegramService.sendMessage(
          chatId,
          `Ushbu Telegram hisobi hali hech qaysi Qarz Daftari profiliga ulanmagan.`,
          { parse_mode: 'HTML' }
        )
      }
      return NextResponse.json({ ok: true })
    }

    // 4. Handle /unlink
    if (text === '/unlink') {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (existingUser) {
        await telegramService.unlinkUser(adminSupabase, existingUser.id)
        await telegramService.sendMessage(
          chatId,
          `🔌 <b>Hisob botdan muvaffaqiyatli uzildi.</b>\n` +
          `Qayta ulash uchun veb-sayt orqali yangi havola oling.`,
          {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true } as any,
          }
        )
      } else {
        await telegramService.sendMessage(chatId, `Ulanish topilmadi.`, { parse_mode: 'HTML' })
      }
      return NextResponse.json({ ok: true })
    }

    // Default fallback: remind user of available commands
    const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
    if (existingUser) {
      await telegramService.sendMessage(
        chatId,
        `Quyidagi tugmalardan birini tanlang yoki buyruq yuboring:\n` +
        `• <b>📊 Bugungi hisobot</b>\n` +
        `• <b>⚙️ Sozlamalar va Holat</b>\n` +
        `• /hisobot yoki /status`,
        {
          parse_mode: 'HTML',
          reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL),
        }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Telegram Webhook Error]:', err)
    return NextResponse.json({ ok: true }) // Always 200 for Telegram
  }
}
