// src/app/pricing/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, CreditCard, Zap } from 'lucide-react'
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

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showProviderModal, setShowProviderModal] = useState(false)

  const handleSelectPlan = (planType: string) => {
    if (planType === 'FREE') return
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
    <div className="min-h-screen block bg-gradient-to-b from-slate-50 to-slate-100 lg:flex  lg:justify-between">
      <div className="nav">
        <MainNav />
      </div>
      <div className="wrapper w-full lg:w-4/5">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-slate-900">
              Tariflar
            </h1>
            <p className="text-xl text-slate-600">
              Biznesingiz uchun to&apos;g&apos;ri rejani tanlang
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-12">
            <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="monthly">Oylik</TabsTrigger>
                <TabsTrigger value="semi_annual">
                  <div className="flex items-center gap-1">
                    6 oylik
                    <Badge variant="secondary" className="ml-1 text-xs">-5%</Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="annual">
                  <div className="flex items-center gap-1">
                    Yillik
                    <Badge variant="secondary" className="ml-1 text-xs bg-green-500 text-white">-10%</Badge>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.values(PLANS).map((plan) => {
              const price = plan.prices[billingCycle]
              const discount = getDiscount(plan.name as any, billingCycle)
              const months = BILLING_CYCLE_MONTHS[billingCycle]

              return (
                <Card
                  key={plan.name}
                  className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Mashhur
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>

                    <div className="mt-4 space-y-2">
                      {/* Main Price */}
                      <div>
                        <span className="text-4xl font-bold">
                          {price === 0 ? '0' : formatPrice(price)}
                        </span>
                        {price > 0 && months > 1 && (
                          <span className="text-slate-600">/{BILLING_CYCLE_LABELS[billingCycle]}</span>
                        )}
                        {price > 0 && months === 1 && (
                          <span className="text-slate-600">/oy</span>
                        )}
                      </div>

                      {/* Monthly Equivalent */}
                      {price > 0 && months > 1 && (
                        <div className="text-sm text-slate-500">
                          {formatPricePerMonth(price, months)} ga teng
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount.amount > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Zap className="w-3 h-3 mr-1" />
                            {formatPrice(discount.amount)} tejash
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
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

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.name)}
                      disabled={price === 0}
                    >
                      {price === 0 ? 'Hozirgi plan' : 'Sotib olish'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Savings Highlight */}
          {billingCycle !== 'monthly' && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-6 py-3">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  {billingCycle === 'semi_annual' ? '6 oylik' : 'Yillik'} to&apos;lovda {BILLING_CYCLE_DISCOUNTS[billingCycle]}% tejang!
                </span>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="mt-16 text-center">
            <p className="text-slate-600">
              Savol bormi? <a href="/contact" className="text-blue-600 hover:underline">Biz bilan bog&apos;laning</a>
            </p>
          </div>
        </div>

        {/* Payment Provider Selection Modal */}
        <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To&apos;lov usulini tanlang</DialogTitle>
              <DialogDescription>
                Qaysi to&apos;lov tizimi orqali to&apos;lamoqchisiz?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Button
                className="w-full justify-start h-16"
                variant="outline"
                onClick={() => handleProviderSelect('click')}
                disabled={loading !== null}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Click</div>
                    <div className="text-xs text-slate-500">Tezkor va xavfsiz</div>
                  </div>
                </div>
              </Button>

              <Button
                className="w-full justify-start h-16"
                variant="outline"
                onClick={() => handleProviderSelect('payme')}
                disabled={loading !== null}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Payme</div>
                    <div className="text-xs text-slate-500">Ishonchli to&apos;lov</div>
                  </div>
                </div>
              </Button>

              <Button
                className="w-full justify-start h-16"
                variant="outline"
                onClick={() => handleProviderSelect('uzum')}
                disabled={loading !== null}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Uzum</div>
                    <div className="text-xs text-slate-500">Yangi va qulay</div>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Feature({ text, enabled = true }: { text: string, enabled?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${!enabled ? 'opacity-50 line-through' : ''}`}>
      <Check className={`w-5 h-5 ${enabled ? 'text-green-500' : 'text-gray-400'}`} />
      <span className="text-sm">{text}</span>
    </div>
  )
}