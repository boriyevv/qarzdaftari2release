// src/app/profile/store/page.tsx
'use client'

import { useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/contexts/user-context'
import {
  Store,
  Crown,
  Phone,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { DeleteAccountSection } from '@/components/profile/delete-account-section'

export default function ProfileStorePage() {
  const { user, loading: userLoading } = useUser()

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile/store')
    }
  }, [user, userLoading])

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

  const currentPlan = (user?.plan_type || 'FREE').toUpperCase()

  return (
    <AppShell
      title="Do'kon va Obuna"
      subtitle="Do'koningiz ma'lumotlari va faol tarif imkoniyatlari"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Back Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Profilga qaytish</span>
        </Link>

        {/* Store Details Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Do&apos;kon ma&apos;lumotlari
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarz daftaringizga biriktirilgan savdo nuqtasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Do&apos;kon nomi</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {user?.store_name || '-'}
                </p>
              </div>
              <Store className="w-5 h-5 text-slate-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Mas&apos;ul shaxs (Egasi)</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {user?.full_name || '-'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Bog&apos;langan telefon raqam</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                  {user?.phone || '-'}
                </p>
              </div>
              <Phone className="w-5 h-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Obuna va Tarif rejasi
              </CardTitle>
              <Badge
                className={`text-xs font-black uppercase px-2.5 py-0.5 ${
                  currentPlan === 'PRO'
                    ? 'bg-amber-500 text-white'
                    : currentPlan === 'PLUS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentPlan}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Faol obuna imkoniyatlari va muddatlari
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-blue-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 space-y-2.5">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {currentPlan === 'PRO'
                  ? 'Cheksiz Professional Imkoniyatlar'
                  : currentPlan === 'PLUS'
                  ? 'Kengaytirilgan Biznes Rejasi'
                  : 'Sinov (Bepul) Rejasi'}
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-6 list-disc">
                <li>Cheksiz qarzdorlar ro&apos;yxati va qarzlar yozuvi</li>
                <li>Telegram bot orqali avtomatik ertalabki/kechki hisobotlar</li>
                <li>Eskiz SMS xabarnomalari va eslatmalar</li>
                <li>Kassirlar va xodimlar boshqaruvi</li>
                <li>PDF va Excel eksport imkoniyati</li>
              </ul>
            </div>

            {currentPlan === 'FREE' && (
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 text-xs font-bold shadow-md shadow-blue-500/20">
                <Link href="/pricing">
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                  PRO tarifiga oshirish
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Deletion (Apple App Store Guideline 5.1.1(v) & Google Play Data Safety) */}
        <DeleteAccountSection />
      </div>
    </AppShell>
  )
}
