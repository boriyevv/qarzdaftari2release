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
      <div className="w-full rounded-2xl sm:rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-500/[0.08] via-indigo-50/40 to-white p-3 sm:p-3.5 shadow-2xs hover:border-blue-300 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Chap tomon: Icon + Matnlar (Mukammal markazlashgan) */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100/90 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-blue-950">
                  Bepul sinov: {subscription.days_remaining} kun qoldi
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200/60">
                  Trial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-700/80 mt-0.5 truncate hidden xs:block sm:block">
                To&apos;liq funksiyalardan foydalaning! SMS uchun kredit sotib oling.
              </p>
            </div>
          </div>

          {/* O'ng tomon: Tugmalar */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-xl border-blue-200 hover:border-blue-300 bg-white text-blue-800 hover:bg-blue-50 text-xs font-semibold h-8 px-3 shadow-2xs"
            >
              <Link href="/sms-credits">SMS kredit</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-3.5 shadow-2xs"
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
      <div className="w-full rounded-2xl sm:rounded-3xl border border-rose-200/80 bg-gradient-to-r from-rose-500/[0.08] via-rose-50/40 to-white p-3 sm:p-3.5 shadow-2xs hover:border-rose-300 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Chap tomon: Icon + Matnlar */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100/90 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-rose-950">
                Sinov muddati tugadi
              </span>
              <p className="text-[11px] sm:text-xs text-rose-700/80 mt-0.5 truncate hidden xs:block sm:block">
                Davom ettirish uchun tarif rejasini tanlang
              </p>
            </div>
          </div>

          {/* O'ng tomon: Tarif tanlash tugmasi */}
          <div className="flex items-center flex-shrink-0 self-end sm:self-auto">
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-8 px-4 shadow-2xs"
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
        className={`w-full rounded-2xl sm:rounded-3xl border p-2.5 sm:p-3.5 transition-all shadow-2xs ${
          isPro
            ? 'bg-gradient-to-r from-amber-500/[0.08] via-amber-50/40 to-white border-amber-200/80 hover:border-amber-300'
            : 'bg-gradient-to-r from-emerald-500/[0.08] via-emerald-50/40 to-white border-emerald-200/80 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Chap tomon: Icon + Badge + Matn (100% bitta flex qatorda, mutanosib va markazlashgan) */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                isPro
                  ? 'bg-amber-100/90 text-amber-700'
                  : 'bg-emerald-100/90 text-emerald-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Badge
                className={`font-black text-[11px] sm:text-xs uppercase px-2 sm:px-2.5 py-0.5 rounded-lg shadow-2xs text-white tracking-wide ${
                  isPro
                    ? 'bg-amber-600 hover:bg-amber-600'
                    : 'bg-emerald-600 hover:bg-emerald-600'
                }`}
              >
                {subscription.plan_type}
              </Badge>

              <span
                className={`text-xs sm:text-sm font-bold truncate ${
                  isPro ? 'text-amber-950' : 'text-emerald-950'
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
              size="sm"
              variant="outline"
              className={`rounded-xl font-bold text-xs h-7.5 sm:h-8.5 px-3 sm:px-4 shadow-2xs transition-colors bg-white ${
                isPro
                  ? 'border-amber-200 hover:border-amber-300 text-amber-900 hover:bg-amber-50/80'
                  : 'border-emerald-200 hover:border-emerald-300 text-emerald-900 hover:bg-emerald-50/80'
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
