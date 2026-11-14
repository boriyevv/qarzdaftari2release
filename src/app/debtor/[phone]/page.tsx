// src/app/debtor/[phone]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Phone,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  CreditCard,
  Send,
  FileText,
  Share2,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Plus,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { formatCurrency, formatAmountInput, parseAmountInput, numberToUzbekWords } from '@/lib/utils/currency'
import { formatPhoneNumber } from '@/lib/utils/phone'
import { exportDebtorStatementPDF, generateDebtorTelegramText } from '@/lib/export/debtor-statement'
import { exportSingleDebtReceiptPDF } from '@/lib/export/debts-export'
import { playSuccessSound } from '@/lib/sounds'
import { toast } from 'sonner'
import { nativeHaptics } from '@/lib/native'
import Link from 'next/link'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-sky-500 to-blue-600',
  ]
  const charCode = name.charCodeAt(0) || 0
  return gradients[charCode % gradients.length]
}

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
  const { user } = useUser()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DebtorData | null>(null)

  // 1. To'lov Qabul Qilish Modali Holatlari
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [selectedDebtId, setSelectedDebtId] = useState<string>('auto')
  const [paymentNote, setPaymentNote] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // 2. SMS Eslatma Modali Holatlari
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsCredits, setSmsCredits] = useState<number>(0)
  const [isSendingSMS, setIsSendingSMS] = useState(false)
  const [smsStatus, setSmsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 3. Akt-Sverka Modali Holatlari
  const [statementModalOpen, setStatementModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // To'lov modalini ochish (Umumiy yoki muayyan qarz uchun)
  const handleOpenPayment = (debtId: string = 'auto', defaultAmount?: number) => {
    setSelectedDebtId(debtId)
    setPaymentAmount(defaultAmount ? formatAmountInput(defaultAmount) : '')
    setPaymentNote('')
    setPaymentError(null)
    setPaymentSuccess(false)
    setPaymentModalOpen(true)
  }

  // To'lovni serverga yuborish (FIFO yoki tanlangan qarz bo'yicha)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseAmountInput(paymentAmount)
    if (!numericAmount || numericAmount <= 0) {
      setPaymentError('Iltimos, to\'g\'ri to\'lov summasini kiriting')
      return
    }

    if (!data) return
    setIsSubmittingPayment(true)
    setPaymentError(null)

    try {
      if (selectedDebtId !== 'auto') {
        // Muayyan bitta qarz uchun to'lov
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            debt_id: selectedDebtId,
            amount: numericAmount,
            note: paymentNote || undefined,
          }),
        })

        const resData = await res.json()
        if (!res.ok) {
          throw new Error(resData.error || 'To\'lov kiritishda xatolik')
        }
      } else {
        // Avtomatik taqsimlash (FIFO: eng eski ochiq qarzlardan boshlab so'ndirish)
        const openDebts = data.debts
          .filter((d) => d.amount - d.paid_amount > 0)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (openDebts.length === 0) {
          throw new Error('Ushbu qarzdorda ochiq qarzlar mavjud emas')
        }

        let remainingToPay = numericAmount
        for (const debt of openDebts) {
          if (remainingToPay <= 0) break
          const debtRemaining = debt.amount - debt.paid_amount
          const payThis = Math.min(debtRemaining, remainingToPay)

          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              debt_id: debt.id,
              amount: payThis,
              note: paymentNote || undefined,
            }),
          })

          if (!res.ok) {
            const errJson = await res.json()
            throw new Error(errJson.error || 'Qarzni so\'ndirishda xato yuz berdi')
          }

          remainingToPay -= payThis
        }
      }

      playSuccessSound()
      setPaymentSuccess(true)
      await fetchDebtorData()
      setTimeout(() => {
        setPaymentModalOpen(false)
        setPaymentSuccess(false)
      }, 1500)
    } catch (err: any) {
      setPaymentError(err.message || 'To\'lovni amalga oshirishda xatolik yuz berdi')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // SMS Modalini ochish
  const handleOpenSMS = () => {
    if (!data) return
    const storeTitle = user?.store_name || "Qarz Daftari"
    const template = `Hurmatli ${data.name}, sizda ${formatCurrency(data.totalRemaining)} qarz mavjud. To'lashingizni so'raymiz. ${storeTitle}.`
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

  // SMS yuborish
  const handleSendSMS = async () => {
    if (!data || !smsMessage.trim() || smsCredits <= 0) return
    setIsSendingSMS(true)
    setSmsStatus(null)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_phone: data.phone,
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

  // Akt-Sverka PDF yuklab olish
  const handleDownloadStatementPDF = () => {
    if (!data) return
    exportDebtorStatementPDF({
      storeName: user?.store_name || 'Qarz Daftari',
      debtorName: data.name,
      debtorPhone: data.phone,
      totalAmount: data.totalAmount,
      totalPaid: data.totalPaid,
      totalRemaining: data.totalRemaining,
      debts: data.debts,
    })
  }

  // Akt-Sverka matnini nusxalash
  const handleCopyTelegramText = () => {
    if (!data) return
    const text = generateDebtorTelegramText({
      storeName: user?.store_name || 'Qarz Daftari',
      debtorName: data.name,
      debtorPhone: data.phone,
      totalAmount: data.totalAmount,
      totalPaid: data.totalPaid,
      totalRemaining: data.totalRemaining,
      debts: data.debts,
    })

    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2500)
  }

  // Telegram orqali xabar jo'natish
  const handleShareToTelegram = () => {
    if (!data) return
    const text = generateDebtorTelegramText({
      storeName: user?.store_name || 'Qarz Daftari',
      debtorName: data.name,
      debtorPhone: data.phone,
      totalAmount: data.totalAmount,
      totalPaid: data.totalPaid,
      totalRemaining: data.totalRemaining,
      debts: data.debts,
    })

    window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank')
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
          <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm w-full">
            <p className="text-slate-600 dark:text-slate-400 font-medium">Qarzdor ma&apos;lumotlari topilmadi</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4 rounded-xl">
              Dashboardga qaytish
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  // To'lov samaradorligi foizi
  const collectionRate = data.totalAmount > 0
    ? Math.round((data.totalPaid / data.totalAmount) * 100)
    : 0

  const hasOverdueDebt = data.debts.some((d) => {
    const rem = d.amount - d.paid_amount
    return rem > 0 && d.due_date && new Date(d.due_date) < new Date()
  })

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
        {/* 1. Qarzdor Asosiy Profili va 4 ta Tezkor Amal */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  data.name
                )} text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shadow-blue-500/15 flex-shrink-0`}
              >
                {getInitials(data.name)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {data.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      data.totalRemaining === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : hasOverdueDebt
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {data.totalRemaining === 0
                      ? "Barcha qarzlar to'langan"
                      : hasOverdueDebt
                      ? 'Kechikkan qarzlari bor'
                      : 'Qarzdorlik mavjud'}
                  </Badge>

                  {/* Trust Rating Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      collectionRate >= 75
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : collectionRate >= 40
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {collectionRate >= 75
                      ? '⭐️ Ajoyib intizom'
                      : collectionRate >= 40
                      ? '⚖️ O\'rtacha intizom'
                      : '⚠️ Nazorat talab'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                  {data.phone ? (
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <a href={`tel:${data.phone}`} className="hover:underline font-mono">
                        {formatPhoneNumber(data.phone)}
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Telefon raqam kiritilmagan</span>
                  )}
                  <span>•</span>
                  <span>{data.debtCount} ta umumiy yozuv</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {data.debts.filter((d) => d.amount - d.paid_amount > 0).length} ta ochiq qarz
                  </span>
                </div>
              </div>
            </div>

            {/* 🎯 4 TA ASOSIY TEZKOR AMALLAR PANELI */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. To'lov qabul qilish */}
              <Button
                onClick={() => handleOpenPayment('auto')}
                disabled={data.totalRemaining <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-10 px-4 text-xs sm:text-sm shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                To&apos;lov qabul qilish
              </Button>

              {/* 2. Telegram Eslatma (100% Bepul) */}
              <Button
                variant="outline"
                onClick={handleShareToTelegram}
                disabled={data.totalRemaining <= 0}
                className="border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-500 hover:text-white text-sky-700 dark:text-sky-300 font-bold rounded-2xl h-10 px-3.5 text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer active:scale-95"
                title="Telegram orqali eslatish (100% Bepul)"
              >
                <Send className="w-4 h-4 mr-1.5 text-sky-500" />
                Telegram (Bepul)
              </Button>

              {/* 3. SMS Eslatma */}
              <Button
                variant="outline"
                onClick={handleOpenSMS}
                disabled={data.totalRemaining <= 0}
                className="border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600 font-bold rounded-2xl h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4 mr-1.5 text-blue-600" />
                SMS Eslatma
              </Button>

              {/* 4. Qo'ng'iroq qilish */}
              {data.phone && (
                <a href={`tel:${data.phone}`}>
                  <Button
                    variant="outline"
                    className="border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 font-bold rounded-2xl h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Phone className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Qo&apos;ng&apos;iroq
                  </Button>
                </a>
              )}

              {/* 5. Akt-Sverka (Mijoz hisobot varaqasi) */}
              <Button
                variant="outline"
                onClick={() => setStatementModalOpen(true)}
                className="border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 font-bold rounded-2xl h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
                Akt-sverka
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Hashamatli Statistika Kartalari (Dashboard va Analitika uyg'unligida) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Jami Berilgan */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800 rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/15 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <TrendingUp className="absolute -bottom-4 -right-4 w-28 h-28 text-blue-600/10 dark:text-blue-400/5 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Jami Berilgan Nasiya
                </span>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-500/25">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                  {formatCurrency(data.totalAmount)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Barcha kiritilgan qarzlar</p>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800">
                    {data.debtCount} ta yozuv
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* To'langan Summa */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <CheckCircle className="absolute -bottom-4 -right-4 w-28 h-28 text-emerald-600/10 dark:text-emerald-400/5 -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  To&apos;langan Summa
                </span>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                  {formatCurrency(data.totalPaid)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Qaytarilgan to&apos;lovlar</p>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800">
                    {collectionRate}% yopildi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Qolgan Qarz */}
          <div
            className={`group relative overflow-hidden bg-gradient-to-br ${
              data.totalRemaining > 0
                ? 'from-amber-50/60 via-white to-amber-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800'
                : 'from-slate-50/60 via-white to-slate-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            } border rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg shadow-2xs`}
          >
            <div
              className={`absolute -bottom-8 -right-8 w-32 h-32 ${
                data.totalRemaining > 0 ? 'bg-amber-500/15 dark:bg-amber-500/10' : 'bg-slate-500/10 dark:bg-slate-500/5'
              } rounded-full blur-2xl pointer-events-none`}
            />
            <Clock
              className={`absolute -bottom-4 -right-4 w-28 h-28 ${
                data.totalRemaining > 0 ? 'text-amber-600/10 dark:text-amber-400/5' : 'text-slate-600/10 dark:text-slate-400/5'
              } -rotate-12 pointer-events-none transition-transform duration-500 ease-out group-hover:scale-110`}
            />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Qolgan Qarz
                </span>
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    data.totalRemaining > 0
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                      : 'bg-slate-700 text-white shadow-xs'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                  {formatCurrency(data.totalRemaining)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {data.totalRemaining > 0 ? 'Mijozdan kutilmoqda' : 'Hisob to\'liq toza'}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      data.totalRemaining > 0
                        ? hasOverdueDebt
                          ? 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800'
                          : 'bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800'
                        : 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800'
                    }`}
                  >
                    {data.totalRemaining > 0 ? (hasOverdueDebt ? 'Kechikkan' : 'Kutilmoqda') : 'To\'langan'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Qarzlar Tarixi — Interaktiv Vaqt Chizig'i (Fintech Timeline) */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Qarzlar tarixi va To&apos;lovlar
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Ushbu qarzdor bo&apos;yicha kiritilgan barcha operatsiyalar xronologiyasi
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {data.debts.length === 0 ? (
              <p className="text-center text-slate-500 py-10 text-sm">
                Qarzlar tarixi mavjud emas
              </p>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {data.debts.map((debt, index) => {
                  const remaining = Math.max(0, debt.amount - debt.paid_amount)
                  const isPaid = debt.status === 'paid' || (debt.amount > 0 && debt.paid_amount >= debt.amount)
                  const isOverdue = !isPaid && debt.due_date && new Date(debt.due_date) < new Date()
                  const percent = debt.amount > 0 ? Math.min(100, Math.round((debt.paid_amount / debt.amount) * 100)) : 0

                  return (
                    <div key={debt.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 ${
                          isPaid
                            ? 'bg-emerald-500'
                            : isOverdue
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-blue-600'
                        }`}
                      >
                        {isPaid ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : isOverdue ? (
                          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                      </div>

                      {/* Timeline Content Card */}
                      <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/80 transition-all shadow-2xs">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold">
                                {formatDate(debt.created_at)}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">#{index + 1}</span>
                            </div>
                            {debt.due_date && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                To&apos;lash muddati:{' '}
                                <span
                                  className={`font-semibold ${
                                    isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {formatDate(debt.due_date)} {isOverdue && '(Kechikkan!)'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                isPaid
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : isOverdue
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {isPaid ? "To'langan" : isOverdue ? "Muddati o'tgan" : 'Kutilmoqda'}
                            </Badge>

                            {/* PDF Kvitansiya tugmasi */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                exportSingleDebtReceiptPDF(
                                  {
                                    id: debt.id,
                                    debtor_name: data.name,
                                    debtor_phone: data.phone,
                                    amount: debt.amount,
                                    paid_amount: debt.paid_amount,
                                    status: debt.status,
                                    due_date: debt.due_date,
                                    debt_date: debt.created_at,
                                    note: debt.note,
                                  },
                                  user?.store_name || "Qarz Daftari"
                                )
                                toast.success("Chek tayyorlandi!")
                              }}
                              className="h-8 rounded-xl px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="PDF Chek / Kvitansiya"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Chek
                            </Button>

                            {/* Qarz kartasi ichidagi tezkor to'lov tugmasi */}
                            {remaining > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenPayment(debt.id, remaining)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-8 px-3 text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                To&apos;lash
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Amounts Grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm pt-1 bg-slate-50/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Jami qarz</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {formatCurrency(debt.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">To&apos;langan</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatCurrency(debt.paid_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Qoldiq</p>
                            <p
                              className={`font-bold font-mono ${
                                remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {formatCurrency(remaining)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>To&apos;lov darajasi</span>
                            <span className="font-bold">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isPaid ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Note */}
                        {debt.note && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 rounded-xl p-2.5">
                            <span className="font-bold text-slate-700 dark:text-slate-200">Izoh:</span> {debt.note}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* 💳 1. TO'LOV QABUL QILISH MODALI                               */}
      {/* ============================================================== */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              To&apos;lov qabul qilish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {data.name} mijozidan to&apos;lovni qayd etish
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
            {/* Umumiy Qoldiq Xabari */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Jami ochiq qoldiq:</span>
              <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                {formatCurrency(data.totalRemaining)}
              </span>
            </div>

            {/* Qaysi qarzga to'lanishi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">To&apos;lov yo&apos;nalishi:</label>
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="auto">⚡ Barcha ochiq qarzlarga ketma-ket (avtomatik)</option>
                {data.debts
                  .filter((d) => d.amount - d.paid_amount > 0)
                  .map((d, i) => (
                    <option key={d.id} value={d.id}>
                      {i + 1}-qarz ({formatDate(d.created_at)}) - Qoldiq: {formatCurrency(d.amount - d.paid_amount)}
                    </option>
                  ))}
              </select>
            </div>

            {/* To'lov Summasi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">To&apos;lov summasi (so&apos;m):</label>
                {parseAmountInput(paymentAmount) > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(parseAmountInput(paymentAmount))}
                  </span>
                )}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="100 000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(formatAmountInput(e.target.value))}
                className="h-11 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base font-bold focus:border-emerald-500 tracking-wide"
                required
              />
              {parseAmountInput(paymentAmount) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in duration-200">
                  <span className="text-blue-500 shrink-0">💎</span>
                  <span className="truncate">{numberToUzbekWords(parseAmountInput(paymentAmount))}</span>
                </div>
              )}

              {/* Tezkor Summa Qo'shish Chiplari */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Tezkor qo&apos;shish:</span>
                  {parseAmountInput(paymentAmount) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount('')}
                      className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Tozalash
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const current = parseAmountInput(paymentAmount)
                        setPaymentAmount(formatAmountInput(current + amt))
                      }}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer active:scale-95"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000} mln` : `${amt / 1000}k`}
                    </button>
                  ))}
                  {data.totalRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(formatAmountInput(data.totalRemaining))}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors ml-auto cursor-pointer active:scale-95"
                    >
                      To&apos;liq yopish
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Izoh */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Izoh (ixtiyoriy):</label>
              <Input
                type="text"
                placeholder="To'lov bo'yicha eslatma..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="h-9 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>

            {/* Xatolik yoki Muvaffaqiyat xabari */}
            {paymentError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>To&apos;lov muvaffaqiyatli qabul qilindi!</span>
              </div>
            )}

            <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs h-9 px-4 cursor-pointer transition-colors"
                disabled={isSubmittingPayment}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-9 px-5 text-white shadow-xs cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                {isSubmittingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    To&apos;lovni qayd etish
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* 💬 2. SMS ESLATMA MODALI                                       */}
      {/* ============================================================== */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              SMS Eslatma yuborish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {data.name} ({data.phone}) mijoziga to&apos;lov eslatmasi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* SMS Balans */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                SMS balansingiz:
              </span>
              <Badge
                variant={smsCredits > 0 ? 'secondary' : 'destructive'}
                className="font-bold text-xs rounded-lg"
              >
                {smsCredits} ta kredit
              </Badge>
            </div>

            {smsCredits === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span>SMS kreditingiz tugagan.</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSmsModalOpen(false)
                      handleShareToTelegram()
                    }}
                    className="h-7 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Telegramda bepul yuborish &rarr;
                  </Button>
                  <Link
                    href="/sms-credits"
                    target="_blank"
                    className="font-bold text-amber-900 dark:text-amber-400 underline text-xs"
                  >
                    Sotib olish
                  </Link>
                </div>
              </div>
            )}

            {/* Xabar Matni */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Xabar matni:</label>
                <span>{smsMessage.length} belgi</span>
              </div>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={4}
                className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-blue-500 resize-none p-3"
                placeholder="Xabar matnini kiriting..."
              />
            </div>

            {/* Status Feedback */}
            {smsStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  smsStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {smsStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                )}
                <span>{smsStatus.message}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSmsModalOpen(false)}
              className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold text-xs h-9 px-4"
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

      {/* ============================================================== */}
      {/* 📄 3. AKT-SVERKA (MIJOZ HISOBOT VARAQASI) MODALI                 */}
      {/* ============================================================== */}
      <Dialog open={statementModalOpen} onOpenChange={setStatementModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Akt-sverka (Hisobot varaqasi)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {data.name} mijozining barcha qarz va to&apos;lovlari hisoboti
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tezkor Ko'rsatkichlar */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px]">Jami nasiya</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{formatCurrency(data.totalAmount)}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px]">To&apos;langan</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(data.totalPaid)}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px]">Qoldiq qarz</p>
                <p className="font-black text-rose-600 dark:text-rose-400 truncate">{formatCurrency(data.totalRemaining)}</p>
              </div>
            </div>

            {/* Telegram / Xabar uchun tayyor matn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mijozga jo&apos;natish uchun xabar:</label>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                {generateDebtorTelegramText({
                  storeName: user?.store_name || 'Qarz Daftari',
                  debtorName: data.name,
                  debtorPhone: data.phone,
                  totalAmount: data.totalAmount,
                  totalPaid: data.totalPaid,
                  totalRemaining: data.totalRemaining,
                  debts: data.debts,
                })}
              </div>
            </div>

            {/* Amallar: Telegramga jo'natish va Nusxa olish */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyTelegramText}
                className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold h-9"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Nusxa olindi!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Matnni nusxalash
                  </>
                )}
              </Button>

              <Button
                onClick={handleShareToTelegram}
                className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs h-9 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Telegramga jo&apos;natish
              </Button>
            </div>

            {/* PDF Akt-Sverka Hujjati */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleDownloadStatementPDF}
                variant="outline"
                className="w-full rounded-2xl border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs h-10 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Rasmiy PDF Akt-sverka yuklab olish (A4)</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button
              variant="ghost"
              onClick={() => setStatementModalOpen(false)}
              className="rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800 w-full"
            >
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function DebtorSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  )
}
