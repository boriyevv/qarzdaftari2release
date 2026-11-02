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
  Phone,
  ExternalLink,
  MessageSquare,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportAnalyticsToExcel, exportAnalyticsToPDF } from '@/lib/export/analytics-export'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  debts?: Array<{
    id: string
    debtor_name: string
    debtor_phone: string
    amount: number
    paid_amount: number
    remaining_amount: number
    status: string
    status_label?: string
    debt_date: string
    due_date: string
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

  // SMS Reminder Modal State
  const [selectedDebtor, setSelectedDebtor] = useState<{
    name: string
    phone: string
    amount: number
  } | null>(null)
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsCredits, setSmsCredits] = useState<number>(0)
  const [isSendingSMS, setIsSendingSMS] = useState(false)
  const [smsStatus, setSmsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleOpenSMS = (debtor: { name: string; phone: string; amount: number }) => {
    setSelectedDebtor(debtor)
    const storeTitle = user?.store_name || "Qarz Daftari"
    const template = `Hurmatli ${debtor.name}, sizda ${formatCurrency(debtor.amount)} qarz mavjud. To'lashingizni so'raymiz. ${storeTitle}.`
    setSmsMessage(template)
    setSmsStatus(null)

    const initialCredits = user?.sms_credits?.balance ?? 0
    setSmsCredits(initialCredits)

    fetch('/api/sms-credits')
      .then((res) => res.json())
      .then((d) => {
        if (typeof d.remaining_credits === 'number') {
          setSmsCredits(d.remaining_credits)
        }
      })
      .catch(() => {})

    setSmsModalOpen(true)
  }

  const handleSendSMS = async () => {
    if (!selectedDebtor || !smsMessage.trim() || smsCredits <= 0) return
    setIsSendingSMS(true)
    setSmsStatus(null)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_phone: selectedDebtor.phone,
          message: smsMessage,
          type: 'payment_reminder',
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setSmsStatus({ type: 'success', message: 'SMS eslatma muvaffaqiyatli yuborildi!' })
        setSmsCredits((prev) => Math.max(0, prev - 1))
        setTimeout(() => {
          setSmsModalOpen(false)
        }, 1500)
      } else {
        setSmsStatus({ type: 'error', message: result.error || 'SMS yuborishda xatolik yuz berdi' })
      }
    } catch {
      setSmsStatus({ type: 'error', message: 'Server bilan aloqa uzildi' })
    } finally {
      setIsSendingSMS(false)
    }
  }

  // Hisobot Eksport qilish holati
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!data) return
    setExporting(format)
    try {
      const options = {
        storeName: user?.store_name || user?.full_name || "Qarz Daftari",
        period,
        summary: {
          totalIssued: data.summary.totalIssued,
          totalReturned: data.summary.totalReturned,
          totalRemaining: data.summary.totalRemaining,
          repaymentRate: data.summary.repaymentRate,
          overdueCount: data.summary.overdueCount,
          overdueAmount: data.summary.overdueAmount,
          averageDebtAmount: data.summary.averageDebtAmount || 0,
          totalDebtsCount: data.summary.totalDebtsCount || 0,
          activeDebtorsCount: data.summary.activeDebtorsCount || 0,
        },
        topDebtors: data.topDebtors || [],
        debts: data.debts || [],
      }

      if (format === 'excel') {
        exportAnalyticsToExcel(options)
      } else {
        exportAnalyticsToPDF(options)
      }
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(null)
    }
  }

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

            {/* 📥 Eksport Dropdown Menyusi */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={Boolean(exporting) || loading || !data}
                  className="rounded-xl border-slate-200 hover:border-blue-300 font-bold text-xs h-8 px-3 shadow-2xs bg-white text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  {exporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{exporting ? 'Yuklanmoqda...' : 'Eksport'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-slate-200 bg-white">
                <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Hisobotni yuklab olish
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                <DropdownMenuItem
                  onClick={() => handleExport('excel')}
                  className="rounded-xl flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100/90 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">Excel hisobot</p>
                    <p className="text-[10px] text-slate-400 font-normal">.xlsx jadval formati</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleExport('pdf')}
                  className="rounded-xl flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100/90 text-rose-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">PDF hisobot</p>
                    <p className="text-[10px] text-slate-400 font-normal">A4 rasmiy hujjat</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-3 text-xs font-medium">Hisobotlar tahlil qilinmoqda...</p>
          </div>
        ) : data ? (
          <>
            {/* 1. Kengaytirilgan Asosiy KPI kartalari (Dashboard bilan 100% uyg'un va keng) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Berilgan */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 border border-blue-200/80 hover:border-blue-300 rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                <TrendingUp className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-28 h-28 sm:w-36 sm:h-36 text-blue-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Berilgan Nasiya
                    </span>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-500/25">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(data.summary.totalIssued)}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                        {data.summary.totalDebtsCount || 0} ta qarz yozuvi
                      </p>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-100/80 text-blue-700 border-blue-200/60">
                        {period === 'monthly' ? '30 kunlik' : period === 'semi_annual' ? '6 oylik' : '1 yillik'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qaytgan / Undirilgan */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border border-emerald-200/80 hover:border-emerald-300 rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                <TrendingDown className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-28 h-28 sm:w-36 sm:h-36 text-emerald-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Qaytarilgan
                    </span>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(data.summary.totalReturned)}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                        Kutilayotgan tushumlar
                      </p>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-100/80 text-emerald-700 border-emerald-200/60">
                        {data.summary.repaymentRate}% yig&apos;ildi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qoldiq */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 border border-amber-200/80 hover:border-amber-300 rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                <Clock className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-28 h-28 sm:w-36 sm:h-36 text-amber-600/10 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Qoldiq Qarz
                    </span>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-amber-600 text-white shadow-md shadow-amber-500/25">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(data.summary.totalRemaining)}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                        {data.summary.activeDebtorsCount || 0} ta qarzdorda
                      </p>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-100/80 text-amber-700 border-amber-200/60">
                        Kutilmoqda
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Muddati o'tgan */}
              <div className={`group relative overflow-hidden bg-gradient-to-br ${data.summary.overdueCount > 0 ? 'from-rose-50/60 via-white to-rose-50/30 border-rose-200/80 hover:border-rose-300' : 'from-slate-50/60 via-white to-slate-50/30 border-slate-200/80 hover:border-slate-300'} border rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs`}>
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 ${data.summary.overdueCount > 0 ? 'bg-rose-500/15' : 'bg-slate-500/10'} rounded-full blur-2xl pointer-events-none`} />
                <ShieldAlert className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-28 h-28 sm:w-36 sm:h-36 ${data.summary.overdueCount > 0 ? 'text-rose-600/10' : 'text-slate-600/10'} -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6`} />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Muddati O&apos;tgan
                    </span>
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${data.summary.overdueCount > 0 ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25' : 'bg-slate-700 text-white shadow-xs'}`}>
                      <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {data.summary.overdueCount} ta mijoz
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                        {data.summary.overdueCount > 0
                          ? `${formatCurrency(data.summary.overdueAmount)} xavfli`
                          : 'Hammasi joyida'}
                      </p>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${data.summary.overdueCount > 0 ? 'bg-rose-100/90 text-rose-700 border-rose-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {data.summary.overdueCount > 0 ? 'Diqqat talab' : 'Nazoratda'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 Kichik va ixcham info banner: faqat qarz yozuvlari kiritilmagan bo'lsa */}
            {data.summary.totalDebtsCount === 0 && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Tanlangan davrda qarz yozuvlari mavjud emas.</span>
                </div>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-7 px-3 text-xs shadow-2xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Qarz qo&apos;shish
                  </Button>
                </Link>
              </div>
            )}

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
                          className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100 rounded-2xl gap-3"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100/90 text-blue-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {debtor.phone ? (
                                  <Link
                                    href={`/debtor/${debtor.phone}`}
                                    className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate"
                                  >
                                    {debtor.name}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-sm text-slate-900 truncate">
                                    {debtor.name}
                                  </span>
                                )}
                                {debtor.isOverdue && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] px-1.5 py-0 font-bold"
                                  >
                                    Kechikkan
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{debtor.phone || 'Telefon kiritilmagan'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-black text-blue-600 text-sm sm:text-base">
                                {formatCurrency(debtor.amount)}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {debtor.debtCount || 1} ta faol qarz
                              </p>
                            </div>

                            {/* Tezkor Aloqa va SMS tugmalari */}
                            <div className="flex items-center gap-1">
                              {debtor.phone && (
                                <a
                                  href={`tel:${debtor.phone}`}
                                  title="Qo'ng'iroq qilish"
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-colors shadow-2xs"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSMS(debtor)}
                                title="SMS Eslatma yuborish"
                                className="w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-colors shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                              {debtor.phone && (
                                <Link
                                  href={`/debtor/${debtor.phone}`}
                                  title="Mijoz profiliga o'tish"
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-500 border border-slate-200/80 hidden sm:flex items-center justify-center transition-colors shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
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

      {/* 📩 SMS Eslatma Yuborish Modali */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-200 shadow-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              SMS Eslatma yuborish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedDebtor?.name} ({selectedDebtor?.phone || 'Telefon yo\'q'}) mijoziga to&apos;lov eslatmasi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* SMS Credits Balans Ko'rsatkichi */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                SMS balansingiz:
              </span>
              <Badge
                variant={smsCredits > 0 ? "secondary" : "destructive"}
                className="font-bold text-xs rounded-lg"
              >
                {smsCredits} ta kredit
              </Badge>
            </div>

            {smsCredits === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 flex items-start justify-between gap-2">
                <span>SMS yuborish uchun balansingizda kredit mavjud emas.</span>
                <Link
                  href="/sms-credits"
                  target="_blank"
                  className="font-bold text-amber-900 underline flex-shrink-0"
                >
                  Sotib olish ↗
                </Link>
              </div>
            )}

            {/* Xabar Matni */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <label className="font-semibold text-slate-700">Xabar matni:</label>
                <span>{smsMessage.length} belgi</span>
              </div>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={4}
                className="rounded-2xl border-slate-200 text-sm focus:border-blue-500 resize-none p-3"
                placeholder="Xabar matnini kiriting..."
              />
            </div>

            {/* Status Xabari */}
            {smsStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  smsStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {smsStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{smsStatus.message}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSmsModalOpen(false)}
              className="rounded-xl border-slate-200 font-semibold text-xs h-9 px-4"
              disabled={isSendingSMS}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={isSendingSMS || smsCredits <= 0 || !smsMessage.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs h-9 px-5 shadow-xs text-white"
            >
              {isSendingSMS ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  SMS yuborish (1 kredit)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
