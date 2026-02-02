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
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Jami qarzlar</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-slate-500">{stats.totalDebts} ta qarz</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">To'langan</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-xs text-slate-500">
                {Math.round((stats.paidAmount / stats.totalAmount) * 100 || 0)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Qoldiq</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-xs text-slate-500">Kutilmoqda</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Muddati o'tgan</p>
              <p className="text-2xl font-bold">{stats.overdueCount}</p>
              <p className="text-xs text-slate-500">ta qarz</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Link to Analytics */}
      <button 
        onClick={() => window.location.href = '/analytics'}
        className="w-full text-center text-sm text-blue-600 hover:underline lg:hidden"
      >
        To'liq analitika →
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
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
  }

  return (
    <Card className={`p-3 ${bgColors[variant]}`}>
      <div className="flex items-start gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-600 truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
          <p className="text-xs text-slate-500">{subtext}</p>
        </div>
      </div>
    </Card>
  )
}