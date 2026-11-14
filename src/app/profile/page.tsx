// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/contexts/user-context'
import {
  Settings,
  ShieldCheck,
  Send,
  Users,
  Store,
  Headphones,
  Share2,
  LogOut,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { securityStorage } from '@/lib/native/biometrics'
import { toast } from 'sonner'
import { nativeHaptics } from '@/lib/native'

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser()
  const [isPinSet, setIsPinSet] = useState(false)
  const [isLockOn, setIsLockOn] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile')
    }
  }, [user, userLoading])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPinSet(securityStorage.hasPin())
      setIsLockOn(securityStorage.isLockEnabled())
    }
  }, [])

  const handleLogout = async () => {
    if (!confirm('Rostdan ham hisobdan chiqmoqchimisiz?')) return

    try {
      await nativeHaptics.impact('medium')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('phone_user_session')
      }
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    }
  }

  const handleShareApp = async () => {
    await nativeHaptics.impact('light')
    const shareData = {
      title: 'Qarz Daftari',
      text: "Qarz Daftari — savdo va do'kon uchun qarzlar va to'lovlar hisobini yurituvchi eng qulay ilova! 🚀",
      url: 'https://debtbook.uz',
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled share
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://debtbook.uz')
      toast.success('Ilova havolasi nusxalandi: debtbook.uz')
    }
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const currentPlan = (user?.plan_type || 'FREE').toUpperCase()
  const userLocale = (user?.locale_settings as any) || {}
  const telegramChatId = userLocale.telegram_chat_id
  const reportTime = userLocale.telegram_daily_report_time || '09:00'
  const reportEnabled = userLocale.telegram_daily_report_enabled !== false

  return (
    <AppShell
      title="Profil"
      subtitle="Hisob va ilova boshqaruvi markazi"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* User Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-blue-500/20 flex-shrink-0">
              {user?.store_name?.[0] || user?.full_name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.store_name || user?.full_name || "Mening Do'konim"}
                </h1>
                <Badge
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    currentPlan === 'PRO'
                      ? 'bg-amber-500 text-white'
                      : currentPlan === 'PLUS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {currentPlan}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {user?.full_name ? `${user.full_name} • ` : ''}
                <span className="font-mono">{user?.phone || '-'}</span>
              </p>
            </div>
          </div>

          {/* Plan Mode Banner / Quick Upgrade */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Tarif: {currentPlan === 'PRO' ? 'Qarz Daftari PRO' : currentPlan === 'PLUS' ? 'Qarz Daftari PLUS' : 'Sinov (Bepul)'}
              </span>
            </div>
            {currentPlan === 'FREE' ? (
              <Link
                href="/pricing"
                className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>PRO ga oshirish</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Faol obuna ✓
              </span>
            )}
          </div>
        </div>

        {/* Primary Navigation Menu List (Fintech Hub) */}
        <div className="space-y-2.5">
          {/* 1. Settings (Theme & Sounds) */}
          <Link
            href="/profile/settings"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-400 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Sozlamalar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Ilova mavzusi (Yorug&apos;/Qorong&apos;i) va tovushlar
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>

          {/* 2. Security & Lock (PIN & Biometrics) */}
          <Link
            href="/profile/security"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/50 dark:group-hover:text-indigo-400 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Ilova Xavfsizligi va Qulf
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  PIN kod, Face ID va Barmoq izi himoyasi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isPinSet && isLockOn ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-2.5 py-0.5 text-[11px] rounded-full inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Himoyalangan
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-slate-500 dark:text-slate-400 text-[11px] px-2 py-0.5 rounded-full border-slate-200 dark:border-slate-700"
                >
                  O&apos;chirilgan
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* 3. Telegram Bot & Reports */}
          <Link
            href="/profile/telegram"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-sky-950/50 dark:group-hover:text-sky-400 transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Telegram Bot va Hisobotlar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Kunlik hisobot vaqti va Mini App
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {telegramChatId ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-2.5 py-0.5 text-[11px] rounded-full inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {reportEnabled ? reportTime : 'Ulangan'}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-slate-500 dark:text-slate-400 text-[11px] px-2 py-0.5 rounded-full border-slate-200 dark:border-slate-700"
                >
                  Ulanmagan
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* 4. Cashiers & Staff */}
          <Link
            href="/profile/cashiers"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-950/50 dark:group-hover:text-purple-400 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Kassirlar va Xodimlar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Do&apos;kon sotuvchilariga ruxsatlar berish
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>

          {/* 5. General Info & Store Details */}
          <Link
            href="/profile/store"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-400 transition-colors">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Umumiy ma&apos;lumotlar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Do&apos;kon, oferta va ilova ma&apos;lumotlari
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>

          {/* 6. Support & Contact */}
          <a
            href="https://t.me/debtbookuz_bot"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 group-hover:text-teal-600 dark:group-hover:bg-teal-950/50 dark:group-hover:text-teal-400 transition-colors">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Qo&apos;llab-quvvatlash bilan bog&apos;lanish
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Telegram admin va texnik yordam
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors flex-shrink-0" />
          </a>

          {/* 7. Invite Friends / Share App */}
          <button
            type="button"
            onClick={handleShareApp}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition-all group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Do&apos;stlarni taklif qilish
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Ilovani boshqa do&apos;kondorlarga ulashish
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>

          {/* 8. Logout (Red accent tile) */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 shadow-2xs hover:bg-rose-50/50 dark:hover:bg-rose-950/30 active:scale-[0.99] transition-all group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                  Chiqish
                </p>
                <p className="text-xs text-slate-400 truncate">
                  Hisobdan xavfsiz chiqish
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        </div>
      </div>
    </AppShell>
  )
}
