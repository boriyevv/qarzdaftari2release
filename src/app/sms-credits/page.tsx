// src/app/sms-credits/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, CreditCard, Check, Zap, History } from 'lucide-react'
import { SMS_PACKAGES } from '@/lib/constants/plans'
import { MainNav } from '@/components/layout/main-nav'

interface SMSCreditsData {
  total_credits: number
  used_credits: number
  remaining_credits: number
  recent_purchases: Array<{
    credits: number
    amount: number
    created_at: string
  }>
  usage_history: Array<{
    recipient_phone: string
    created_at: string
  }>
}

export default function SMSCreditsPage() {
  const [credits, setCredits] = useState<SMSCreditsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/sms-credits')
      const data = await response.json()
      if (response.ok) {
        setCredits(data)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
    setShowProviderModal(true)
  }

  const handlePurchase = async (provider: string) => {
    const pkg = SMS_PACKAGES.find(p => p.id === selectedPackage)
    if (!pkg) return

    setPurchaseLoading(true)

    try {
      const response = await fetch('/api/sms-credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
          provider,
        }),
      })

      const data = await response.json()

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Xato yuz berdi')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Xato yuz berdi')
    } finally {
      setPurchaseLoading(false)
      setShowProviderModal(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m'
  }

  return (
    <div className="min-h-screen  bg-slate-50 pb-20 lg:pb-6 lg:flex  lg:justify-between">
      
      <div className="nav">
        <MainNav/>
      </div>
      {/* Header */}
      <div className="wrapper w-full lg:w-4/5">
        <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SMS Kredits</h1>
              <p className="text-slate-600">Qarzdorlarga eslatma yuboring</p>
            </div>
          </div>
        </div>
      </div>

        
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Current Balance */}
        {!loading && credits && (
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Mavjud kredits</p>
                  <p className="text-4xl font-bold mt-1">
                    {credits.remaining_credits}
                  </p>
                  <p className="text-blue-100 text-sm mt-2">
                    Jami: {credits.total_credits} | Ishlatilgan: {credits.used_credits}
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-10 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Packages */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Paketlar</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {SMS_PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`relative ${pkg.popular ? 'border-blue-500 border-2' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500">Mashhur</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-slate-900">
                      {formatPrice(pkg.price)}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">{pkg.credits} ta SMS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">{formatPrice(pkg.pricePerSMS)}/SMS</span>
                  </div>
                  {pkg.savings && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-600">
                        {pkg.savings}
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelectPackage(pkg.id)}
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    Sotib olish
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {credits && credits.usage_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                So\'ngi yuborilgan SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {credits.usage_history.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.recipient_phone}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(item.created_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <Badge variant="outline">1 kredit</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Provider Modal */}
      <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To\'lov usulini tanlang</DialogTitle>
            <DialogDescription>
              SMS kredit sotib olish uchun to\'lov tizimini tanlang
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {['click', 'payme', 'uzum'].map((provider) => (
              <Button
                key={provider}
                className="w-full justify-start h-16"
                variant="outline"
                onClick={() => handlePurchase(provider)}
                disabled={purchaseLoading}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    provider === 'click' ? 'bg-blue-500' :
                    provider === 'payme' ? 'bg-green-500' : 'bg-purple-500'
                  }`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold capitalize">{provider}</div>
                    <div className="text-xs text-slate-500">
                      {provider === 'click' && 'Tezkor va xavfsiz'}
                      {provider === 'payme' && 'Ishonchli to\'lov'}
                      {provider === 'uzum' && 'Yangi va qulay'}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}