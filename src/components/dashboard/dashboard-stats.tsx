// src/components/dashboard/dashboard-stats.tsx
'use client'

import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'
import { Users, Wallet, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface DashboardStatsProps {
  totalDebts: number
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  overdueCount: number
  isLoading?: boolean
}

export function DashboardStats({
  totalDebts,
  totalAmount,
  totalPaid,
  totalRemaining,
  overdueCount,
  isLoading = false,
}: DashboardStatsProps) {
  // Calculate collection rate
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const stats = [
    {
      title: 'Jami Qarzlar',
      numericValue: totalDebts,
      formatter: (v: number) => Math.round(v).toLocaleString('uz-UZ'),
      subValue: 'Aktiv qarzdorlar soni',
      icon: Users,
      badge: 'Faol yozuvlar',
      badgeColor: 'bg-blue-100/80 text-blue-700 border-blue-200/60 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/25',
      ambientGlow: 'bg-blue-500/15 dark:bg-blue-500/10',
      watermarkColor: 'text-blue-600/10 dark:text-blue-400/5',
      cardBg: 'from-blue-50/60 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20',
      borderColor: 'border-blue-200/80 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-800',
    },
    {
      title: 'Jami Summa',
      numericValue: totalAmount,
      formatter: (v: number) => formatCurrency(Math.round(v)),
      subValue:
        totalAmount > 9999999
          ? formatCurrency(totalAmount)
          : `${totalPaid > 0 ? formatCurrencyShort(totalPaid) + ' undirildi' : "Hisoblangan to'liq summa"}`,
      icon: Wallet,
      badge: `${collectionRate}% undirildi`,
      badgeColor: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
      iconBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25',
      ambientGlow: 'bg-emerald-500/15 dark:bg-emerald-500/10',
      watermarkColor: 'text-emerald-600/10 dark:text-emerald-400/5',
      cardBg: 'from-emerald-50/60 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20',
      borderColor: 'border-emerald-200/80 hover:border-emerald-300 dark:border-emerald-900/50 dark:hover:border-emerald-800',
    },
    {
      title: 'Qoldiq Qarz',
      numericValue: totalRemaining,
      formatter: (v: number) => formatCurrency(Math.round(v)),
      subValue:
        totalRemaining > 9999999
          ? formatCurrency(totalRemaining)
          : 'Mijozlardan olinishi kutilmoqda',
      icon: ArrowDownRight,
      badge: 'Kutilayotgan',
      badgeColor: 'bg-amber-100/80 text-amber-700 border-amber-200/60 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
      iconBg: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
      ambientGlow: 'bg-amber-500/15 dark:bg-amber-500/10',
      watermarkColor: 'text-amber-600/10 dark:text-amber-400/5',
      cardBg: 'from-amber-50/60 via-white to-amber-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20',
      borderColor: 'border-amber-200/80 hover:border-amber-300 dark:border-amber-900/50 dark:hover:border-amber-800',
    },
    {
      title: "Muddati O'tgan",
      numericValue: overdueCount,
      formatter: (v: number) => Math.round(v).toLocaleString('uz-UZ'),
      subValue: overdueCount > 0 ? "SMS eslatma jo'nating" : 'Barcha muddatlar nazoratda',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? 'Diqqat talab' : 'Hammasi joyida',
      badgeColor:
        overdueCount > 0
          ? 'bg-rose-100/90 text-rose-700 border-rose-200/60 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      iconBg:
        overdueCount > 0
          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
          : 'bg-slate-700 text-white shadow-xs',
      ambientGlow: overdueCount > 0 ? 'bg-rose-500/15 dark:bg-rose-500/10' : 'bg-slate-500/10 dark:bg-slate-500/5',
      watermarkColor: overdueCount > 0 ? 'text-rose-600/10 dark:text-rose-400/5' : 'text-slate-600/10 dark:text-slate-400/5',
      cardBg:
        overdueCount > 0
          ? 'from-rose-50/60 via-white to-rose-50/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20'
          : 'from-slate-50/60 via-white to-slate-50/30 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-800/20',
      borderColor:
        overdueCount > 0
          ? 'border-rose-200/80 hover:border-rose-300 dark:border-rose-900/50 dark:hover:border-rose-800'
          : 'border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className={`
              group relative overflow-hidden bg-gradient-to-br ${stat.cardBg}
              border ${stat.borderColor} rounded-3xl p-4 sm:p-5
              transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs
            `}
          >
            {/* 1. Ambient Backlight Glow */}
            <div
              className={`absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 ${stat.ambientGlow} rounded-full blur-2xl pointer-events-none`}
            />

            {/* 2. Watermark Icon */}
            <Icon
              className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-28 h-28 sm:w-36 sm:h-36 ${stat.watermarkColor} -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6`}
            />

            {/* 3. Foreground Content */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${stat.iconBg}`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                  <AnimatedCounter
                    value={stat.numericValue}
                    formatter={stat.formatter}
                    isLoading={isLoading}
                    duration={1200}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                    {stat.subValue}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stat.badgeColor}`}
                  >
                    {stat.badge}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
