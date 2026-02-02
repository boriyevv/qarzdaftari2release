// src/app/debtor/[phone]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Phone, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react'

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

  if (loading) {
    return <DebtorSkeleton />
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Qarzdor topilmadi</p>
          <Button onClick={() => router.back()} className="mt-4">
            Orqaga
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' so\'m'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{data.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                {data.phone}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            label="Jami"
            value={formatCurrency(data.totalAmount)}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            label="To'landi"
            value={formatCurrency(data.totalPaid)}
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            label="Qoldiq"
            value={formatCurrency(data.totalRemaining)}
            bgColor="bg-orange-50"
          />
        </div>

        {/* Debts History */}
        <Card>
          <CardHeader>
            <CardTitle>Qarzlar tarixi</CardTitle>
            <CardDescription>
              {data.debtCount} ta qarz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.debts.map((debt) => (
              <div
                key={debt.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-slate-50 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {formatDate(debt.created_at)}
                      </span>
                    </div>
                    {debt.due_date && (
                      <div className="text-xs text-slate-500">
                        Muddat: {formatDate(debt.due_date)}
                      </div>
                    )}
                  </div>
                  <Badge variant={debt.status === 'paid' ? 'default' : 'secondary'}>
                    {debt.status === 'paid' ? 'To\'langan' : 'Ochiq'}
                  </Badge>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Qarz</p>
                    <p className="font-semibold">{formatCurrency(debt.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">To'landi</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(debt.paid_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Qoldiq</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(debt.amount - debt.paid_amount)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((debt.paid_amount / debt.amount) * 100, 100)}%`,
                    }}
                  />
                </div>

                {/* Note */}
                {debt.note && (
                  <div className="text-sm text-slate-600 bg-slate-100 rounded p-2">
                    <span className="font-medium">Izoh:</span> {debt.note}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Future: Rating & Trust Score */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Reyting (Tez kunda)</CardTitle>
            <CardDescription className="text-blue-700">
              Qarzdorning ishonchlilik darajasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600">
              Bu funksiya keyingi yangilanishda qo'shiladi
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-lg p-4 space-y-2`}>
      <div className="flex justify-center">{icon}</div>
      <div className="text-center">
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  )
}

function DebtorSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b p-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}