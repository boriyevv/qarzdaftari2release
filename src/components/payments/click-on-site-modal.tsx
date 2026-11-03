// src/components/payments/click-on-site-modal.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  Lock,
} from 'lucide-react'
import { ClickLogo, UzcardLogo, HumoLogo, VisaLogo, MastercardLogo } from './payment-logos'
import { formatPrice } from '@/lib/constants/plans'

interface ClickOnSiteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  planType?: 'PLUS' | 'PRO' | string
  billingCycle?: 'monthly' | 'semi_annual' | 'annual' | string
  type?: 'subscription' | 'sms'
  credits?: number
  packageId?: string
  defaultPhone?: string | null
  initialTab?: 'card' | 'invoice'
  onSuccess?: () => void
  onBack?: () => void
}

export function ClickOnSiteModal({
  open,
  onOpenChange,
  amount,
  planType = 'PLUS',
  billingCycle = 'monthly',
  type = 'subscription',
  credits,
  defaultPhone,
  initialTab = 'card',
  onSuccess,
  onBack,
}: ClickOnSiteModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'invoice'>(initialTab)

  // Card flow states
  const [cardNumber, setCardNumber] = useState('')
  const [expireDate, setExpireDate] = useState('')
  const [cardStep, setCardStep] = useState<'details' | 'otp' | 'success'>('details')
  const [cardToken, setCardToken] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [cardPhone, setCardPhone] = useState('')
  const [cardTransactionId, setCardTransactionId] = useState('')
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState<number>(60)

  // Invoice flow states
  const [phoneNumber, setPhoneNumber] = useState('')
  const [invoiceStep, setInvoiceStep] = useState<'input' | 'waiting' | 'success'>('input')
  const [invoiceId, setInvoiceId] = useState<string | number | null>(null)
  const [invoiceTxId, setInvoiceTxId] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const expireInputRef = useRef<HTMLInputElement>(null)

  // Sync initial tab and default phone
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      if (defaultPhone) {
        const clean = defaultPhone.replace(/\D/g, '')
        const national = clean.startsWith('998') ? clean.slice(3) : clean
        setPhoneNumber(national)
      }
    }
  }, [open, initialTab, defaultPhone])

  // Reset states when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCardStep('details')
        setCardNumber('')
        setExpireDate('')
        setCardToken('')
        setSmsCode('')
        setCardError(null)

        setInvoiceStep('input')
        setInvoiceId(null)
        setInvoiceTxId(null)
        setInvoiceError(null)
      }, 300)
    }
  }, [open])

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cardStep === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [cardStep, resendTimer])

  // Poll status when invoice is waiting for approval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (invoiceStep === 'waiting' && (invoiceTxId || invoiceId)) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/payments/click/invoice/status?transactionId=${invoiceTxId || ''}&invoiceId=${invoiceId || ''}`
          )
          const data = await res.json()
          if (data.isCompleted) {
            setInvoiceStep('success')
            if (interval) clearInterval(interval)
            setTimeout(() => {
              onSuccess?.()
            }, 1500)
          }
        } catch (e) {
          console.error('Invoice polling error:', e)
        }
      }, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [invoiceStep, invoiceTxId, invoiceId, onSuccess])

  // Detect card brand
  const cleanDigits = cardNumber.replace(/\D/g, '')
  const isUzcard = cleanDigits.startsWith('8600') || cleanDigits.startsWith('5614')
  const isHumo = cleanDigits.startsWith('9860')
  const isVisa = cleanDigits.startsWith('4')
  const isMastercard = cleanDigits.startsWith('51') || cleanDigits.startsWith('52') || cleanDigits.startsWith('53') || cleanDigits.startsWith('54') || cleanDigits.startsWith('55')

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
    setCardError(null)

    // Auto-focus expiry input when 16 digits are entered
    if (raw.length === 16 && expireInputRef.current) {
      expireInputRef.current.focus()
    }
  }

  // Format expiry date MM/YY
  const handleExpireChange = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 2) {
      setExpireDate(`${raw.slice(0, 2)}/${raw.slice(2)}`)
    } else {
      setExpireDate(raw)
    }
    setCardError(null)
  }

  // Step 1: Submit card details to Click Merchant API /card/create
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError(null)

    const cleanCard = cardNumber.replace(/\D/g, '')
    const cleanExp = expireDate.replace(/\D/g, '')

    if (cleanCard.length < 16) {
      setCardError('Karta raqami 16 ta raqamdan iborat bo\'lishi kerak')
      return
    }

    if (cleanExp.length < 4) {
      setCardError('Amal qilish muddatini to\'liq kiriting (MM/YY)')
      return
    }

    const month = parseInt(cleanExp.slice(0, 2), 10)
    if (month < 1 || month > 12) {
      setCardError('Oy 01 va 12 oralig\'ida bo\'lishi kerak')
      return
    }

    setCardLoading(true)

    try {
      const res = await fetch('/api/payments/click/card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cleanCard,
          expireDate: cleanExp,
          planType,
          billingCycle,
          type,
          credits,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kartani ro\'yxatdan o\'tkazib bo\'lmadi')
      }

      setCardToken(data.cardToken)
      setCardPhone(data.phone || '')
      setCardTransactionId(data.transactionId)
      setResendTimer(60)
      setCardStep('otp')
    } catch (err: any) {
      setCardError(err.message || 'Xatolik yuz berdi')
    } finally {
      setCardLoading(false)
    }
  }

  // Step 2: Verify OTP and process payment via Click /card/verify-and-pay
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError(null)

    if (!smsCode || smsCode.length < 4) {
      setCardError('SMS tasdiqlash kodini to\'liq kiriting')
      return
    }

    setCardLoading(true)

    try {
      const res = await fetch('/api/payments/click/card/verify-and-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToken,
          smsCode,
          transactionId: cardTransactionId,
          amount,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'SMS kod noto\'g\'ri yoki to\'lov rad etildi')
      }

      setCardStep('success')
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      setCardError(err.message || 'To\'lov amalga oshmadi')
    } finally {
      setCardLoading(false)
    }
  }

  // Invoice Submit
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoiceError(null)

    const clean = phoneNumber.replace(/\D/g, '')
    if (clean.length < 9) {
      setInvoiceError('Telefon raqamini to\'liq kiriting (masalan: 90 123 45 67)')
      return
    }

    setInvoiceLoading(true)

    try {
      const res = await fetch('/api/payments/click/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: clean.startsWith('998') ? clean : `998${clean}`,
          amount,
          planType,
          billingCycle,
          type,
          credits,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Hisob-fakturani chiqarib bo\'lmadi')
      }

      setInvoiceId(data.invoiceId)
      setInvoiceTxId(data.transactionId)
      setInvoiceStep('waiting')
    } catch (err: any) {
      setInvoiceError(err.message || 'Xatolik yuz berdi')
    } finally {
      setInvoiceLoading(false)
    }
  }

  // Redirect fallback URL
  const handleRedirectCheckout = () => {
    const returnUrl = `${window.location.origin}/dashboard?payment=success`
    const txId = `${type}_${planType}_${Date.now()}`
    const url = `https://my.click.uz/services/pay?service_id=104455&merchant_id=61732&amount=${amount}&transaction_param=${txId}&return_url=${encodeURIComponent(returnUrl)}`
    window.location.href = url
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 border border-slate-200/80 shadow-2xl bg-white overflow-hidden [&>button.absolute]:w-8 [&>button.absolute]:h-8 [&>button.absolute]:rounded-full [&>button.absolute]:bg-slate-100 [&>button.absolute]:hover:bg-slate-200 [&>button.absolute]:text-slate-500 [&>button.absolute]:hover:text-slate-800 [&>button.absolute]:top-5 [&>button.absolute]:right-5 [&>button.absolute]:flex [&>button.absolute]:items-center [&>button.absolute]:justify-center [&>button.absolute]:transition-colors [&>button.absolute]:border [&>button.absolute]:border-slate-200/60">
        {/* MODAL HEADER */}
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center justify-between pr-10">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ClickLogo className="h-6 w-auto" />
              <span>Click to&apos;lov</span>
            </DialogTitle>
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 font-bold px-3 py-0.5 text-xs">
              {formatPrice(amount)}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {type === 'sms'
              ? `${credits} ta SMS paketi uchun to'lov`
              : `${planType} rejasi (${billingCycle === 'annual' ? 'Yillik' : billingCycle === 'semi_annual' ? '6 oylik' : 'Oylik'})`}
          </DialogDescription>
        </DialogHeader>

        {cardStep === 'success' || invoiceStep === 'success' ? (
          /* SUCCESS VIEW */
          <div className="py-8 text-center space-y-5">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute -inset-2 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                To&apos;lov muvaffaqiyatli amalga oshirildi!
              </h3>
              <p className="text-xs text-slate-500">
                Click orqali <span className="font-semibold text-slate-800">{formatPrice(amount)}</span> qabul qilindi. Xizmat faollashtirildi.
              </p>
            </div>

            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all"
              onClick={() => {
                onOpenChange(false)
                window.location.reload()
              }}
            >
              Dashboardga o&apos;tish
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full pt-1">
            <TabsList className="grid grid-cols-2 w-full rounded-2xl p-1 bg-slate-100/90 h-11">
              <TabsTrigger
                value="card"
                className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Bank kartasi
              </TabsTrigger>
              <TabsTrigger
                value="invoice"
                className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all"
              >
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                Click Up ilovasi
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BANK CARD (Virtual Card + Inputs) */}
            <TabsContent value="card" className="space-y-4 pt-3 focus-visible:outline-none">
              {cardStep === 'details' ? (
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  {/* REALISTIC VIRTUAL CARD PREVIEW */}
                  <div className="relative w-full h-44 rounded-2xl p-5 overflow-hidden text-white shadow-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 border border-white/10 flex flex-col justify-between">
                    {/* Background Glow */}
                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Row: Chip, Contactless & Brand */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        {/* Metallic EMV Chip SVG */}
                        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center p-1">
                          <div className="w-full h-full border border-amber-600/30 rounded-xs flex">
                            <div className="w-1/2 border-r border-amber-600/30" />
                          </div>
                        </div>
                        {/* Contactless waves icon */}
                        <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                          <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                          <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* Brand Logo Display */}
                      <div className="h-6 flex items-center">
                        {isUzcard && <UzcardLogo className="h-6 w-auto brightness-0 invert" />}
                        {isHumo && <HumoLogo className="h-6 w-auto brightness-0 invert" />}
                        {isVisa && <VisaLogo className="h-6 w-auto brightness-0 invert" />}
                        {isMastercard && <MastercardLogo className="h-6 w-auto" />}
                        {!isUzcard && !isHumo && !isVisa && !isMastercard && (
                          <span className="text-[11px] tracking-widest font-black text-slate-400">CLICK PAY</span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Card Number */}
                    <div className="relative z-10 my-auto">
                      <div className="font-mono text-lg sm:text-xl tracking-widest text-slate-100 font-bold drop-shadow-sm">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                    </div>

                    {/* Bottom Row: Holder & Expiry */}
                    <div className="flex items-end justify-between relative z-10 text-[10px] text-slate-400 uppercase tracking-wider">
                      <div>
                        <div className="text-[8px] text-slate-400 font-medium">Karta egasi</div>
                        <div className="font-semibold text-slate-200 text-xs">QARZ DAFTARI</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] text-slate-400 font-medium">Muddati</div>
                        <div className="font-mono font-bold text-slate-200 text-xs">
                          {expireDate || 'MM/YY'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FORM INPUTS */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="card_number" className="text-xs font-semibold text-slate-700">
                        Karta raqami (Uzcard, Humo, Visa, Mastercard)
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="card_number"
                          placeholder="8600 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className="pr-16 text-sm font-mono tracking-wider h-11 rounded-xl bg-slate-50/50 focus:bg-white"
                          maxLength={19}
                          autoFocus
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          {isUzcard && <UzcardLogo className="h-4 w-auto" />}
                          {isHumo && <HumoLogo className="h-4 w-auto" />}
                          {isVisa && <VisaLogo className="h-4 w-auto" />}
                          {isMastercard && <MastercardLogo className="h-4 w-auto" />}
                          {!isUzcard && !isHumo && !isVisa && !isMastercard && (
                            <CreditCard className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="expire_date" className="text-xs font-semibold text-slate-700">
                        Amal qilish muddati (OY / YIL)
                      </Label>
                      <Input
                        ref={expireInputRef}
                        id="expire_date"
                        placeholder="MM / YY"
                        value={expireDate}
                        onChange={(e) => handleExpireChange(e.target.value)}
                        className="mt-1 text-sm font-mono tracking-wider h-11 rounded-xl bg-slate-50/50 focus:bg-white"
                        maxLength={5}
                        required
                      />
                    </div>
                  </div>

                  {cardError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01]"
                    disabled={cardLoading}
                  >
                    {cardLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Tekshirilmoqda...
                      </span>
                    ) : (
                      `To'lash • ${formatPrice(amount)}`
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Click tizimi orqali 256-bit shifrlangan to&apos;lov</span>
                  </div>
                </form>
              ) : (
                /* STEP 2: SMS OTP VERIFICATION */
                <form onSubmit={handleVerifyOtp} className="space-y-5 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900">SMS kodni kiriting</h4>
                      <p className="text-xs text-slate-500">
                        Tasdiqlash kodi telefoningizga{' '}
                        {cardPhone ? <span className="font-bold text-slate-800">({cardPhone})</span> : ''} yuborildi.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Input
                      id="sms_code"
                      placeholder="12345"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl font-mono tracking-widest h-14 rounded-2xl border-2 border-blue-300 focus:border-blue-600 bg-blue-50/20"
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>

                  {cardError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all"
                      disabled={cardLoading}
                    >
                      {cardLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          To&apos;lov tasdiqlanmoqda...
                        </span>
                      ) : (
                        'To\'lovni tasdiqlash'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setCardStep('details')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kartani o&apos;zgartirish
                      </button>

                      {resendTimer > 0 ? (
                        <span className="text-slate-400">Qayta yuborish ({resendTimer}s)</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleCardSubmit(e as any)}
                          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          Kodni qayta olish
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </TabsContent>

            {/* TAB 2: CLICK UP INVOICE */}
            <TabsContent value="invoice" className="space-y-4 pt-3 focus-visible:outline-none">
              {invoiceStep === 'input' ? (
                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/70 space-y-1">
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      Click Up orqali bir bosishda to&apos;lov
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Telefon raqamingizni kiriting. Click Up ilovangizga to&apos;lov hisobi yuboriladi va push-xabarnoma orqali tasdiqlaysiz.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-700">
                      Click ga ulangan telefon raqami
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        +998
                      </span>
                      <Input
                        id="phone_number"
                        placeholder="90 123 45 67"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-14 text-sm font-mono h-11 rounded-xl bg-slate-50/50 focus:bg-white"
                        maxLength={12}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {invoiceError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                      <span>{invoiceError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01]"
                    disabled={invoiceLoading}
                  >
                    {invoiceLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Hisob chiqarilmoqda...
                      </span>
                    ) : (
                      `Hisob chiqarish • ${formatPrice(amount)}`
                    )}
                  </Button>
                </form>
              ) : (
                /* WAITING INVOICE APPROVAL VIEW */
                <div className="py-6 text-center space-y-5">
                  {/* Concentric Pulse Animation */}
                  <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Smartphone className="w-8 h-8 text-blue-700 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-xs mx-auto">
                    <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 font-bold px-2.5 py-0.5 text-[11px]">
                      Hisob yuborildi
                    </Badge>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Click Up ilovangizni oching
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-800">{formatPrice(amount)}</span> miqdoridagi to&apos;lovni Click Up ilovangizda tasdiqlang.
                    </p>
                  </div>

                  {/* Deep-link action button */}
                  <div className="space-y-2 pt-1">
                    <a
                      href="clickuz://"
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
                    >
                      Click Up ilovasini ochish
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-semibold pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Tasdiqlanishi kutilmoqda...</span>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-xs text-slate-500 hover:text-slate-800"
                      onClick={() => setInvoiceStep('input')}
                    >
                      Raqamni qayta kiritish
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Micro Footer: Fallback link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
            >
              ← Boshqa usul
            </button>
          ) : (
            <span>Yoki Click portalida to&apos;lash:</span>
          )}
          <button
            type="button"
            onClick={handleRedirectCheckout}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            Click Checkout ochish
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
