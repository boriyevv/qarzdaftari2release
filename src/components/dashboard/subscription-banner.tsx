// src/components/dashboard/subscription-banner.tsx
'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, AlertCircle, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  plan_type: string
  status: string
  is_trial_active: boolean
  trial_ends_at: string | null
  days_remaining: number | null
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      const data = await response.json()
      if (response.ok) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) return null

  // Trial Active
  if (subscription.is_trial_active && subscription.days_remaining) {
    return (
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-semibold text-blue-900">
                Bepul sinov: {subscription.days_remaining} kun qoldi
              </span>
              <p className="text-sm text-blue-700 mt-1">
                To&apos;liq funksiyalardan foydalaning! SMS uchun kredit sotib oling.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/sms-credits">SMS kredit</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/pricing">Tariflar</Link>
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Trial Expired
  if (subscription.status === 'expired') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-semibold">Sinov muddati tugadi</span>
              <p className="text-sm mt-1">
                Davom ettirish uchun tarif rejasini tanlang
              </p>
            </div>
            <Button asChild size="sm" variant="default">
              <Link href="/pricing">Tarif tanlash</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Active Subscription
  if (subscription.plan_type !== 'FREE') {
    return (
      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <Crown className="h-4 w-4 text-green-600" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">{subscription.plan_type}</Badge>
              <span className="text-sm text-green-900">
                Faol obuna
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">Boshqarish</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}