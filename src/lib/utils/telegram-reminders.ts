// src/lib/utils/telegram-reminders.ts
// Utilities for formatting and sending Telegram debt reminders

import { formatCurrency } from './currency'

export interface ReminderDebtInfo {
  debtorName: string
  debtorPhone: string
  remainingAmount: number
  dueDate?: string | null
  storeName?: string
  appUrl?: string
}

/**
 * Format a polite and professional Telegram debt reminder in Uzbek
 */
export function formatTelegramDebtReminder(info: ReminderDebtInfo): string {
  const storeTitle = info.storeName || "Qarz Daftari"
  const formattedRem = formatCurrency(info.remainingAmount)
  const baseUrl = info.appUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://debtbook.uz')
  const cleanPhone = info.debtorPhone.replace(/[\s-]/g, '')
  const statementUrl = `${baseUrl}/debtor/${encodeURIComponent(cleanPhone)}`

  let dueText = ''
  if (info.dueDate) {
    const due = new Date(info.dueDate)
    due.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const dateStr = due.toLocaleDateString('uz-UZ')
    if (diffDays < 0) {
      dueText = `\n⚠️ To'lov muddati (${dateStr}) ${Math.abs(diffDays)} kun oldin o'tgan.`
    } else if (diffDays === 0) {
      dueText = `\n⏳ To'lov muddati: BUGUN (${dateStr}).`
    } else {
      dueText = `\n📅 To'lov muddati: ${dateStr} (${diffDays} kun qoldi).`
    }
  }

  return (
    `Assalomu alaykum, Hurmatli ${info.debtorName}!\n\n` +
    `🏪 <b>${storeTitle}</b> do'konidan eslatma:\n` +
    `💰 Sizning qarz qoldig'ingiz: <b>${formattedRem} so'm</b>.${dueText}\n\n` +
    `💳 Hisob-kitob varaqasi va to'lov rekvizitlarini quyidagi rasmiy havola orqali ko'rishingiz mumkin:\n` +
    `👉 ${statementUrl}\n\n` +
    `Iltimos, o'z vaqtida hisob-kitob qilishingizni so'raymiz. Rahmat!`
  )
}

/**
 * Generate universal Telegram share URL
 */
export function getTelegramShareUrl(text: string, url?: string): string {
  // Telegram share endpoint
  const base = 'https://t.me/share/url'
  const params = new URLSearchParams()
  if (url) params.set('url', url)
  params.set('text', text.replace(/<[^>]*>/g, '')) // Strip HTML tags for plain text share

  return `${base}?${params.toString()}`
}

/**
 * Generate direct chat URL by phone if available
 */
export function getTelegramDirectPhoneUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://t.me/+${digits}`
}

/**
 * Call API to record that a reminder was dispatched
 */
export async function recordReminderSent(debtId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/debts/${debtId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminder_sent: true,
        last_reminder_at: new Date().toISOString(),
      }),
    })
    return res.ok
  } catch (err) {
    console.error('Failed to update reminder_sent:', err)
    return false
  }
}
