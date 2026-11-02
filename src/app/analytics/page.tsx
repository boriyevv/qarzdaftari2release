// src/app/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Lock,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  Sparkles,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Link from 'next/link'

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
  const [mounted, setMounted] = useState(false)

  const effectivePlan = (subPlan || user?.plan_type || 'FREE').toUpperCase()
  const hasAccess = Boolean(user?.is_trial_active || (effectivePlan && effectivePlan !== 'FREE'))

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Status taqsimoti ma'lumotlari (Donut chart uchun)
  const statusChartData = data?.statusDistribution
    ? [
        {
          name: "To'langan",
          value: data.statusDistribution.paid.amount || 0,
          count: data.statusDistribution.paid.count || 0,
          percentage: data.statusDistribution.paid.percentage || 0,
          color: '#10b981', // emerald-500
        },
        {
          name: 'Kutilmoqda',
          value: data.statusDistribution.pending.amount || 0,
          count: data.statusDistribution.pending.count || 0,
          percentage: data.statusDistribution.pending.percentage || 0,
          color: '#f59e0b', // amber-500
        },
        {
          name: "Muddati o'tgan",
          value: data.statusDistribution.overdue.amount || 0,
          count: data.statusDistribution.overdue.count || 0,
          percentage: data.statusDistribution.overdue.percentage || 0,
          color: '#f43f5e', // rose-500
        },
      ].filter((item) => item.value > 0 || item.count > 0)
    : []

  // Recharts uchun xavfsiz custom tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-extrabold text-white">
                {formatCurrency(Number(entry.value) || 0)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </p>
          <p className="text-slate-300">
            Summa: <span className="font-bold text-white">{formatCurrency(item.value)}</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            {item.count} ta qarz ({item.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <AppShell title="Analytics" subtitle="Biznesingiz statistikasi va moliyaviy oqimi">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Period Selector & Tarif Badge */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-200/80 p-1 rounded-2xl">
              <TabsTrigger value="monthly" className="rounded-xl font-semibold text-xs py-2">
                Oylik (30 kun)
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

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-semibold py-1.5 px-3 bg-white border-slate-200 shadow-2xs rounded-xl"
            >
              Tarif:{' '}
              <span
                className={`font-black ml-1.5 ${
                  effectivePlan === 'PRO'
                    ? 'text-amber-600'
                    : effectivePlan === 'PLUS'
                    ? 'text-purple-600'
                    : 'text-blue-600'
                }`}
              >
                {effectivePlan}
              </span>
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-3 text-xs font-medium">Hisobotlar tahlil qilinmoqda...</p>
          </div>
        ) : data ? (
          <>
            {/* 1. Kengaytirilgan KPI kartalari */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Berilgan */}
              <Card className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200/80 shadow-2xs rounded-3xl overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Berilgan
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                      {data.summary.totalDebtsCount || 0} ta qarz
                    </span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-blue-950 tracking-tight">
                    {formatCurrency(data.summary.totalIssued)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    O&apos;rtacha:{' '}
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(data.summary.averageDebtAmount || 0)}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* Qaytgan / Undirilgan */}
              <Card className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-200/80 shadow-2xs rounded-3xl overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      Qaytgan
                    </span>
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {data.summary.repaymentRate}% yig&apos;im
                    </span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-emerald-950 tracking-tight">
                    {formatCurrency(data.summary.totalReturned)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                    Yig&apos;ish samaradorligi a&apos;lo
                  </p>
                </CardContent>
              </Card>

              {/* Qoldiq */}
              <Card className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-200/80 shadow-2xs rounded-3xl overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Qoldiq qarz
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full">
                      Kutilmoqda
                    </span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-amber-950 tracking-tight">
                    {formatCurrency(data.summary.totalRemaining)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    <span className="font-bold text-slate-700">
                      {data.summary.activeDebtorsCount || 0} ta
                    </span>{' '}
                    faol qarzdorda
                  </p>
                </CardContent>
              </Card>

              {/* Muddati o'tgan */}
              <Card className="bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 border-rose-200/80 shadow-2xs rounded-3xl overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Muddati o&apos;tgan
                    </span>
                    {data.summary.overdueCount > 0 ? (
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                        ⚠️ Xavfli
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Nazoratda
                      </span>
                    )}
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-rose-950 tracking-tight">
                    {data.summary.overdueCount} ta mijoz
                  </p>
                  <p className="text-[11px] text-rose-700 font-semibold mt-1">
                    {formatCurrency(data.summary.overdueAmount)} kechikkan
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 2. Asosiy Vizual Grafik (BarChart Cashflow) */}
            <Card className="border-slate-200/80 shadow-2xs rounded-3xl bg-white overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Nasiya berilishi va Undirilishi dinamikasi
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {period === 'monthly'
                      ? 'Oxirgi 30 kunlik haftalik pul oqimi va kutilayotgan tushumlar'
                      : "Oylar bo'yicha pul oqimi va tushumlar"}
                  </CardDescription>
                </div>
                {/* Legend indicator */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded-md bg-blue-500" />
                    Berildi
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded-md bg-emerald-500" />
                    Qaytdi
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 pb-2">
                {mounted && data.chartData && data.chartData.length > 0 ? (
                  <div className="h-[280px] sm:h-[320px] w-full min-h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => formatCurrencyShort(Number(val) || 0)}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="issued"
                          name="Berildi"
                          fill="#3b82f6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                        />
                        <Bar
                          dataKey="returned"
                          name="Qaytdi"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs">
                    Ushbu davrda grafik chizish uchun ma&apos;lumot mavjud emas
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Ikki ustunli blok: Status Donut Chart & Eng ko'p qarzdorlar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Taqsimoti (Donut Chart) */}
              <Card className="border-slate-200/80 shadow-2xs rounded-3xl bg-white overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-slate-100/80">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                    Qarzlar holati taqsimoti
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    To&apos;langan, kutilayotgan va kechikkan summalar ulushi
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  {mounted && statusChartData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
                      {/* Donut chart */}
                      <div className="h-[180px] sm:h-[200px] w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Pie
                              data={statusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={78}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Donut Markaziy Ko'rsatkich */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg sm:text-xl font-black text-slate-900">
                            {data.summary.repaymentRate}%
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Undirildi
                          </span>
                        </div>
                      </div>

                      {/* Legend List */}
                      <div className="space-y-2.5">
                        {statusChartData.map((item) => (
                          <div
                            key={item.name}
                            className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <div>
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {item.count} ta qarz ({item.percentage}%)
                                </p>
                              </div>
                            </div>
                            <span className="font-extrabold text-slate-900">
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Taqsimot ma&apos;lumotlari topilmadi
                    </div>
                  )}

                  {/* Maslahat kartasi */}
                  <div className="mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Qarz qaytarilish samaradorligini 85% dan yuqori saqlash pul oqimingiz
                      barqarorligini ta&apos;minlaydi.
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Eng ko'p qarzdorlar (Top Debtors) */}
              <Card className="border-slate-200/80 shadow-2xs rounded-3xl bg-white overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-slate-100/80 flex items-center justify-between flex-row">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Eng ko&apos;p qarzdorlar (Top 5)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Eng katta qoldiq summasiga ega mijozlar
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  {data.topDebtors.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.topDebtors.map((debtor, index) => (
                        <div
                          key={debtor.phone || index}
                          className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-100/90 text-blue-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {debtor.name}
                                </p>
                                {debtor.isOverdue && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] px-1.5 py-0 font-bold"
                                  >
                                    Kechikkan
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{debtor.phone}</p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-black text-blue-600 text-sm sm:text-base">
                              {formatCurrency(debtor.amount)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {debtor.debtCount || 1} ta faol qarz
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Qarzdorlar ro&apos;yxati bo&apos;sh
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 4. Oylik taqsimot jadvali */}
            {data.months && data.months.length > 0 && (
              <Card className="border-slate-200/80 shadow-2xs rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                    Oylik batafsil taqsimot
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Har bir oy bo&apos;yicha berilgan, undirilgan va qoldiq hisob-kitobi
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {data.months.map((month) => (
                      <div
                        key={month.month}
                        className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {month.month}
                            {month.repaymentRate !== undefined && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200"
                              >
                                {month.repaymentRate}% yig&apos;ildi
                              </Badge>
                            )}
                          </h3>
                          {month.overdueCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] font-bold">
                              {month.overdueCount} muddati o&apos;tgan
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            <p className="text-slate-500 text-[11px] mb-0.5">Berildi</p>
                            <p className="font-bold text-slate-900 truncate">
                              {formatCurrency(month.issued)}
                            </p>
                          </div>
                          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                            <p className="text-emerald-700 text-[11px] mb-0.5">Qaytdi</p>
                            <p className="font-bold text-emerald-700 truncate">
                              {formatCurrency(month.returned)}
                            </p>
                          </div>
                          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                            <p className="text-amber-700 text-[11px] mb-0.5">Qoldiq</p>
                            <p className="font-bold text-amber-700 truncate">
                              {formatCurrency(month.remaining)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <p className="text-slate-600 text-sm font-medium">Ma&apos;lumot topilmadi</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
