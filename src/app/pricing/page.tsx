// src/app/pricing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Check,
  X,
  ArrowRight,
  Zap,
  Crown,
  Sparkles,
  Shield,
  Star,
  Rocket,
  Gift,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import {
  PLANS,
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_MONTHS,
  BILLING_CYCLE_DISCOUNTS,
  formatPrice,
  formatPricePerMonth,
  getDiscount,
  getPlanPrice,
  type BillingCycle
} from '@/lib/constants/plans'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { ClickOnSiteModal } from '@/components/payments/click-on-site-modal'
import { PaymeOnSiteModal } from '@/components/payments/payme-on-site-modal'
import { UzumPaymentModal } from '@/components/payments/uzum-payment-modal'
import { IosPaymentDialog } from '@/components/payments/ios-payment-dialog'
import { getPlatform } from '@/lib/native'
import {
  PaymentMethodsRow,
  UzumBankLogo,
  PaymeLogo,
  ClickLogo,
} from '@/components/payments/payment-logos'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CYCLE_OPTIONS: { value: BillingCycle; label: string; discount?: number }[] = [
  { value: 'monthly', label: 'Oylik' },
  { value: 'semi_annual', label: '6 oylik', discount: 5 },
  { value: 'annual', label: 'Yillik', discount: 10 },
]

const FAQS = [
  {
    q: "Tarifni keyinchalik o'zgartirish yoki oshirish mumkinmi?",
    a: "Ha, albatta. Istalgan vaqtda Plus tarifidan Pro tarifiga yangilashingiz mumkin. Amal qilish muddati va to'lovingiz avtomatik hisoblab chiqiladi.",
  },
  {
    q: "Qanday to'lov usullari qo'llab-quvvatlanadi?",
    a: "Uzum Bank, Click va Payme orqali to'lov qabul qilinadi. Barcha Uzcard, Humo, Visa va Mastercard kartalari ishlaydi. To'lovlar 100% xavfsiz shlyuzlar orqali o'tadi.",
  },
  {
    q: "SMS xabarnomalar qanday ishlaydi?",
    a: "SMS xabarlar mijozning telefoniga to'g'ridan-to'g'ri eslatma yuborish uchun xizmat qiladi va hisobingizdagi SMS kreditlar orqali sarflanadi.",
  },
  {
    q: "To'lov xavfsizligi kafolatlanganmi?",
    a: "Ha. Saytda karta ma'lumotlari saqlanmaydi. Barcha to'lovlar O'zbekiston Respublikasi Markaziy Banki litsenziyasiga ega rasmiy to'lov tizimlari (Uzum Bank, Click, Payme) orqali 3D-Secure himoyasi bilan amalga oshiriladi.",
  },
]

