// src/components/dashboard/dashboard-stats.tsx
'use client'

import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'
import { Users, Wallet, ArrowDownRight, AlertTriangle, Clock, TrendingUp, Sparkles } from 'lucide-react'

interface DashboardStatsProps {
  totalDebts: number
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  overdueCount: number
}

export function DashboardStats({
  totalDebts,
  totalAmount,
  totalPaid,
  totalRemaining,
  overdueCount,
}: DashboardStatsProps) {
  // Calculate collection rate
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const stats = [
    {
      title: 'Jami Qarzlar',
      value: totalDebts,
      subValue: 'Aktiv qarzdorlar soni',
      icon: Users,
      badge: 'Faol yozuvlar',
      badgeColor: 'bg-blue-100/80 text-blue-700 border-blue-200/60',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/25',
      ambientGlow: 'bg-blue-500/15',
      watermarkColor: 'text-blue-600/10',
      cardBg: 'from-blue-50/60 via-white to-blue-50/30',
      borderColor: 'border-blue-200/80 hover:border-blue-300',
    },
    {
      title: 'Jami Summa',
      value: totalAmount > 9999999 ? formatCurrencyShort(totalAmount) : formatCurrency(totalAmount),
      subValue:
        totalAmount > 9999999
          ? formatCurrency(totalAmount)
          : `${totalPaid > 0 ? formatCurrencyShort(totalPaid) + ' undirildi' : "Hisoblangan to'liq summa"}`,
      icon: Wallet,
      badge: `${collectionRate}% undirildi`,
      badgeColor: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25',
      ambientGlow: 'bg-emerald-500/15',
      watermarkColor: 'text-emerald-600/10',
      cardBg: 'from-emerald-50/60 via-white to-emerald-50/30',
      borderColor: 'border-emerald-200/80 hover:border-emerald-300',
    },
    {
      title: 'Qoldiq Qarz',
      value:
        totalRemaining > 9999999
          ? formatCurrencyShort(totalRemaining)
          : formatCurrency(totalRemaining),
      subValue:
        totalRemaining > 9999999
          ? formatCurrency(totalRemaining)
          : 'Mijozlardan olinishi kutilmoqda',
      icon: ArrowDownRight,
      badge: 'Kutilayotgan',
      badgeColor: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      iconBg: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
      ambientGlow: 'bg-amber-500/15',
      watermarkColor: 'text-amber-600/10',
      cardBg: 'from-amber-50/60 via-white to-amber-50/30',
      borderColor: 'border-amber-200/80 hover:border-amber-300',
    },
    {
      title: "Muddati O'tgan",
      value: overdueCount,
      subValue: overdueCount > 0 ? "SMS eslatma jo'nating" : 'Barcha muddatlar nazoratda',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? 'Diqqat talab' : 'Hammasi joyida',
      badgeColor:
        overdueCount > 0
          ? 'bg-rose-100/90 text-rose-700 border-rose-200/60'
          : 'bg-slate-100 text-slate-600 border-slate-200',
      iconBg:
        overdueCount > 0
          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
          : 'bg-slate-700 text-white shadow-xs',
      ambientGlow: overdueCount > 0 ? 'bg-rose-500/15' : 'bg-slate-500/10',
      watermarkColor: overdueCount > 0 ? 'text-rose-600/10' : 'text-slate-600/10',
      cardBg:
        overdueCount > 0
          ? 'from-rose-50/60 via-white to-rose-50/30'
          : 'from-slate-50/60 via-white to-slate-50/30',
      borderColor:
        overdueCount > 0
          ? 'border-rose-200/80 hover:border-rose-300'
          : 'border-slate-200/80 hover:border-slate-300',
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
              className={`absolute -bottom-6 -right-6 w-28 h-28 ${stat.ambientGlow} rounded-full blur-2xl pointer-events-none`}
            />

            {/* 2. Watermark Icon */}
            <Icon
              className={`absolute -bottom-3 -right-3 w-20 h-20 sm:w-24 sm:h-24 ${stat.watermarkColor} -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6`}
            />

            {/* 3. Foreground Content */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {stat.value}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
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
