// src/app/pricing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, CreditCard, Zap, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'
import {
  PLANS,
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_MONTHS,
  BILLING_CYCLE_DISCOUNTS,
  formatPrice,
  formatPricePerMonth,
  getDiscount,
  type BillingCycle
} from '@/lib/constants/plans'
import { MainNav } from '@/components/layout/main-nav'
import { useUser } from '@/lib/contexts/user-context'
import {
  PaymentMethodsRow,
  UzumBankLogo,
  PaymeLogo,
  ClickLogo,
} from '@/components/payments/payment-logos'

export default function PricingPage() {
  const { user, refreshUser } = useUser()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showProviderModal, setShowProviderModal] = useState(false)

  // Ensure latest user subscription status is refreshed
  useEffect(() => {
    refreshUser?.()
  }, [])

  const handleSelectPlan = (planType: string) => {
    if (planType === 'FREE') {
      if (!user) {
        window.location.href = '/register'
      }
      return
    }
    if (!user) {
      window.location.href = `/register?plan=${planType.toLowerCase()}`
      return
    }
    setSelectedPlan(planType)
    setShowProviderModal(true)
  }

  const handleProviderSelect = async (provider: string) => {
    if (!selectedPlan) return

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
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Xato yuz berdi')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Xato yuz berdi')
    } finally {
      setLoading(null)
      setShowProviderModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64 pb-24 lg:pb-16 transition-all">
      <MainNav />

      <main className="w-full">
        <div className="container mx-auto px-4 py-10 sm:py-14 max-w-6xl">
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3.5 py-1 font-semibold text-xs rounded-full">
              Tariflar va Rejalar
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Biznesingiz uchun to&apos;g&apos;ri tarifni tanlang
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Shaffof narxlar, yashirin komissiyalarsiz. Uzum Bank, Click va Payme orqali 100% xavfsiz to&apos;lang.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-10">
            <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
              <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-200/80 p-1 rounded-2xl">
                <TabsTrigger value="monthly" className="rounded-xl font-semibold text-xs py-2">
                  Oylik
                </TabsTrigger>
                <TabsTrigger value="semi_annual" className="rounded-xl font-semibold text-xs py-2">
                  <div className="flex items-center gap-1">
                    6 oylik
                    <Badge variant="secondary" className="ml-1 text-[10px] bg-slate-100 text-slate-700">-5%</Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="annual" className="rounded-xl font-semibold text-xs py-2">
                  <div className="flex items-center gap-1">
                    Yillik
                    <Badge className="ml-1 text-[10px] bg-emerald-600 text-white font-bold">-10%</Badge>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Active Subscription Banner for Logged-In User */}
          {user && user.plan_type && user.plan_type !== 'FREE' && (
            <div className="max-w-4xl mx-auto mb-10 p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-300/80 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md flex-shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-950 text-base sm:text-lg">
                      Sizda {user.plan_type} tarifi faol
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[11px] font-semibold py-0.5 px-2.5">
                      Faol Obuna
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                    To&apos;lov muvaffaqiyatli qabul qilingan. Barcha {user.plan_type} imkoniyatlaridan to&apos;liq foydalanishingiz mumkin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.values(PLANS).map((plan) => {
              const price = plan.prices[billingCycle]
              const discount = getDiscount(plan.name as any, billingCycle)
              const months = BILLING_CYCLE_MONTHS[billingCycle]

              const userPlan = (user?.plan_type || 'FREE').toUpperCase()
              const isCurrentPlan = !!user && userPlan === plan.name
              const isDowngrade =
                !!user &&
                ((userPlan === 'PRO' && (plan.name === 'PLUS' || plan.name === 'FREE')) ||
                 (userPlan === 'PLUS' && plan.name === 'FREE'))
              const isUpgrade = !!user && userPlan === 'PLUS' && plan.name === 'PRO'

              let buttonText = 'Sotib olish'
              let buttonDisabled = false
              let buttonVariant: 'default' | 'outline' = plan.popular ? 'default' : 'outline'

              if (!user) {
                buttonText = price === 0 ? 'Bepul boshlash' : "Tanlash va Ro'yxatdan o'tish"
                buttonDisabled = false
              } else if (isCurrentPlan) {
                buttonText = 'Hozirgi tarifingiz'
                buttonDisabled = true
                buttonVariant = 'outline'
              } else if (isDowngrade) {
                buttonText = 'Amaldagi tarifdan past'
                buttonDisabled = true
                buttonVariant = 'outline'
              } else if (isUpgrade) {
                buttonText = 'Tarifni oshirish (Upgrade)'
                buttonDisabled = false
                buttonVariant = 'default'
              }

              return (
                <Card
                  key={plan.name}
                  className={`relative transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${
                    isCurrentPlan
                      ? 'border-emerald-500 border-2 shadow-xl ring-4 ring-emerald-500/10 bg-white'
                      : plan.popular
                      ? 'border-blue-500 border-2 shadow-xl bg-white'
                      : 'border border-slate-200/80 shadow-sm bg-white hover:shadow-md'
                  }`}
                >
                  {isCurrentPlan ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white px-4 py-1 font-bold text-xs shadow-sm">
                        ✓ Hozirgi tarifingiz
                      </Badge>
                    </div>
                  ) : plan.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 font-bold text-xs shadow-sm">
                        Eng ommabop
                      </Badge>
                    </div>
                  ) : null}

                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-900">{plan.displayName}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">{plan.description}</CardDescription>

                    <div className="mt-4 space-y-1">
                      {/* Main Price */}
                      <div>
                        <span className="text-4xl font-extrabold text-slate-900" suppressHydrationWarning>
                          {price === 0 ? '0' : formatPrice(price)}
                        </span>
                        {price > 0 && months > 1 && (
                          <span className="text-slate-600 text-sm">/{BILLING_CYCLE_LABELS[billingCycle]}</span>
                        )}
                        {price > 0 && months === 1 && (
                          <span className="text-slate-600 text-sm">/oy</span>
                        )}
                      </div>

                      {/* Monthly Equivalent */}
                      {price > 0 && months > 1 && (
                        <div className="text-xs text-slate-500 font-medium" suppressHydrationWarning>
                          {formatPricePerMonth(price, months)} ga teng
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount.amount > 0 && (
                        <div className="pt-2">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold" suppressHydrationWarning>
                            <Zap className="w-3 h-3 mr-1 text-emerald-600" />
                            {formatPrice(discount.amount)} tejash
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <Feature
                      text={`${plan.features.max_debts === -1 ? 'Cheksiz' : plan.features.max_debts} ta qarz`}
                    />
                    <Feature
                      text={`${plan.features.max_folders === -1 ? 'Cheksiz' : plan.features.max_folders} ta folder`}
                    />
                    <Feature
                      text="Telegram eslatmalar"
                      enabled={plan.features.telegram_notifications}
                    />
                    <Feature
                      text="SMS eslatmalar"
                      enabled={plan.features.sms_notifications}
                    />
                    <Feature
                      text={`Analytics (${plan.features.analytics_period === 'monthly' ? '1 oylik' : plan.features.analytics_period === 'annual' ? '1 yillik' : '-'})`}
                      enabled={plan.features.analytics}
                    />
                    <Feature
                      text="Export (Excel/PDF)"
                      enabled={plan.features.export}
                    />
                    {plan.features.api_access && (
                      <Feature text="API kirish" />
                    )}
                    {plan.features.priority_support && (
                      <Feature text="Priority support" />
                    )}
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button
                      className={`w-full font-semibold rounded-xl h-11 transition-all ${
                        isCurrentPlan
                          ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100 cursor-default shadow-xs'
                          : plan.popular
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : ''
                      }`}
                      variant={buttonVariant}
                      onClick={() => handleSelectPlan(plan.name)}
                      disabled={buttonDisabled}
                    >
                      {buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Savings Highlight */}
          {billingCycle !== 'monthly' && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3 shadow-xs">
                <Zap className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-900 font-semibold text-sm">
                  {billingCycle === 'semi_annual' ? '6 oylik' : 'Yillik'} to&apos;lovda {BILLING_CYCLE_DISCOUNTS[billingCycle]}% tejang!
                </span>
              </div>
            </div>
          )}

          {/* Payment & Security Compliance Banner */}
          <div className="mt-16 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Qo&apos;llab-quvvatlanadigan to&apos;lov tizimlari va bank kartalari
            </p>
            <PaymentMethodsRow />
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
              <Link href="/payment-terms" className="hover:text-blue-600 transition underline underline-offset-4">
                To&apos;lov usullari va mablag&apos;larni qaytarish qoidalari
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/security" className="hover:text-blue-600 transition underline underline-offset-4">
                Xavfsizlik va firibgarlikni nazorat qilish (Antifraud)
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/terms" className="hover:text-blue-600 transition underline underline-offset-4">
                Ommaviy oferta
              </Link>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-600">
              Savolingiz bormi? <Link href="/contact" className="text-blue-600 font-semibold hover:underline">Biz bilan bog&apos;laning</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Payment Provider Selection Modal */}
      <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">To&apos;lov usulini tanlang</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Qaysi to&apos;lov tizimi orqali to&apos;lashni ma&apos;qul ko&apos;rasiz?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full justify-start h-18 py-2.5 px-4 hover:border-purple-400 hover:bg-purple-50/40 transition-all rounded-xl"
              variant="outline"
              onClick={() => handleProviderSelect('uzum')}
              disabled={loading !== null}
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white border border-purple-200/80 p-1.5 flex items-center justify-center shadow-xs">
                  <UzumBankLogo className="h-10 w-auto" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    Uzum Bank
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] font-semibold py-0 px-1.5">
                      Tavsiya etiladi
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">Uzcard va Humo kartalari orqali to&apos;lov</div>
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-18 py-2.5 px-4 hover:border-blue-400 hover:bg-blue-50/40 transition-all rounded-xl"
              variant="outline"
              onClick={() => handleProviderSelect('click')}
              disabled={loading !== null}
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white border border-blue-200/80 p-2 flex items-center justify-center shadow-xs">
                  <ClickLogo className="h-7 w-auto" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-slate-900">Click</div>
                  <div className="text-xs text-slate-500">Click Up yoki karta orqali to&apos;lov</div>
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-18 py-2.5 px-4 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all rounded-xl"
              variant="outline"
              onClick={() => handleProviderSelect('payme')}
              disabled={loading !== null}
            >
              <div className="flex items-center gap-3.5 w-full">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white border border-emerald-200/80 p-2 flex items-center justify-center shadow-xs">
                  <PaymeLogo className="h-7 w-auto" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-slate-900">Payme</div>
                  <div className="text-xs text-slate-500">Ilova yoki karta orqali tezkor to&apos;lov</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Feature({ text, enabled = true }: { text: string, enabled?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${!enabled ? 'opacity-40 line-through' : ''}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
      }`}>
        <Check className="w-3 h-3 stroke-[3]" />
      </div>
      <span className="text-xs sm:text-sm text-slate-700">{text}</span>
    </div>
  )
}
