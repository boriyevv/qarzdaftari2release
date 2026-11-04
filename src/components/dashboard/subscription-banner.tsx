// src/components/dashboard/subscription-banner.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, AlertCircle, Zap } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  plan_type: string
  status: string
  is_trial_active: boolean
  trial_ends_at: string | null
  days_remaining: number | null
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      const data = await response.json()
      if (response.ok) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) return null

  // 1. Trial Active
  if (subscription.is_trial_active && subscription.days_remaining) {
    return (
      <div className="w-full rounded-2xl sm:rounded-3xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-500/[0.08] via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-3.5 sm:p-4.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Chap tomon: Icon + Matnlar */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100">
                  Bepul sinov: {subscription.days_remaining} kun qoldi
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200/60 dark:border-blue-700/60">
                  Trial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-700/80 dark:text-slate-300 mt-0.5 truncate hidden xs:block sm:block">
                To&apos;liq funksiyalardan foydalaning! SMS uchun kredit sotib oling.
              </p>
            </div>
          </div>

          {/* O'ng tomon: Tugmalar */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-auto">
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-blue-200 dark:border-blue-800/80 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold h-9 sm:h-10 px-3.5 sm:px-4 shadow-2xs transition-all active:scale-95"
            >
              <Link href="/sms-credits">SMS kredit</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold h-9 sm:h-10 px-4 sm:px-5 shadow-2xs shadow-blue-500/20 transition-all active:scale-95"
            >
              <Link href="/pricing">Tariflar</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Trial Expired
  if (subscription.status === 'expired') {
    return (
      <div className="w-full rounded-2xl sm:rounded-3xl border border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-r from-rose-500/[0.08] via-rose-50/40 to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 p-3.5 sm:p-4.5 shadow-2xs hover:border-rose-300 dark:hover:border-rose-800 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Chap tomon: Icon + Matnlar */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100">
                Sinov muddati tugadi
              </span>
              <p className="text-[11px] sm:text-xs text-rose-700/80 dark:text-slate-300 mt-0.5 truncate hidden xs:block sm:block">
                Davom ettirish uchun tarif rejasini tanlang
              </p>
            </div>
          </div>

          {/* O'ng tomon: Tarif tanlash tugmasi */}
          <div className="flex items-center flex-shrink-0 self-end sm:self-auto">
            <Button
              asChild
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 shadow-2xs shadow-rose-500/20 transition-all active:scale-95"
            >
              <Link href="/pricing">Tarif tanlash</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Active Subscription (PLUS / PRO)
  if (subscription.plan_type !== 'FREE') {
    const isPro = subscription.plan_type?.toUpperCase() === 'PRO'

    return (
      <div
        className={`w-full rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4.5 transition-all shadow-2xs ${
          isPro
            ? 'bg-gradient-to-r from-amber-500/[0.08] via-amber-50/40 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-800'
            : 'bg-gradient-to-r from-emerald-500/[0.08] via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Chap tomon: Icon + Badge + Matn */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                isPro
                  ? 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <Badge
                className={`font-black text-[11px] sm:text-xs uppercase px-2.5 py-1 rounded-lg shadow-2xs text-white tracking-wide ${
                  isPro
                    ? 'bg-amber-600 hover:bg-amber-600'
                    : 'bg-emerald-600 hover:bg-emerald-600'
                }`}
              >
                {subscription.plan_type}
              </Badge>

              <span
                className={`text-xs sm:text-sm font-bold truncate ${
                  isPro ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
                }`}
              >
                Faol obuna
              </span>
            </div>
          </div>

          {/* O'ng tomon: Boshqarish tugmasi */}
          <div className="flex items-center flex-shrink-0">
            <Button
              asChild
              variant="outline"
              className={`rounded-xl font-bold text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 shadow-2xs transition-all active:scale-95 bg-white dark:bg-slate-900 ${
                isPro
                  ? 'border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-50/80 dark:hover:bg-slate-800'
                  : 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800'
              }`}
            >
              <Link href="/pricing">Boshqarish</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
