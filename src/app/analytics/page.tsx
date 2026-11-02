// src/app/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, AlertCircle, Users, Lock, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { formatCurrency } from '@/lib/utils/currency'

type Period = 'monthly' | 'semi_annual' | 'annual'

interface ChartItem {
  name: string
  dateLabel?: string
  issued: number
  returned: number
  remaining: number
}

interface StatusItem {
  count: number
  amount: number
  percentage: number
}

interface AnalyticsData {
  period: Period
  startDate?: string
  endDate?: string
  summary: {
    totalIssued: number
    totalReturned: number
    totalRemaining: number
    repaymentRate: number
    overdueCount: number
    overdueAmount: number
    averageDebtAmount?: number
    totalDebtsCount?: number
    activeDebtorsCount?: number
  }
  chartData?: ChartItem[]
  statusDistribution?: {
    paid: StatusItem
    pending: StatusItem
    overdue: StatusItem
  }
  months: MonthData[]
  topDebtors: Array<{
    name: string
    phone: string
    amount: number
    debtCount?: number
    isOverdue?: boolean
  }>
}

interface MonthData {
  month: string
  monthShort?: string
  issued: number
  returned: number
  remaining: number
  repaymentRate?: number
  overdueCount: number
}

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser()
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [subPlan, setSubPlan] = useState<string | null>(null)

  const effectivePlan = (subPlan || user?.plan_type || 'FREE').toUpperCase()
  const hasAccess = Boolean(user?.is_trial_active || (effectivePlan && effectivePlan !== 'FREE'))

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/subscription')
        if (response.ok) {
          const result = await response.json()
          if (result.subscription?.plan_type) {
            setSubPlan(result.subscription.plan_type)
          }
        }
      } catch (error) {
        console.error('Fetch plan error:', error)
      }
    }
    fetchUserPlan()
  }, [])

  useEffect(() => {
    if (!userLoading && hasAccess) {
      fetchAnalytics()
    }
  }, [period, userLoading, hasAccess])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccessPeriod = (requestedPeriod: Period) => {
    if (effectivePlan === 'PRO' || user?.is_trial_active) return true
    if (effectivePlan === 'PLUS' && requestedPeriod === 'monthly') return true
    return false
  }

  if (userLoading) {
    return (
      <AppShell title="Analytics" subtitle="Biznesingiz statistikasi va moliyaviy oqimi">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-3 text-xs">Hisob ma&apos;lumotlari yuklanmoqda...</p>
        </div>
      </AppShell>
    )
  }

  if (!hasAccess) {
    return (
      <AppShell title="Analytics" subtitle="Biznesingiz statistikasi">
        <div className="max-w-md mx-auto py-12 px-4">
          <Card className="shadow-lg border-slate-200 rounded-3xl text-center">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Analytics — Obuna Talab Qilinadi
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                Batafsil tahlillar, oylik grafiklar va hisobotlar uchun Plus yoki Pro tarifiga o&apos;ting
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                onClick={() => (window.location.href = '/pricing')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-md shadow-blue-500/20"
              >
                Tariflarni ko&apos;rish
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Analytics" subtitle="Biznesingiz statistikasi va moliyaviy oqimi">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-200/80 p-1 rounded-2xl">
              <TabsTrigger value="monthly" className="rounded-xl font-semibold text-xs py-2">
                Oylik
              </TabsTrigger>
              <TabsTrigger
                value="semi_annual"
                disabled={!canAccessPeriod('semi_annual')}
                className="rounded-xl font-semibold text-xs py-2 flex items-center gap-1"
              >
                6 oylik
                {!canAccessPeriod('semi_annual') && (
                  <Lock className="w-3 h-3 ml-1 text-slate-400" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                disabled={!canAccessPeriod('annual')}
                className="rounded-xl font-semibold text-xs py-2 flex items-center gap-1"
              >
                Yillik
                {!canAccessPeriod('annual') && (
                  <Lock className="w-3 h-3 ml-1 text-slate-400" />
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Badge variant="outline" className="text-xs font-semibold py-1 px-3 bg-white">
            Tarif: <span className="font-bold text-blue-600 ml-1">{effectivePlan}</span>
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-3 text-xs">Hisobotlar yuklanmoqda...</p>
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/70 border-blue-200/80 shadow-2xs rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-900">Berilgan</p>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-blue-950">
                    {formatCurrency(data.summary.totalIssued)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 border-emerald-200/80 shadow-2xs rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-900">Qaytgan</p>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-950">
                    {formatCurrency(data.summary.totalReturned)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-200/80 shadow-2xs rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-900">Qoldiq</p>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-amber-950">
                    {formatCurrency(data.summary.totalRemaining)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-rose-100/70 border-rose-200/80 shadow-2xs rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <p className="text-xs font-semibold text-rose-900">Muddati o&apos;tgan</p>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-rose-950">
                    {data.summary.overdueCount} ta
                  </p>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    {formatCurrency(data.summary.overdueAmount)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="border-slate-200/80 shadow-2xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-900">Oylik taqsimot</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {data.months.map((month) => (
                    <div
                      key={month.month}
                      className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 text-sm">{month.month}</h3>
                        {month.overdueCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            {month.overdueCount} muddati o&apos;tgan
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Berildi</p>
                          <p className="font-bold text-slate-900">
                            {formatCurrency(month.issued)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Qaytdi</p>
                          <p className="font-bold text-emerald-600">
                            {formatCurrency(month.returned)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Qoldiq</p>
                          <p className="font-bold text-amber-600">
                            {formatCurrency(month.remaining)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Debtors */}
            <Card className="border-slate-200/80 shadow-2xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Users className="w-5 h-5 text-blue-600" />
                  Eng ko&apos;p qarzdorlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2.5">
                  {data.topDebtors.map((debtor, index) => (
                    <div
                      key={debtor.phone}
                      className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{debtor.name}</p>
                          <p className="text-xs text-slate-500">{debtor.phone}</p>
                        </div>
                      </div>
                      <p className="font-extrabold text-blue-600 text-sm">
                        {formatCurrency(debtor.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 text-sm">Ma&apos;lumot topilmadi</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
