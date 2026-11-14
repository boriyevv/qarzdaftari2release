// src/app/api/security/pin-reset/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { telegramService } from '@/lib/services/telegram.service'

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // 1. Resolve authenticated user profile
    let userId: string | null = null

    try {
      const authResult = await supabase.auth.getUser()
      if (authResult.data?.user?.id) {
        userId = authResult.data.user.id
      }
    } catch {}

    if (!userId) {
      const cookieStore = await cookies()
      const phoneUserId = cookieStore.get('phone_user_session')?.value || req.headers.get('x-phone-session')
      if (phoneUserId) {
        userId = phoneUserId
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Foydalanuvchi tizimga kirmagan' },
        { status: 401 }
      )
    }

    const { data: userProfile, error: profileErr } = await adminSupabase
      .from('users')
      .select('id, full_name, store_name, phone, locale_settings')
      .eq('id', userId)
      .maybeSingle()

    if (profileErr || !userProfile) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Foydalanuvchi profili topilmadi' },
        { status: 404 }
      )
    }

    const localeSettings = userProfile.locale_settings || {}
    const telegramChatId = localeSettings.telegram_chat_id

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'send_code'

    // ==========================================
    // ACTION 1: SEND CODE TO TELEGRAM BOT
    // ==========================================
    if (action === 'send_code') {
      if (!telegramChatId) {
        return NextResponse.json(
          {
            error: 'NO_TELEGRAM',
            message: "Telegram botingiz ulanmagan. Iltimos, hisobdan chiqib, telefon raqamingiz orqali qayta kiring.",
          },
          { status: 400 }
        )
      }

      // Generate 4-digit code (e.g. 1000 - 9999)
      const code = Math.floor(1000 + Math.random() * 9000).toString()
      const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

      // Store in user locale_settings
      const updatedLocale = {
        ...localeSettings,
        pin_reset_code: code,
        pin_reset_code_expires: expiresAt,
      }

      const { error: updateErr } = await adminSupabase
        .from('users')
        .update({ locale_settings: updatedLocale })
        .eq('id', userId)

      if (updateErr) {
        console.error('[PinReset] Failed to update user locale_settings:', updateErr)
        return NextResponse.json(
          { error: 'DB_ERROR', message: "Kodni saqlashda xatolik yuz berdi" },
          { status: 500 }
        )
      }

      // Send to Telegram
      const name = userProfile.full_name || userProfile.store_name || 'Foydalanuvchi'
      const message =
        `🔐 <b>Qarz Daftari — Qulfni yangilash</b>\n\n` +
        `Hurmatli <b>${name}</b>,\n` +
        `Ilovangiz PIN kodini yangilash uchun 4 xonali tasdiq kodi:\n\n` +
        `🔑 <code style="font-size: 22px;"><b>${code}</b></code>\n\n` +
        `<i>Ushbu 4 ta raqamni ilovaga kiriting va o'zingiz xohlagan yangi PIN kodni o'rnating.\n` +
        `Kod 5 daqiqa davomida amal qiladi.</i>`

      const tgRes = await telegramService.sendMessage(telegramChatId, message, {
        parse_mode: 'HTML',
      })

      if (!tgRes.ok) {
        console.error('[PinReset] Failed to send Telegram message:', tgRes.description)
        return NextResponse.json(
          { error: 'TG_FAILED', message: "Telegram botga xabar yetkazib bo'lmadi. Bot bloklanmaganligiga ishonch hosil qiling." },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '4 xonali tasdiq kodi Telegram botingizga yuborildi',
      })
    }

    // ==========================================
    // ACTION 2: VERIFY CODE
    // ==========================================
    if (action === 'verify_code') {
      const enteredCode = (body.code || '').toString().trim()
      const storedCode = (localeSettings.pin_reset_code || '').toString().trim()
      const expiresAt = Number(localeSettings.pin_reset_code_expires || 0)

      if (!storedCode || !enteredCode) {
        return NextResponse.json(
          { error: 'INVALID_CODE', message: "Tasdiq kodi kiritilmadi" },
          { status: 400 }
        )
      }

      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { error: 'EXPIRED_CODE', message: "Tasdiq kodining amal qilish muddati tugagan. Yangi kod so'rang." },
          { status: 400 }
        )
      }

      if (enteredCode !== storedCode) {
        return NextResponse.json(
          { error: 'MISMATCH', message: "Noto'g'ri tasdiq kodi" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        verified: true,
      })
    }

    // ==========================================
    // ACTION 3: FINALIZE & SAVE NEW PIN
    // ==========================================
    if (action === 'save_new_pin') {
      const pinHash = body.pinHash

      const updatedLocale = { ...localeSettings }
      delete updatedLocale.pin_reset_code
      delete updatedLocale.pin_reset_code_expires
      if (pinHash) {
        updatedLocale.app_pin_hash = pinHash
      }

      await adminSupabase
        .from('users')
        .update({ locale_settings: updatedLocale })
        .eq('id', userId)

      // Optional Telegram success notification
      if (telegramChatId) {
        const name = userProfile.full_name || 'Foydalanuvchi'
        await telegramService.sendMessage(
          telegramChatId,
          `✅ <b>PIN kod muvaffaqiyatli yangilandi!</b>\n\n` +
          `Hurmatli <b>${name}</b>, Qarz Daftari ilovangiz uchun o'zingiz kiritgan yangi 4 xonali PIN kod saqlandi va ilova qulfi ochildi. 🛡️`,
          { parse_mode: 'HTML' }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Yangi PIN kod muvaffaqiyatli saqlandi',
      })
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
  } catch (err: any) {
    console.error('[PinReset API Error]:', err)
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err?.message || 'Server xatoligi yuz berdi' },
      { status: 500 }
    )
  }
}
