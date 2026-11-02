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
  Plus,
  Calendar,
  ArrowRight,
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

  // Grafikda real harakat borligini tekshirish
  const hasChartActivity = Boolean(
    data?.chartData &&
      data.chartData.length > 0 &&
      data.chartData.some((item) => (item.issued || 0) > 0 || (item.returned || 0) > 0)
  )

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
              <TabsTrigger value="monthly" className="rounded-xl font-semibold text-xs py-2 px-2 sm:px-3">
                Oylik <span className="hidden sm:inline">(30 kun)</span>
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
            {/* 🌟 USER ONBOARDING BANNER: Agar ushbu davrda umuman qarz bo'lmasa */}
            {data.summary.totalDebtsCount === 0 && (
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-3.5 sm:p-5 text-white shadow-md shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-amber-300 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      Bu davrda hali qarz yozuvlari yo&apos;q
                    </h3>
                    <p className="text-xs text-blue-100/90 truncate">
                      Nasiyalar kiritilgach, avtomatik grafiklar va tahlillar shakllanadi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                  <Link href="/dashboard">
                    <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl h-8 px-3 text-xs shadow-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Qarz kiritish
                    </Button>
                  </Link>
                  {period !== 'monthly' && (
                    <Button
                      variant="outline"
                      onClick={() => setPeriod('monthly')}
                      className="border-white/30 text-white hover:bg-white/10 rounded-xl h-8 px-2.5 text-xs font-semibold"
                    >
                      30 kun
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 1. Kengaytirilgan KPI kartalari */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Berilgan */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 border border-blue-200/80 hover:border-blue-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-28 sm:h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                <TrendingUp className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-16 h-16 sm:w-24 sm:h-24 text-blue-600/[0.07] sm:text-blue-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100/90 text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Berilgan</span>
                  </div>

                  <div className="my-2">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {formatCurrency(data.summary.totalIssued)}
                    </p>
                  </div>

                  <p className="text-[11px] text-blue-600 font-semibold truncate">
                    {data.summary.totalDebtsCount || 0} ta qarz berildi
                  </p>
                </div>
              </div>

              {/* Qaytgan / Undirilgan */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 border border-emerald-200/80 hover:border-emerald-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-28 sm:h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                <TrendingDown className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-16 h-16 sm:w-24 sm:h-24 text-emerald-600/[0.07] sm:text-emerald-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center shadow-xs flex-shrink-0">
                      <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Qaytgan</span>
                  </div>

                  <div className="my-2">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {formatCurrency(data.summary.totalReturned)}
                    </p>
                  </div>

                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 truncate">
                    <Sparkles className="w-3 h-3 flex-shrink-0" />
                    <span>{data.summary.repaymentRate}% yig&apos;ildi</span>
                  </p>
                </div>
              </div>

              {/* Qoldiq */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 border border-amber-200/80 hover:border-amber-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-28 sm:h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                <Clock className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-16 h-16 sm:w-24 sm:h-24 text-amber-600/[0.07] sm:text-amber-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/90 text-amber-600 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Qoldiq qarz</span>
                  </div>

                  <div className="my-2">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {formatCurrency(data.summary.totalRemaining)}
                    </p>
                  </div>

                  <p className="text-[11px] text-amber-700 font-medium truncate">
                    {data.summary.activeDebtorsCount || 0} ta qarzdorda
                  </p>
                </div>
              </div>

              {/* Muddati o'tgan */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20 border border-rose-200/80 hover:border-rose-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-28 sm:h-28 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
                <ShieldAlert className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-16 h-16 sm:w-24 sm:h-24 text-rose-600/[0.07] sm:text-rose-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100/90 text-rose-600 flex items-center justify-center shadow-xs flex-shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Muddati o&apos;tgan</span>
                  </div>

                  <div className="my-2">
                    <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {data.summary.overdueCount} ta mijoz
                    </p>
                  </div>

                  <p className="text-[11px] text-rose-600 font-semibold truncate">
                    {data.summary.overdueCount > 0
                      ? `${formatCurrency(data.summary.overdueAmount)} xavfli`
                      : 'Hammasi joyida'}
                  </p>
                </div>
              </div>
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
                {hasChartActivity && (
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
                )}
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 pb-4">
                {mounted && hasChartActivity ? (
                  <div className="h-[280px] sm:h-[320px] w-full min-h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.chartData}
                        margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 9 }}
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
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="returned"
                          name="Qaytdi"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  /* 🎯 CHART EMPTY STATE: Qulay va tushunarli holat */
                  <div className="h-[260px] sm:h-[280px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/60">
                    <div className="w-13 h-13 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Pul oqimi grafigi shakllanmoqda
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
                      Ushbu davrda qarz yoki to&apos;lov kiritilgach, bu yerda haftalik tushumlar va
                      berilgan nasiyalar dinamikasi avtomatik aks etadi.
                    </p>
                    <Link href="/dashboard">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-sm shadow-blue-500/20"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Qarz kiritish
                      </Button>
                    </Link>
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
                    /* 🎯 DONUT EMPTY STATE: Barcha hisob-kitoblar toza */
                    <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                      <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Barcha hisob-kitoblar toza
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                        Ushbu davrda faol yoki kechiktirilgan qarzlar yo&apos;q. Yangi qarzlar kiritilganda
                        to&apos;lovlar holati shu yerda taqsimlanadi.
                      </p>
                    </div>
                  )}

                  {/* Maslahat kartasi */}
                  <div className="mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Qarz qaytarilish samaradorligini 85% dan yuqori saqlash biznesingiz pul oqimi
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
                  {data.topDebtors && data.topDebtors.length > 0 ? (
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
                    /* 🎯 TOP DEBTORS EMPTY STATE */
                    <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                      <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-2xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Qarzdor mijozlar yo&apos;q
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
                        Hozirda qarzdorlar ro&apos;yxati toza yoki barcha qarzlar to&apos;liq yopilgan.
                      </p>
                      <Link href="/dashboard">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold h-8 px-3"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Yangi qarz qo&apos;shish
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 4. Oylik taqsimot jadvali */}
            <Card className="border-slate-200/80 shadow-2xs rounded-3xl bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Oylik batafsil taqsimot
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Har bir oy bo&apos;yicha berilgan, undirilgan va qoldiq hisob-kitobi
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {data.months && data.months.length > 0 ? (
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
                ) : (
                  /* 🎯 OYLIK JADVAL EMPTY STATE */
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700">Oylik arxiv ma&apos;lumotlari hali shakllanmagan</p>
                    <p className="text-slate-400 mt-1">
                      Yangi oylar o&apos;tishi bilan oylik taqqosiy statistika avtomatik jamlanadi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* 🎯 BUTUN SAHIFA UCHUN EMPTY HERO STATE (agar API hech narsa qaytarmasa) */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Analitika ma&apos;lumotlari topilmadi
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
              Do&apos;koningizda hali qarzlar mavjud emas. Yangi qarz qo&apos;shib, analitika hisobotlarini shakllantiring.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-sm shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-1.5" />
                Dashboardga o&apos;tish va qarz qo&apos;shish
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
