// src/components/payments/payme-on-site-modal.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  Lock,
} from 'lucide-react'
import { PaymeLogo, UzcardLogo, HumoLogo, VisaLogo, MastercardLogo } from './payment-logos'
import { formatPrice } from '@/lib/constants/plans'

interface PaymeOnSiteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  planType?: 'PLUS' | 'PRO' | string
  billingCycle?: 'monthly' | 'semi_annual' | 'annual' | string
  type?: 'subscription' | 'sms'
  credits?: number
  packageId?: string
  defaultPhone?: string | null
  onSuccess?: () => void
  onBack?: () => void
}

export function PaymeOnSiteModal({
  open,
  onOpenChange,
  amount,
  planType = 'PLUS',
  billingCycle = 'monthly',
  type = 'subscription',
  credits,
  onSuccess,
  onBack,
}: PaymeOnSiteModalProps) {
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
  const [redirectLoading, setRedirectLoading] = useState(false)

  const expireInputRef = useRef<HTMLInputElement>(null)

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

  // Detect card brand
  const cleanDigits = cardNumber.replace(/\D/g, '')
  const isUzcard = cleanDigits.startsWith('8600') || cleanDigits.startsWith('5614')
  const isHumo = cleanDigits.startsWith('9860')
  const isVisa = cleanDigits.startsWith('4')
  const isMastercard =
    cleanDigits.startsWith('51') ||
    cleanDigits.startsWith('52') ||
    cleanDigits.startsWith('53') ||
    cleanDigits.startsWith('54') ||
    cleanDigits.startsWith('55')

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
    setCardError(null)

    if (raw.length === 16 && expireInputRef.current) {
      expireInputRef.current.focus()
    }
  }

  // Format expiry MM/YY
  const handleExpireChange = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 4)
    if (raw.length <= 2) {
      setExpireDate(raw)
    } else {
      setExpireDate(`${raw.slice(0, 2)}/${raw.slice(2)}`)
    }
    setCardError(null)
  }

  // 1. Submit card details -> get OTP
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError(null)

    const rawCard = cardNumber.replace(/\D/g, '')
    const rawExpire = expireDate.replace(/\D/g, '')

    if (rawCard.length !== 16) {
      setCardError('16 xonali to\'liq karta raqamini kiriting')
      return
    }

    if (rawExpire.length !== 4) {
      setCardError('Karta amal qilish muddatini to\'liq kiriting (MM/YY)')
      return
    }

    const month = parseInt(rawExpire.slice(0, 2), 10)
    if (month < 1 || month > 12) {
      setCardError('Noto\'g\'ri oy (01 dan 12 gacha)')
      return
    }

    setCardLoading(true)

    try {
      const res = await fetch('/api/payments/payme/card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: rawCard,
          expireDate: rawExpire,
          planType,
          billingCycle,
          type,
          credits,
          amount,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setCardError(data.error || 'Kartani ro\'yxatdan o\'tkazib bo\'lmadi')
        return
      }

      setCardToken(data.cardToken)
      setCardPhone(data.phone || '')
      setCardTransactionId(data.transactionId)
      setResendTimer(60)
      setCardStep('otp')
    } catch (err: any) {
      setCardError(err.message || 'Server bilan bog\'lanishda xato')
    } finally {
      setCardLoading(false)
    }
  }

  // 2. Submit SMS OTP -> verify & pay
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError(null)

    const cleanSms = smsCode.replace(/\D/g, '')
    if (cleanSms.length < 4) {
      setCardError('SMS kodni to\'liq kiriting')
      return
    }

    setCardLoading(true)

    try {
      const res = await fetch('/api/payments/payme/card/verify-and-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToken,
          smsCode: cleanSms,
          transactionId: cardTransactionId,
          amount,
          planType,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setCardError(data.error || 'SMS tasdiqlash kodi noto\'g\'ri')
        return
      }

      setCardStep('success')
      onSuccess?.()
    } catch (err: any) {
      setCardError(err.message || 'To\'lov jarayonida xatolik yuz berdi')
    } finally {
      setCardLoading(false)
    }
  }

  // 3. Fallback: Payme Checkout redirect
  const handlePaymeRedirect = async () => {
    setRedirectLoading(true)
    try {
      const endpoint = type === 'sms' ? '/api/sms/buy' : '/api/payments/create'
      const body =
        type === 'sms'
          ? { credits, amount, provider: 'payme' }
          : { planType, billingCycle, provider: 'payme' }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setCardError(data.error || 'Payme sahifasini ochishda xatolik')
      }
    } catch (e: any) {
      setCardError('Payme xizmatiga ulanishda xato')
    } finally {
      setRedirectLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl p-0 border border-slate-200/90 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden [&>button.absolute]:w-8 [&>button.absolute]:h-8 [&>button.absolute]:rounded-full [&>button.absolute]:bg-slate-100 dark:[&>button.absolute]:bg-slate-800 [&>button.absolute]:hover:bg-slate-200 dark:[&>button.absolute]:hover:bg-slate-700 [&>button.absolute]:text-slate-500 dark:[&>button.absolute]:text-slate-400 [&>button.absolute]:top-4 [&>button.absolute]:right-4 [&>button.absolute]:flex [&>button.absolute]:items-center [&>button.absolute]:justify-center [&>button.absolute]:border [&>button.absolute]:border-slate-200/80 dark:[&>button.absolute]:border-slate-700">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-teal-50/70 via-slate-50/40 to-white dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-900/60 p-1.5 flex items-center justify-center">
                <PaymeLogo className="h-5 w-auto" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Payme orqali to&apos;lov
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {type === 'sms'
                    ? `${credits?.toLocaleString()} ta SMS paketi`
                    : `${planType} (${billingCycle === 'annual' ? 'Yillik' : billingCycle === 'semi_annual' ? '6 oylik' : 'Oylik'}) tarifi`}
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-teal-600/10 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 font-extrabold text-xs px-2.5 py-1">
              {formatPrice(amount)}
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4 space-y-4">
          {cardStep === 'success' ? (
            <div className="text-center py-6 space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute -inset-2 bg-teal-400/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-tr from-teal-600 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  To&apos;lov muvaffaqiyatli amalga oshirildi!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payme orqali{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatPrice(amount)}
                  </span>{' '}
                  qabul qilindi. Xizmat faollashtirildi.
                </p>
              </div>

              <Button
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/25 transition-all"
                onClick={() => {
                  onOpenChange(false)
                  window.location.reload()
                }}
              >
                Dashboardga o&apos;tish
              </Button>
            </div>
          ) : cardStep === 'details' ? (
            <form onSubmit={handleCardSubmit} className="space-y-4">
              {/* REALISTIC VIRTUAL CARD PREVIEW */}
              <div className="relative w-full h-44 rounded-2xl p-5 overflow-hidden text-white shadow-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950 border border-white/10 flex flex-col justify-between">
                {/* Background Glow */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-600/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Chip & Brand */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Metallic EMV Chip SVG */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center p-1">
                      <div className="w-full h-full border border-amber-600/30 rounded-xs flex">
                        <div className="w-1/2 border-r border-amber-600/30" />
                      </div>
                    </div>
                    {/* Contactless waves icon */}
                    <svg
                      className="w-5 h-5 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                      <span className="text-[11px] tracking-widest font-black text-slate-400">
                        PAYME
                      </span>
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

              {/* Error Alert */}
              {cardError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="payme-card-number" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Karta raqami
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="payme-card-number"
                      type="text"
                      inputMode="numeric"
                      placeholder="8600 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="h-11 rounded-xl text-sm font-mono tracking-wider pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      maxLength={19}
                      autoFocus
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payme-expire-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amal qilish muddati
                  </Label>
                  <Input
                    ref={expireInputRef}
                    id="payme-expire-date"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={expireDate}
                    onChange={(e) => handleExpireChange(e.target.value)}
                    className="h-11 rounded-xl text-sm font-mono text-center tracking-widest mt-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    maxLength={5}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={cardLoading}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {cardLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SMS kod yuborilmoqda...
                  </>
                ) : (
                  `SMS kod olish (${formatPrice(amount)})`
                )}
              </Button>

              {/* Alternative: Payme App Redirect */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handlePaymeRedirect}
                  disabled={redirectLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors cursor-pointer"
                >
                  {redirectLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Payme ilovasi yoki veb-saytida to&apos;lash</span>
                </button>
              </div>
            </form>
          ) : (
            /* OTP STEP */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>SMS tasdiqlash kodi yuborildi</span>
                </div>
                <p className="text-[11px] text-teal-700/90 dark:text-teal-400/90">
                  Kartaga ulangan telefon raqamiga yuborilgan 6 xonali tasdiqlash kodini kiriting
                  {cardPhone ? ` (${cardPhone})` : ''}.
                </p>
              </div>

              {cardError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              <div>
                <Label htmlFor="payme-sms-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SMS kod
                </Label>
                <Input
                  id="payme-sms-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="••••••"
                  value={smsCode}
                  onChange={(e) => {
                    setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setCardError(null)
                  }}
                  className="h-12 rounded-xl text-center text-lg font-mono tracking-widest mt-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer transition-colors"
                  onClick={() => setCardStep('details')}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Karta raqamini o&apos;zgartirish
                </button>

                {resendTimer > 0 ? (
                  <span>Qayta yuborish: {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className="text-teal-700 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    onClick={handleCardSubmit}
                  >
                    <RotateCw className="w-3 h-3" />
                    Kodni qayta yuborish
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={cardLoading || smsCode.length < 4}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {cardLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    To&apos;lov tasdiqlanmoqda...
                  </>
                ) : (
                  `To'lovni tasdiqlash (${formatPrice(amount)})`
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Payme 3D-Secure</span>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-bold hover:underline cursor-pointer"
            >
              ← Boshqa to&apos;lov usuli
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
