// src/app/debtor/[phone]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Phone, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'

interface Debt {
  id: string
  amount: number
  paid_amount: number
  status: string
  due_date: string | null
  created_at: string
  note: string | null
}

interface DebtorData {
  name: string
  phone: string
  debts: Debt[]
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  debtCount: number
}

export default function DebtorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const phone = params.phone as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DebtorData | null>(null)

  useEffect(() => {
    fetchDebtorData()
  }, [phone])

  const fetchDebtorData = async () => {
    try {
      const response = await fetch(`/api/debtor/${encodeURIComponent(phone)}`)
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
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
      }).format(amount) + " so'm"
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <AppShell
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Yuklanmoqda...' },
        ]}
        showBack={true}
      >
        <DebtorSkeleton />
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Qarzdor topilmadi' },
        ]}
        showBack={true}
      >
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full">
            <p className="text-slate-600 font-medium">Qarzdor ma&apos;lumotlari topilmadi</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4 rounded-xl">
              Dashboardga qaytish
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: data.name },
      ]}
      showBack={true}
      showAddDebtButton={true}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Debtor Info Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Phone className="w-4 h-4 text-blue-600" />
                <a href={`tel:${data.phone}`} className="hover:underline font-medium">
                  {data.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-bold text-xs bg-slate-100 text-slate-700">
                {data.debtCount} ta qarz yozuvi
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            label="Jami berilgan"
            value={formatCurrency(data.totalAmount)}
            bgColor="bg-blue-50/70 border border-blue-200/80"
            textColor="text-blue-900"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            label="To'landi"
            value={formatCurrency(data.totalPaid)}
            bgColor="bg-emerald-50/70 border border-emerald-200/80"
            textColor="text-emerald-900"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Qolgan qarz"
            value={formatCurrency(data.totalRemaining)}
            bgColor="bg-amber-50/70 border border-amber-200/80"
            textColor="text-amber-900"
          />
        </div>

        {/* Debts History */}
        <Card className="border-slate-200/80 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Qarzlar tarixi</CardTitle>
            <CardDescription className="text-xs">
              Ushbu qarzdor bo&apos;yicha kiritilgan barcha operatsiyalar ro&apos;yxati
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {data.debts.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">Qarzlar tarixi mavjud emas</p>
            ) : (
              data.debts.map((debt) => (
                <div
                  key={debt.id}
                  className="border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3 hover:bg-slate-50/80 transition-all shadow-2xs"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs sm:text-sm text-slate-600 font-medium">
                          {formatDate(debt.created_at)}
                        </span>
                      </div>
                      {debt.due_date && (
                        <div className="text-xs text-slate-500">
                          Muddat: <span className="font-semibold text-slate-700">{formatDate(debt.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`text-xs font-bold ${
                        debt.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {debt.status === 'paid' ? "To'langan" : 'Ochiq qarz'}
                    </Badge>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm pt-1">
                    <div>
                      <p className="text-slate-500 text-xs">Asl qarz</p>
                      <p className="font-bold text-slate-900">{formatCurrency(debt.amount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">To&apos;langan</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(debt.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Qoldiq</p>
                      <p className="font-bold text-amber-600">
                        {formatCurrency(debt.amount - debt.paid_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((debt.paid_amount / debt.amount) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Note */}
                  {debt.note && (
                    <div className="text-xs text-slate-600 bg-slate-100/80 rounded-lg p-2.5">
                      <span className="font-bold text-slate-700">Izoh:</span> {debt.note}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  bgColor,
  textColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bgColor: string
  textColor: string
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-4 sm:p-5 space-y-2 shadow-2xs`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold text-slate-600">{label}</p>
      </div>
      <p className={`text-lg sm:text-xl font-black ${textColor} truncate`}>
        {value}
      </p>
    </div>
  )
}

function DebtorSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
