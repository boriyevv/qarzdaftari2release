// src/lib/services/telegram.service.ts
// Official Telegram Bot & Mini App Service for Qarz Daftari (@debtbookuz_bot)

import { SupabaseClient } from '@supabase/supabase-js'
import { formatCurrency } from '@/lib/utils/currency'

export interface TelegramSendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; url?: string; callback_data?: string; web_app?: { url: string } }>>
    keyboard?: Array<Array<{ text: string; web_app?: { url: string }; request_contact?: boolean }>>
    resize_keyboard?: boolean
    one_time_keyboard?: boolean
  }
}

class TelegramService {
  private get token(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN
  }

  private get baseUrl(): string {
    return `https://api.telegram.org/bot${this.token}`
  }

  public get botUsername(): string {
    return process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'debtbookuz_bot'
  }

  public get webhookSecret(): string {
    return process.env.TELEGRAM_WEBHOOK_SECRET || 'debtbook_tg_secret_2026'
  }

  public isConfigured(): boolean {
    return Boolean(this.token && this.token.length > 10)
  }

  /**
   * Send a message to a Telegram chat
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    options: TelegramSendMessageOptions = { parse_mode: 'HTML' }
  ): Promise<{ ok: boolean; message_id?: number; description?: string }> {
    if (!this.isConfigured()) {
      console.warn('[TelegramService] Bot token not configured')
      return { ok: false, description: 'Bot token not configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options.parse_mode ?? 'HTML',
          reply_markup: options.reply_markup,
        }),
      })

      const data = await response.json()
      if (!data.ok) {
        console.error('[TelegramService] sendMessage error:', data)
      }
      return data
    } catch (error: any) {
      console.error('[TelegramService] Network error sending message:', error)
      return { ok: false, description: error.message }
    }
  }

  /**
   * Set the public webhook URL for Telegram updates
   */
  async setWebhook(webhookUrl: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
    if (!this.isConfigured()) {
      return { ok: false, description: 'Bot token not configured' }
    }

    try {
      const payload: Record<string, any> = {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }
      if (secretToken) {
        payload.secret_token = secretToken
      }

      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return await response.json()
    } catch (error: any) {
      return { ok: false, description: error.message }
    }
  }

  /**
   * Retrieve current webhook status from Telegram
   */
  async getWebhookInfo(): Promise<any> {
    if (!this.isConfigured()) return { ok: false, description: 'Not configured' }
    const res = await fetch(`${this.baseUrl}/getWebhookInfo`)
    return await res.json()
  }

  /**
   * Look up a user in Supabase by their connected telegram_chat_id
   */
  async getUserByChatId(supabase: SupabaseClient, chatId: string | number) {
    const strChatId = String(chatId)
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, store_name, phone, plan_type, locale_settings')
      .eq('locale_settings->>telegram_chat_id', strChatId)
      .maybeSingle()

    if (error) {
      console.error('[TelegramService] getUserByChatId error:', error)
      return null
    }
    return data
  }

  /**
   * Link a user's account to a Telegram Chat ID
   */
  async linkUser(
    supabase: SupabaseClient,
    userId: string,
    chatId: string | number,
    username?: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // 1. Fetch current user
      const { data: user, error: fetchErr } = await supabase
        .from('users')
        .select('id, full_name, store_name, locale_settings')
        .eq('id', userId)
        .single()

      if (fetchErr || !user) {
        return { success: false, error: 'User topilmadi' }
      }

      // 2. Merge locale_settings
      const currentLocale = typeof user.locale_settings === 'object' && user.locale_settings !== null
        ? user.locale_settings
        : {}

      const updatedLocale = {
        ...currentLocale,
        telegram_chat_id: String(chatId),
        telegram_username: username ? `@${username.replace(/^@/, '')}` : null,
        telegram_linked_at: new Date().toISOString(),
      }

      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update({ locale_settings: updatedLocale, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id, full_name, store_name, locale_settings')
        .single()

      if (updateErr) {
        return { success: false, error: updateErr.message }
      }

      return { success: true, user: updated }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Unlink a user's Telegram connection
   */
  async unlinkUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('locale_settings')
        .eq('id', userId)
        .single()

      if (!user) return false

      const currentLocale = typeof user.locale_settings === 'object' && user.locale_settings !== null
        ? { ...user.locale_settings }
        : {}

      delete (currentLocale as any).telegram_chat_id
      delete (currentLocale as any).telegram_username
      delete (currentLocale as any).telegram_linked_at

      await supabase
        .from('users')
        .update({ locale_settings: currentLocale, updated_at: new Date().toISOString() })
        .eq('id', userId)

      return true
    } catch {
      return false
    }
  }

  /**
   * Get store summary statistics for daily reports or /hisobot
   */
  async getStoreStats(supabase: SupabaseClient, userId: string) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const todayStr = now.toISOString().split('T')[0]

    // Fetch active debts
    const { data: debts } = await supabase
      .from('debts')
      .select('id, amount, paid_amount, remaining_amount, due_date, status, debtor_name')
      .eq('user_id', userId)
      .neq('status', 'paid')
      .is('deleted_at', null)

    const totalDebts = debts?.length || 0
    let totalDebtAmount = 0
    let overdueCount = 0
    let overdueAmount = 0
    let dueTodayCount = 0
    let dueTodayAmount = 0

    for (const d of debts || []) {
      const rem = d.remaining_amount ?? (d.amount - (d.paid_amount || 0))
      totalDebtAmount += rem

      if (d.due_date) {
        const dueDate = new Date(d.due_date)
        dueDate.setHours(0, 0, 0, 0)
        const dueStr = dueDate.toISOString().split('T')[0]

        if (dueStr < todayStr) {
          overdueCount++
          overdueAmount += rem
        } else if (dueStr === todayStr) {
          dueTodayCount++
          dueTodayAmount += rem
        }
      }
    }

    return {
      totalDebts,
      totalDebtAmount,
      overdueCount,
      overdueAmount,
      dueTodayCount,
      dueTodayAmount,
    }
  }

  /**
   * Create standard merchant keyboard (Telegram requires HTTPS for all web_app links)
   */
  getMerchantKeyboard(appUrl: string = 'https://debtbook.uz') {
    const isHttps = typeof appUrl === 'string' && appUrl.startsWith('https://')
    const safeUrl = isHttps ? appUrl : 'https://debtbook.uz'

    return {
      keyboard: [
        [
          { text: '📊 Bugungi hisobot' },
          { text: '🚀 Qarz Daftari', web_app: { url: `${safeUrl}/dashboard` } },
        ],
        [
          { text: '➕ Yangi qarz', web_app: { url: `${safeUrl}/dashboard?action=new-debt` } },
          { text: '⚙️ Sozlamalar va Holat' },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }
  }
}

export const telegramService = new TelegramService()
