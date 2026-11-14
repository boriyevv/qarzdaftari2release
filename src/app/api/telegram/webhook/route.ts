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

    const adminSupabase = createAdminClient()

    // Handle Callback Query (e.g. from inline keyboard time buttons)
    if (update.callback_query) {
      const cb = update.callback_query
      const cbChatId = cb.message?.chat?.id || cb.from?.id
      const data = cb.data || ''

      const existingUser = await telegramService.getUserByChatId(adminSupabase, cbChatId)
      if (!existingUser) {
        await telegramService.answerCallbackQuery(cb.id, "Hisob topilmadi", true)
        return NextResponse.json({ ok: true })
      }

      if (data === 'menu:report_time') {
        await telegramService.answerCallbackQuery(cb.id)
        const timeKeyboard = {
          inline_keyboard: [
            [
              { text: '🌅 08:00', callback_data: 'set_time:08:00' },
              { text: '☀️ 09:00', callback_data: 'set_time:09:00' },
              { text: '🕙 10:00', callback_data: 'set_time:10:00' },
            ],
            [
              { text: '🌇 18:00', callback_data: 'set_time:18:00' },
              { text: '🌙 20:00', callback_data: 'set_time:20:00' },
              { text: '🌃 21:00', callback_data: 'set_time:21:00' },
            ],
            [
              { text: '◀️ Orqaga', callback_data: 'menu:status' },
            ],
          ],
        }

        await telegramService.sendMessage(
          cbChatId,
          `⏰ <b>Kunlik hisobot vaqtini tanlang:</b>\n\n` +
          `Har kuni qaysi vaqtda do'kon balansi va qarzlarni qabul qilmoqchisiz?\n` +
          `<i>(O'zbekiston vaqti bilan)</i>`,
          { parse_mode: 'HTML', reply_markup: timeKeyboard }
        )
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('set_time:')) {
        const chosenTime = data.replace('set_time:', '')
        await telegramService.updateReportSettings(adminSupabase, existingUser.id, {
          time: chosenTime,
          enabled: true,
        })
        await telegramService.answerCallbackQuery(cb.id, `✅ Saqlandi: ${chosenTime}`)

        await telegramService.sendMessage(
          cbChatId,
          `✅ <b>Hisobot vaqti muvaffaqiyatli saqlandi!</b>\n\n` +
          `Endi har kuni soat <b>${chosenTime}</b> da Telegramingizga avtomatik kunlik hisobot yuboriladi. 🚀\n\n` +
          `<i>Xohlagan vaqtingizda sozlamalardan o'zgartirishingiz mumkin.</i>`,
          {
            parse_mode: 'HTML',
            reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL),
          }
        )
        return NextResponse.json({ ok: true })
      }

      if (data === 'toggle:report_enabled') {
        const userLocale = (existingUser.locale_settings as any) || {}
        const currentEnabled = userLocale.telegram_daily_report_enabled !== false
        const nextEnabled = !currentEnabled

        await telegramService.updateReportSettings(adminSupabase, existingUser.id, {
          enabled: nextEnabled,
        })
        await telegramService.answerCallbackQuery(
          cb.id,
          nextEnabled ? '🔔 Hisobot yoqildi' : '🔕 Hisobot o\'chirildi'
        )

        await telegramService.sendMessage(
          cbChatId,
          nextEnabled
            ? `🔔 <b>Kunlik avtomatik hisobot yoqildi.</b>`
            : `🔕 <b>Kunlik avtomatik hisobot o'chirildi.</b>\nIstalgan payt «Bugungi hisobot» tugmasi orqali hisobotni olishingiz mumkin.`,
          {
            parse_mode: 'HTML',
            reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL),
          }
        )
        return NextResponse.json({ ok: true })
      }

      if (data === 'menu:status') {
        await telegramService.answerCallbackQuery(cb.id)
      }
    }

    const message = update.message
    if (!message || !message.chat) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const username = message.from?.username || message.chat?.username || ''
    const text = (message.text || '').trim()

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
    if (text.toLowerCase().includes('hisobot') || text === '📊 Bugungi hisobot' || text === '/hisobot') {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (!existingUser) {
        console.warn(`[Telegram Webhook] No user found for chatId: ${chatId}`)
        const sendRes = await telegramService.sendMessage(
          chatId,
          `⚠️ Hisobingiz hali ulanmagan. Iltimos, avval <a href="${SAFE_APP_URL}/profile">profilingizdan</a> Telegram botni ulang.`,
          { parse_mode: 'HTML' }
        )
        return NextResponse.json({ ok: true, matched: 'hisobot', userFound: false, sendRes })
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
        `└ <b>${formatCurrency(stats.totalDebtAmount)}</b> (${stats.totalDebts} ta qarz)\n\n` +
        `⚠️ <b>Muddati o'tgan qarzlar:</b>\n` +
        `└ <b>${formatCurrency(stats.overdueAmount)}</b> (${stats.overdueCount} ta mijoz)\n\n` +
        `⏳ <b>Bugun kutilayotgan:</b>\n` +
        `└ <b>${formatCurrency(stats.dueTodayAmount)}</b> (${stats.dueTodayCount} ta mijoz)\n\n` +
        `━━━━━━━━━━━━━━━━━━━━`

      const sendRes = await telegramService.sendMessage(chatId, reportMsg, {
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
      console.log('[Telegram Webhook Report Send Result]:', sendRes)
      return NextResponse.json({ ok: true, matched: 'hisobot', sendRes })
    }

    // 3. Handle "⚙️ Sozlamalar va Holat" or /status
    if (text.includes('Sozlamalar') || text.includes('Holat') || text === '/status') {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (existingUser) {
        const storeTitle = existingUser.store_name || existingUser.full_name || '-'
        const phone = existingUser.phone || '-'
        const plan = (existingUser.plan_type || 'FREE').toUpperCase()
        const userLocale = (existingUser.locale_settings as any) || {}
        const reportTime = userLocale.telegram_daily_report_time || '09:00'
        const reportEnabled = userLocale.telegram_daily_report_enabled !== false

        const statusMsg = `⚙️ <b>Qarz Daftari — Ulanish holati</b>\n\n` +
          `🏪 Do'kon: <b>${storeTitle}</b>\n` +
          `📞 Telefon: <code>${phone}</code>\n` +
          `⭐️ Tarif: <b>${plan}</b>\n` +
          `✅ Telegram: <b>Faol ulangan</b>\n` +
          `⏰ Kunlik hisobot: <b>${reportTime}</b> ${reportEnabled ? '(Faol ✅)' : '(O\'chirilgan 🔕)'}\n\n` +
          `<i>Hisobot vaqtini quyidagi tugma orqali o'zgartirishingiz mumkin:</i>`

        await telegramService.sendMessage(chatId, statusMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: `⏰ Hisobot vaqtini tanlash (${reportTime})`, callback_data: 'menu:report_time' },
              ],
              [
                {
                  text: reportEnabled ? '🔕 Hisobotni o\'chirish' : '🔔 Hisobotni yoqish',
                  callback_data: 'toggle:report_enabled',
                },
              ],
            ],
          },
        })
      } else {
        await telegramService.sendMessage(
          chatId,
          `Ushbu Telegram hisobi hali hech qaysi Qarz Daftari profiliga ulanmagan.`,
          { parse_mode: 'HTML' }
        )
      }
      return NextResponse.json({ ok: true })
    }

    // 3.5. Handle /vaqt or /vaqt <HH:mm>
    if (text.startsWith('/vaqt') || text.startsWith('/time')) {
      const existingUser = await telegramService.getUserByChatId(adminSupabase, chatId)
      if (!existingUser) {
        await telegramService.sendMessage(chatId, `Avval hisobingizni ulang.`, { parse_mode: 'HTML' })
        return NextResponse.json({ ok: true })
      }

      const parts = text.split(' ')
      const inputTime = parts[1]?.trim()

      if (inputTime && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputTime)) {
        const formattedTime = inputTime.length === 4 ? `0${inputTime}` : inputTime
        await telegramService.updateReportSettings(adminSupabase, existingUser.id, {
          time: formattedTime,
          enabled: true,
        })
        await telegramService.sendMessage(
          chatId,
          `✅ <b>Hisobot vaqti saqlandi!</b>\n\nEndi har kuni soat <b>${formattedTime}</b> da Telegramingizga kunlik hisobot yuboriladi. 🚀`,
          { parse_mode: 'HTML', reply_markup: telegramService.getMerchantKeyboard(SAFE_APP_URL) }
        )
      } else {
        const timeKeyboard = {
          inline_keyboard: [
            [
              { text: '🌅 08:00', callback_data: 'set_time:08:00' },
              { text: '☀️ 09:00', callback_data: 'set_time:09:00' },
              { text: '🕙 10:00', callback_data: 'set_time:10:00' },
            ],
            [
              { text: '🌇 18:00', callback_data: 'set_time:18:00' },
              { text: '🌙 20:00', callback_data: 'set_time:20:00' },
              { text: '🌃 21:00', callback_data: 'set_time:21:00' },
            ],
          ],
        }

        await telegramService.sendMessage(
          chatId,
          `⏰ <b>Kunlik hisobot vaqtini tanlang:</b>\n` +
          `<i>Masalan: /vaqt 20:00 deb yozishingiz yoki quyidagi tugmalardan birini tanlashingiz mumkin:</i>`,
          { parse_mode: 'HTML', reply_markup: timeKeyboard }
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
