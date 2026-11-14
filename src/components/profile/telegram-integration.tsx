// src/components/profile/telegram-integration.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Send,
  CheckCircle2,
  ExternalLink,
  Unlink,
  Bell,
  Sparkles,
  RefreshCw,
  Copy,
  Clock,
  ShieldCheck,
} from 'lucide-react'

export function TelegramIntegration() {
  const [data, setData] = useState<{
    isLinked: boolean
    telegramChatId?: string | null
    telegramUsername?: string | null
    telegramLinkedAt?: string | null
    botUsername: string
    deepLink: string
    isBotConfigured: boolean
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [testingMsg, setTestingMsg] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/telegram/link')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      }
    } catch (e) {
      console.error('Failed to load telegram connection status:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleTestMessage = async () => {
    setTestingMsg(true)
    try {
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_message' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Telegram botingizga test xabar yuborildi!')
      } else {
        toast.error(json.error || 'Test xabari yuborilmadi')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setTestingMsg(false)
    }
  }

  const handleUnlink = async () => {
    if (!confirm("Rostdan ham Telegram bot ulanishini uzmoqchimisiz? Ertalabki avtomatik hisobotlar to'xtatiladi.")) {
      return
    }

    setUnlinking(true)
    try {
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'Ulanish uzildi')
        await loadStatus()
      } else {
        toast.error(json.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Ulanishni uzishda xatolik yuz berdi')
    } finally {
      setUnlinking(false)
    }
  }

  const handleCopyLink = () => {
    if (data?.deepLink) {
      navigator.clipboard.writeText(data.deepLink)
      toast.success('Telegram havolasi nusxalandi!')
    }
  }

  if (loading) {
    return (
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3.5 w-72 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="h-28 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              Telegram Bot & Mini App Integratsiyasi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rasmiy <b>@{data?.botUsername || 'debtbookuz_bot'}</b> orqali avtomatik ertalabki hisobotlar va tezkor boshqaruv
            </CardDescription>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            {data?.isLinked ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 text-xs inline-flex items-center gap-1.5 rounded-full shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Faol Ulangan
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-slate-500 dark:text-slate-400 font-semibold px-2.5 py-1 text-xs rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
              >
                Ulanmagan
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {data?.isLinked ? (
          /* Linked State */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {data.telegramUsername ? `${data.telegramUsername}` : 'Telegram Hisob'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (ID: {data.telegramChatId})
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Har kuni ertalab <b>09:00</b> da Telegramingizga kunlik qarzlar hisoboti yuboriladi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestMessage}
                  disabled={testingMsg}
                  className="rounded-xl text-xs font-semibold h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  {testingMsg ? 'Yuborilmoqda...' : 'Test xabari'}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-8"
                >
                  <a
                    href={`https://t.me/${data.botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Botni ochish
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="rounded-xl text-xs font-semibold h-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                  title="Ulanishni uzish"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Not Linked State */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Avtomatik Ertalabki Hisobot</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Har kuni 09:00 da qarzlar va to&apos;lovlar statistikasi</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Telegram Mini App</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Telegram ichida parolsiz 1 ta bosishda ilovani ochish</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Xavfsiz va Shaxsiy</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Faqat sizning do&apos;koningiz ma&apos;lumotlari bog&apos;lanadi</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Button
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs h-10 px-5 shadow-sm shadow-blue-500/20"
              >
                <a
                  href={data?.deepLink || `https://t.me/${data?.botUsername || 'debtbookuz_bot'}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    // Poll or reload status after opening
                    setTimeout(loadStatus, 4000)
                    setTimeout(loadStatus, 8000)
                  }}
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Telegram Botga Ulash
                </a>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="w-full sm:w-auto rounded-2xl text-xs font-semibold h-10 px-4 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Havolani nusxalash
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={loadStatus}
                className="w-full sm:w-auto rounded-2xl text-xs font-semibold h-10 px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                title="Statusni yangilash"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