export default function PricingPage() {
  const { user, loading: userLoading, refreshUser } = useUser()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [showClickOnSiteModal, setShowClickOnSiteModal] = useState(false)
  const [showPaymeModal, setShowPaymeModal] = useState(false)
  const [clickInitialTab, setClickInitialTab] = useState<'card' | 'invoice'>('card')
  const [showUzumModal, setShowUzumModal] = useState(false)
  const [uzumPaymentUrl, setUzumPaymentUrl] = useState<string | null>(null)
  const [showIosModal, setShowIosModal] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Ensure latest user subscription status is refreshed
  useEffect(() => {
    refreshUser?.()
  }, [])

  // Redirect unauthenticated visitors to landing page pricing section
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = '/#pricing'
    }
  }, [user, userLoading])

  const handleSelectPlan = async (planType: string) => {
    if (planType === 'FREE') return
    setSelectedPlan(planType)

    // For Apple iOS App Store compliance (Guideline 3.1.1):
    // Digital subscriptions are managed via web portal for multiplatform SaaS
    if (getPlatform() === 'ios') {
      setShowIosModal(true)
      return
    }

    setShowProviderModal(true)
  }

  const handleProviderSelect = async (provider: string) => {
    if (!selectedPlan) return

    // Open on-site Click payment modal directly in the website
    if (provider === 'click' || provider === 'click_card') {
      setClickInitialTab(provider === 'click_card' ? 'card' : 'invoice')
      setShowProviderModal(false)
      setShowClickOnSiteModal(true)
      return
    }

    // Open on-site Payme payment modal directly in the website
    if (provider === 'payme') {
      setShowProviderModal(false)
      setShowPaymeModal(true)
      return
    }

    setLoading(provider)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          provider,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (data.paymentUrl) {
        if (provider === 'uzum') {
          setUzumPaymentUrl(data.paymentUrl)
          setShowProviderModal(false)
          setShowUzumModal(true)
          return
        }
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.error || 'Xato yuz berdi')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Xato yuz berdi')
    } finally {
      setLoading(null)
      setShowProviderModal(false)
    }
  }

  const userPlan = (user?.plan_type || 'FREE').toUpperCase()

  // Selected plan details for modal
  const selectedPlanObj = selectedPlan ? PLANS[selectedPlan as keyof typeof PLANS] : null
  const selectedPlanPrice = selectedPlan ? getPlanPrice(selectedPlan as any, billingCycle) : 0

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell
      title="Tariflar"
      subtitle="Biznesingiz uchun to'g'ri tarifni tanlang"
      showAddDebtButton={false}
    >
      <div className="w-full">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center space-y-3.5 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Tariflar va Rejalar
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Biznesingiz uchun to&apos;g&apos;ri tarifni tanlang
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Shaffof narxlar, yashirin to&apos;lovlarsiz. Uzum Bank, Click va Payme orqali 100% xavfsiz to&apos;lang.
            </p>

            {/* Billing Cycle Pill Toggle */}
            <div className="pt-3 flex justify-center">
              <div className="inline-flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
                {CYCLE_OPTIONS.map((opt) => {
                  const isActive = billingCycle === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBillingCycle(opt.value)}
                      className={`relative px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md border border-slate-200/60 dark:border-slate-800'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.discount && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tracking-tight ${
                            isActive
                              ? opt.value === 'annual'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-blue-600 text-white shadow-xs'
                              : opt.value === 'annual'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          -{opt.discount}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Active Subscription Banner for Logged-In User */}
          {user && user.plan_type && user.plan_type !== 'FREE' && (
            <div className="max-w-4xl mx-auto mb-10 relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-green-950/30 border border-emerald-300/90 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                        Sizda {user.plan_type} tarifi faol
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Faol Obuna
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-300/90 mt-0.5">
                      Barcha {user.plan_type} imkoniyatlaridan to&apos;liq foydalanishingiz mumkin.
                    </p>
                  </div>
                </div>

                {user.plan_type === 'PLUS' && (
                  <button
                    onClick={() => handleSelectPlan('PRO')}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Pro ga oshirish
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {Object.values(PLANS).map((plan) => {
              const price = plan.prices[billingCycle]
              const discount = getDiscount(plan.name as any, billingCycle)
              const months = BILLING_CYCLE_MONTHS[billingCycle]
              const monthlyPrice = plan.prices.monthly

              const isCurrentPlan = !!user && userPlan === plan.name
              const isDowngrade =
                !!user &&
                ((userPlan === 'PRO' && (plan.name === 'PLUS' || plan.name === 'FREE')) ||
                 (userPlan === 'PLUS' && plan.name === 'FREE'))
              const isUpgrade = !!user && userPlan === 'PLUS' && plan.name === 'PRO'
              const isFree = plan.name === 'FREE'
              const isPro = plan.name === 'PRO'

              // Card styling states
              let cardBorderClass = 'border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
              let cardHeaderBg = 'bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800'
              let iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'

              if (isCurrentPlan) {
                cardBorderClass = 'border-2 border-emerald-500 dark:border-emerald-500 shadow-xl ring-4 ring-emerald-500/10 dark:ring-emerald-500/20 bg-white dark:bg-slate-900'
                cardHeaderBg = 'bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900/60'
                iconBg = 'bg-emerald-600 text-white shadow-xs'
              } else if (isPro) {
                cardBorderClass = isUpgrade
                  ? 'border-2 border-purple-500 dark:border-purple-500 shadow-xl ring-4 ring-purple-500/10 dark:ring-purple-500/20 bg-white dark:bg-slate-900 hover:border-purple-600 dark:hover:border-purple-400'
                  : 'border border-purple-200 dark:border-purple-900/60 shadow-md bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl'
                cardHeaderBg = 'bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-white dark:from-purple-950/40 dark:via-violet-950/30 dark:to-slate-900 border-b border-purple-100 dark:border-purple-900/60'
                iconBg = 'bg-purple-600 text-white shadow-xs'
              } else if (plan.popular) {
                cardBorderClass = 'border-2 border-blue-500 dark:border-blue-500 shadow-xl ring-4 ring-blue-500/10 dark:ring-blue-500/20 bg-white dark:bg-slate-900 hover:border-blue-600 dark:hover:border-blue-400'
                cardHeaderBg = 'bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-white dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-b border-blue-100 dark:border-blue-900/60'
                iconBg = 'bg-blue-600 text-white shadow-xs'
              }

              // CTA Button Configuration
              let buttonText = 'Sotib olish'
              let buttonDisabled = false
              let buttonClass = 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md'

              if (!user) {
                buttonText = isFree ? 'Bepul boshlash' : "Tanlash va Ro'yxatdan o'tish"
                buttonDisabled = false
                buttonClass = isFree
                  ? 'bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
              } else if (isCurrentPlan) {
                buttonText = 'Hozirgi tarifingiz'
                buttonDisabled = true
                buttonClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-300/80 dark:border-emerald-800 cursor-default font-bold'
              } else if (isDowngrade) {
                buttonText = 'Amaldagi tarifdan past'
                buttonDisabled = true
                buttonClass = 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
              } else if (isUpgrade) {
                buttonText = 'Tarifni oshirish (Upgrade)'
                buttonDisabled = false
                buttonClass = 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 font-bold cursor-pointer'
              } else if (plan.popular) {
                buttonClass = 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 font-bold cursor-pointer'
              }

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border flex flex-col justify-between transition-all duration-300 ${cardBorderClass}`}
                >
                  {/* Top Floating Badge */}
                  {isCurrentPlan ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md shadow-emerald-600/30">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Hozirgi tarifingiz
                      </span>
                    </div>
                  ) : isUpgrade ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md shadow-purple-600/30 animate-pulse">
                        <Rocket className="w-3.5 h-3.5" />
                        Tavsiya etilgan upgrade
                      </span>
                    </div>
                  ) : plan.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md shadow-blue-600/30">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Eng ommabop
                      </span>
                    </div>
                  ) : isPro ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        <Crown className="w-3.5 h-3.5" />
                        Professional
                      </span>
                    </div>
                  ) : null}

                  {/* Card Header */}
                  <div>
                    <div className={`p-6 sm:p-7 rounded-t-3xl ${cardHeaderBg}`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {plan.displayName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                            {plan.description}
                          </p>
                        </div>
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                          {isPro ? (
                            <Crown className="w-5 h-5" />
                          ) : plan.popular ? (
                            <Zap className="w-5 h-5" />
                          ) : (
                            <Gift className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          )}
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="pt-2">
                        {isFree ? (
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">0</span>
                              <span className="text-base font-bold text-slate-500 dark:text-slate-400">so&apos;m</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              30 kun to&apos;liq funksiyalardan bepul sinov
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight" suppressHydrationWarning>
                                {billingCycle === 'monthly'
                                  ? formatPrice(price)
                                  : formatPrice(Math.round(price / months))}
                              </span>
                              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/oy</span>
                            </div>

                            {/* Multi-month billing details */}
                            {months > 1 && (
                              <div className="flex items-center gap-2 flex-wrap pt-0.5" suppressHydrationWarning>
                                <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                  {formatPrice(monthlyPrice * months)}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                                  {formatPrice(price)} / {BILLING_CYCLE_LABELS[billingCycle].toLowerCase()}
                                </span>
                              </div>
                            )}

                            {/* Savings Badge */}
                            {discount.amount > 0 && (
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1 bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800" suppressHydrationWarning>
                                  <Zap className="w-3 h-3 text-emerald-600 fill-current" />
                                  {formatPrice(discount.amount)} tejaladi
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="p-6 sm:p-7 space-y-3.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Imkoniyatlar
                      </p>

                      <FeatureItem
                        text={`${plan.features.max_debts === -1 ? 'Cheksiz' : plan.features.max_debts} ta qarz yozish`}
                        highlight={plan.features.max_debts === -1}
                      />
                      <FeatureItem
                        text={`${plan.features.max_folders === -1 ? 'Cheksiz' : plan.features.max_folders} ta papka (folder)`}
                        highlight={plan.features.max_folders === -1}
                      />
                      <FeatureItem
                        text="SMS eslatmalar"
                        enabled={true}
                        subtext="Kreditlar orqali"
                        isSmsNotice
                      />
                      <FeatureItem
                        text={`Analitika (${plan.features.analytics_period === 'monthly' ? '1 oylik' : plan.features.analytics_period === 'annual' ? '1 yillik chuqur' : '-'})`}
                        enabled={plan.features.analytics}
                        highlight={plan.features.analytics_period === 'annual'}
                      />
                      <FeatureItem
                        text="Excel va PDF eksport"
                        enabled={plan.features.export}
                      />
                      {plan.features.api_access && (
                        <FeatureItem text="API orqali integratsiya" highlight />
                      )}
                      {plan.features.priority_support && (
                        <FeatureItem text="Ustuvor (Priority) texnik yordam" highlight />
                      )}
                    </div>
                  </div>

                  {/* Card Footer CTA */}
                  <div className="p-6 sm:p-7 pt-2">
                    <button
                      type="button"
                      disabled={buttonDisabled}
                      onClick={() => handleSelectPlan(plan.name)}
                      className={`w-full h-12 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${buttonClass}`}
                    >
                      {isUpgrade && <Rocket className="w-4 h-4" />}
                      {isCurrentPlan && <Check className="w-4 h-4 stroke-[3]" />}
                      <span>{buttonText}</span>
                      {!buttonDisabled && !isUpgrade && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Savings Highlight Callout */}
          {billingCycle !== 'monthly' && (
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-2.5 shadow-xs">
                <Zap className="w-4 h-4 text-emerald-600 fill-current" />
                <span className="text-emerald-950 dark:text-emerald-200 font-bold text-xs sm:text-sm">
                  {billingCycle === 'semi_annual' ? '6 oylik' : 'Yillik'} to&apos;lovda {BILLING_CYCLE_DISCOUNTS[billingCycle]}% chegirmadan foydalanmoqdasiz!
                </span>
              </div>
            </div>
          )}

          {/* Supported Payments & Security Compliance Banner */}
          <div className="mt-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 mx-auto">
              <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                Rasmiy to&apos;lov tizimlari va bank kartalari
              </p>
            </div>

            <PaymentMethodsRow />

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href="/payment-terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
                To&apos;lov usullari va mablag&apos;larni qaytarish qoidalari
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link href="/security" className="hover:text-blue-600 dark:hover:text-blue-400 transition underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
                Xavfsizlik va Antifraud nazorati
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
                Ommaviy oferta
              </Link>
            </div>
          </div>

          {/* Interactive FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto space-y-4">
            <div className="text-center space-y-1.5 mb-8">
              <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                Ko&apos;p beriladigan savollar
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Savollaringiz bormi?
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-6">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Qo&apos;shimcha savollaringiz bormi?{' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Qo&apos;llab-quvvatlash xizmati bilan bog&apos;laning
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Provider Selection Modal - The Big Three */}
      <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden [&>button.absolute]:w-8 [&>button.absolute]:h-8 [&>button.absolute]:rounded-full [&>button.absolute]:bg-slate-100 dark:[&>button.absolute]:bg-slate-800 [&>button.absolute]:hover:bg-slate-200 dark:[&>button.absolute]:hover:bg-slate-700 [&>button.absolute]:text-slate-500 dark:[&>button.absolute]:text-slate-300 [&>button.absolute]:top-4 [&>button.absolute]:right-4 [&>button.absolute]:flex [&>button.absolute]:items-center [&>button.absolute]:justify-center [&>button.absolute]:border [&>button.absolute]:border-slate-200/80 dark:[&>button.absolute]:border-slate-700">
          {/* Modal Header */}
          <div className="p-6 pb-4 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-850/80 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                To&apos;lov usulini tanlang
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Qaysi to&apos;lov tizimi orqali to&apos;lashni ma&apos;qul ko&apos;rasiz?
              </DialogDescription>
            </DialogHeader>

            {/* Selected Plan Summary Pill */}
            {selectedPlanObj && (
              <div className="mt-3.5 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedPlanObj.displayName}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    ({billingCycle === 'annual' ? 'Yillik' : billingCycle === 'semi_annual' ? '6 oylik' : 'Oylik'})
                  </span>
                </div>
                <div className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  {formatPrice(selectedPlanPrice)}
                </div>
              </div>
            )}
          </div>

          {/* Provider Options - The Big Three */}
          <div className="p-5 space-y-3">
            {/* 1. UZUM BANK */}
            <button
              type="button"
              className="group w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/80 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-all duration-200 shadow-2xs hover:shadow-md text-left cursor-pointer"
              onClick={() => handleProviderSelect('uzum')}
              disabled={loading !== null}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/60 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UzumBankLogo className="h-8 w-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Uzum Bank</span>
                  <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    Tavsiya etiladi
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Uzcard, Humo, Visa va Mastercard orqali saytda to&apos;lov
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 2. CLICK */}
            <button
              type="button"
              className="group w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all duration-200 shadow-2xs hover:shadow-md text-left cursor-pointer"
              onClick={() => handleProviderSelect('click')}
              disabled={loading !== null}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClickLogo className="h-6 w-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Click</span>
                  <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    Saytda to&apos;lov
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Bank kartasi yoki Click Up ilovasi orqali to&apos;lov
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 3. PAYME */}
            <button
              type="button"
              className="group w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500/80 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-all duration-200 shadow-2xs hover:shadow-md text-left cursor-pointer"
              onClick={() => handleProviderSelect('payme')}
              disabled={loading !== null}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/60 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PaymeLogo className="h-6 w-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Payme</span>
                  <span className="bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    Tezkor
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Payme ilovasi yoki bank kartasi orqali to&apos;lov
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>To&apos;lov 100% xavfsiz va shifrlangan</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* On-Site Click Payment Modal */}
      {selectedPlan && (
        <ClickOnSiteModal
          open={showClickOnSiteModal}
          onOpenChange={setShowClickOnSiteModal}
          amount={getPlanPrice(selectedPlan as any, billingCycle as any)}
          planType={selectedPlan as any}
          billingCycle={billingCycle}
          type="subscription"
          initialTab={clickInitialTab}
          defaultPhone={user?.phone}
          onBack={() => {
            setShowClickOnSiteModal(false)
            setShowProviderModal(true)
          }}
          onSuccess={() => {
            refreshUser?.()
            window.location.href = '/dashboard?payment=success'
          }}
        />
      )}

      {/* On-Site Payme Payment Modal */}
      {selectedPlan && (
        <PaymeOnSiteModal
          open={showPaymeModal}
          onOpenChange={setShowPaymeModal}
          amount={getPlanPrice(selectedPlan as any, billingCycle as any)}
          planType={selectedPlan as any}
          billingCycle={billingCycle}
          type="subscription"
          defaultPhone={user?.phone}
          onBack={() => {
            setShowPaymeModal(false)
            setShowProviderModal(true)
          }}
          onSuccess={() => {
            refreshUser?.()
            window.location.href = '/dashboard?payment=success'
          }}
        />
      )}

      {/* On-Site Uzum Payment Modal */}
      {selectedPlan && (
        <UzumPaymentModal
          open={showUzumModal}
          onOpenChange={setShowUzumModal}
          paymentUrl={uzumPaymentUrl}
          amount={getPlanPrice(selectedPlan as any, billingCycle as any)}
          planTitle={`${selectedPlan} rejasi (${billingCycle === 'annual' ? 'Yillik' : billingCycle === 'semi_annual' ? '6 oylik' : 'Oylik'})`}
          onBack={() => {
            setShowUzumModal(false)
            setShowProviderModal(true)
          }}
          onSuccess={() => {
            refreshUser?.()
            window.location.href = '/dashboard?payment=success'
          }}
        />
      )}

      {/* Apple iOS App Store Compliant Payment Dialog */}
      <IosPaymentDialog
        open={showIosModal}
        onOpenChange={setShowIosModal}
        targetUrl="https://debtbook.uz/pricing"
        title="Obunani faollashtirish"
        description="Apple App Store qoidalariga muvofiq, B2B korporativ xizmatlar va tarif rejalari uchun to'lovlar rasmiy veb-saytimiz orqali xavfsiz amalga oshiriladi."
      />
    </AppShell>
  )
}

function FeatureItem({
  text,
  enabled = true,
  highlight = false,
  subtext,
  isSmsNotice = false,
}: {
  text: string
  enabled?: boolean
  highlight?: boolean
  subtext?: string
  isSmsNotice?: boolean
}) {
  return (
    <div className={`flex items-start gap-2.5 ${!enabled ? 'opacity-40' : ''}`}>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          !enabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            : isSmsNotice
            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
            : highlight
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
        }`}
      >
        {enabled ? (
          <Check className="w-3 h-3 stroke-[3]" />
        ) : (
          <X className="w-2.5 h-2.5 stroke-[2.5]" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-xs sm:text-sm">
        <span
          className={`${
            !enabled
              ? 'text-slate-400 dark:text-slate-500 line-through'
              : highlight
              ? 'text-slate-900 dark:text-slate-100 font-bold'
              : 'text-slate-700 dark:text-slate-300 font-medium'
          }`}
        >
          {text}
        </span>
        {subtext && (
          <span
            className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isSmsNotice
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  )
}
