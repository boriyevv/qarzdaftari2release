// src/components/dashboard/compact-stats.tsx
'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react'

interface CompactStatsProps {
  stats: {
    totalDebts: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    overdueCount: number
  }
}

export function CompactStats({ stats }: CompactStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-3">
      {/* Mobile: 2x2 Grid - Compact */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          label="Jami"
          value={formatCurrency(stats.totalAmount)}
          subtext="so'm"
          variant="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          label="To'landi"
          value={formatCurrency(stats.paidAmount)}
          subtext="so'm"
          variant="green"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-orange-500" />}
          label="Qoldiq"
          value={formatCurrency(stats.pendingAmount)}
          subtext="so'm"
          variant="orange"
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4 text-red-500" />}
          label="Muddati o'tgan"
          value={stats.overdueCount.toString()}
          subtext="ta qarz"
          variant="red"
        />
      </div>

      {/* Desktop: 4 Cards - Full */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Jami qarzlar</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stats.totalDebts} ta qarz</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">To&apos;langan</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {Math.round((stats.paidAmount / stats.totalAmount) * 100 || 0)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Qoldiq</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kutilmoqda</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Muddati o&apos;tgan</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.overdueCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">ta qarz</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Link to Analytics */}
      <button 
        onClick={() => window.location.href = '/analytics'}
        className="w-full text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline lg:hidden"
      >
        To&apos;liq analitika →
      </button>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  variant: 'blue' | 'green' | 'orange' | 'red'
}

function StatCard({ icon, label, value, subtext, variant }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60',
    green: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60',
    orange: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60',
    red: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60',
  }

  return (
    <Card className={`p-3 rounded-2xl border ${bgColors[variant]} shadow-2xs transition-all duration-150 hover:scale-[1.02]`}>
      <div className="flex items-start gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtext}</p>
        </div>
      </div>
    </Card>
  )
}