// src/components/dashboard/dashboard-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'

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
  const stats = [
    {
      title: 'Jami Qarzlar',
      value: totalDebts,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Jami Summa',
      value: formatCurrency(totalAmount),
      shortValue: formatCurrencyShort(totalAmount),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Qoldiq',
      value: formatCurrency(totalRemaining),
      shortValue: formatCurrencyShort(totalRemaining),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: "Muddati O'tgan",
      value: overdueCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof stat.value === 'number' && stat.value > 999999
                ? stat.shortValue
                : stat.value}
            </div>
            {typeof stat.value === 'string' && stat.shortValue && (
              <div className="text-xs text-slate-500 mt-1">
                {stat.value}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}