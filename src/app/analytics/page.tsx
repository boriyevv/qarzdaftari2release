// src/app/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, AlertCircle, Users, Lock } from 'lucide-react'
import { MainNav } from '@/components/layout/main-nav'

type Period = 'monthly' | 'semi_annual' | 'annual'

interface AnalyticsData {
  period: Period
  months: MonthData[]
  summary: {
    totalIssued: number
    totalReturned: number
    totalRemaining: number
    overdueCount: number
    overdueAmount: number
  }
  topDebtors: Array<{
    name: string
    phone: string
    amount: number
  }>
}

interface MonthData {
  month: string
  issued: number
  returned: number
  remaining: number
  overdueCount: number
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [userPlan, setUserPlan] = useState<string>('FREE')

  useEffect(() => {
    fetchAnalytics()
    fetchUserPlan()
  }, [period])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/subscription')
      const result = await response.json()
      if (response.ok) {
        setUserPlan(result.subscription.plan_type)
      }
    } catch (error) {
      console.error('Fetch plan error:', error)
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' so\'m'
  }

  // Access control
  const canAccessPeriod = (requestedPeriod: Period) => {
    if (userPlan === 'PRO') return true
    if (userPlan === 'PLUS' && requestedPeriod === 'monthly') return true
    return false
  }

  if (userPlan === 'FREE') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Analytics - Premium Obuna Zarur</CardTitle>
            <CardDescription>
              Batafsil analitika uchun Plus yoki Pro rejaga o'ting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/pricing'} className="w-full">
              Tariflarni ko'rish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50  lg:flex  lg:justify-between">

      <div className="nav">
        <MainNav />
      </div>

      {/* Header */}
      <div className="wrapper w-full lg:w-4/5">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-slate-600">Biznesingiz statistikasi</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Period Selector */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">
                Oylik
              </TabsTrigger>
              <TabsTrigger
                value="semi_annual"
                disabled={!canAccessPeriod('semi_annual')}
              >
                6 oylik
                {!canAccessPeriod('semi_annual') && <Lock className="w-3 h-3 ml-1" />}
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                disabled={!canAccessPeriod('annual')}
              >
                Yillik
                {!canAccessPeriod('annual') && <Lock className="w-3 h-3 ml-1" />}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Yuklanmoqda...</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-900">Berilgan</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(data.summary.totalIssued)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-900">Qaytgan</p>
                    </div>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(data.summary.totalReturned)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-900">Qoldiq</p>
                    </div>
                    <p className="text-xl font-bold text-orange-900">
                      {formatCurrency(data.summary.totalRemaining)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-900">Muddati o'tgan</p>
                    </div>
                    <p className="text-xl font-bold text-red-900">
                      {data.summary.overdueCount} ta
                    </p>
                    <p className="text-xs text-red-700">
                      {formatCurrency(data.summary.overdueAmount)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Oylik taqsimot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.months.map((month) => (
                      <div key={month.month} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{month.month}</h3>
                          {month.overdueCount > 0 && (
                            <Badge variant="destructive">
                              {month.overdueCount} muddati o'tgan
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Berildi</p>
                            <p className="font-semibold">{formatCurrency(month.issued)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Qaytdi</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(month.returned)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Qoldiq</p>
                            <p className="font-semibold text-orange-600">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Eng ko'p qarzdorlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topDebtors.map((debtor, index) => (
                      <div
                        key={debtor.phone}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{debtor.name}</p>
                            <p className="text-sm text-slate-500">{debtor.phone}</p>
                          </div>
                        </div>
                        <p className="font-bold text-blue-600">
                          {formatCurrency(debtor.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">Ma'lumot topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}