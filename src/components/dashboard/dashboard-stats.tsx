// src/components/dashboard/dashboard-stats.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'
import { Users, Wallet, ArrowDownRight, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react'

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
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/25',
      glow: 'from-blue-500/10 via-transparent to-transparent',
      borderColor: 'hover:border-blue-300',
    },
    {
      title: 'Jami Summa',
      value: totalAmount > 9999999 ? formatCurrencyShort(totalAmount) : formatCurrency(totalAmount),
      subValue: totalAmount > 9999999 ? formatCurrency(totalAmount) : `${totalPaid > 0 ? formatCurrencyShort(totalPaid) + ' undirildi' : "Hisoblangan to'liq summa"}`,
      icon: Wallet,
      badge: `${collectionRate}% undirildi`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25',
      glow: 'from-emerald-500/10 via-transparent to-transparent',
      borderColor: 'hover:border-emerald-300',
    },
    {
      title: 'Qoldiq Qarz',
      value: totalRemaining > 9999999 ? formatCurrencyShort(totalRemaining) : formatCurrency(totalRemaining),
      subValue: totalRemaining > 9999999 ? formatCurrency(totalRemaining) : "Mijozlardan olinishi kutilmoqda",
      icon: ArrowDownRight,
      badge: 'Kutilayotgan',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      iconBg: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
      glow: 'from-amber-500/10 via-transparent to-transparent',
      borderColor: 'hover:border-amber-300',
    },
    {
      title: "Muddati O'tgan",
      value: overdueCount,
      subValue: overdueCount > 0 ? "SMS eslatma jo'nating" : "Barcha muddatlar nazoratda",
      icon: AlertTriangle,
      badge: overdueCount > 0 ? "Diqqat talab" : "Hammasi joyida",
      badgeColor: overdueCount > 0 ? 'bg-red-50 text-red-700 border-red-200/60 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200',
      iconBg: overdueCount > 0 ? 'bg-red-600 text-white shadow-md shadow-red-500/25' : 'bg-slate-700 text-white shadow-xs',
      glow: overdueCount > 0 ? 'from-red-500/10 via-transparent to-transparent' : 'from-slate-500/5 via-transparent to-transparent',
      borderColor: overdueCount > 0 ? 'hover:border-red-300 border-red-200/50' : 'hover:border-slate-300',
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
              relative overflow-hidden bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 md:p-5
              transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-xs
              ${stat.borderColor}
            `}
          >
            {/* Ambient Corner Glow */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.glow} pointer-events-none rounded-tr-2xl`}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {stat.value}
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
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
        )
      })}
    </div>
  )
}
