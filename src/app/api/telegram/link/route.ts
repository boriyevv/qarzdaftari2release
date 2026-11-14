// src/app/api/telegram/link/route.ts
// Endpoint for users to manage their Telegram account connection

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/admin'
import { telegramService } from '@/lib/services/telegram.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 })
    }

    const settings = (user.locale_settings as any) || {}
    const telegramChatId = settings.telegram_chat_id || null
    const telegramUsername = settings.telegram_username || null
    const telegramLinkedAt = settings.telegram_linked_at || null
    const isLinked = Boolean(telegramChatId)

    const botUsername = telegramService.botUsername
    const deepLink = `https://t.me/${botUsername}?start=link_${user.id}`

    return NextResponse.json({
      success: true,
      isLinked,
      telegramChatId,
      telegramUsername,
      telegramLinkedAt,
      botUsername,
      deepLink,
      isBotConfigured: telegramService.isConfigured(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { action } = body

    const adminSupabase = createAdminClient()

    if (action === 'unlink') {
      await telegramService.unlinkUser(adminSupabase, user.id)
      return NextResponse.json({ success: true, message: 'Telegram hisob muvaffaqiyatli uzildi' })
    }

    if (action === 'test_message') {
      const settings = (user.locale_settings as any) || {}
      const telegramChatId = settings.telegram_chat_id
      if (!telegramChatId) {
        return NextResponse.json({ error: 'Telegram hisob ulanmagan' }, { status: 400 })
      }

      const storeTitle = user.store_name || user.full_name || "Mening Do'konim"
      const result = await telegramService.sendMessage(
        telegramChatId,
        `🔔 <b>Test Bildirishnomasi!</b>\n\n` +
        `Hurmatli <b>${storeTitle}</b>, sizning Qarz Daftari profilingiz va Telegram bot o'rtasidagi aloqa a'lo darajada ishlamoqda. 🚀`,
        {
          parse_mode: 'HTML',
          reply_markup: telegramService.getMerchantKeyboard(),
        }
      )

      if (!result.ok) {
        return NextResponse.json(
          { error: result.description || 'Xabar yuborishda xatolik yuz berdi' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Test xabari Telegramingizga yuborildi!' })
    }

    return NextResponse.json({ error: "Noto'g'ri amal (action)" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
