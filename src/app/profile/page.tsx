// src/app/profile/page.tsx
'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/contexts/user-context'
import { User, Store, Phone, Crown, Shield, LogOut, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user } = useUser()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    }
  }

  const currentPlan = (user?.plan_type || 'FREE').toUpperCase()

  return (
    <AppShell
      title="Profil"
      subtitle="Do'kon ma'lumotlari va hisob sozlamalari"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-blue-500/20 flex-shrink-0">
                {user?.store_name?.[0] || user?.full_name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                    {user?.store_name || user?.full_name || 'Mening Do&apos;konim'}
                  </h1>
                  <Badge
                    className={`text-xs font-black uppercase px-2.5 py-0.5 ${
                      currentPlan === 'PRO'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : currentPlan === 'PLUS'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {currentPlan}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Egasi: <span className="font-semibold text-slate-700">{user?.full_name || '-'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {currentPlan === 'FREE' && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                  <Link href="/pricing">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
                    Tarifni oshirish
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Hisobdan chiqish
              </Button>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                Do&apos;kon ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Do&apos;kon nomi</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {user?.store_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Telefon raqam</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {user?.phone || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Obuna holati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Joriy tarif</p>
                <p className="font-bold text-blue-600 mt-0.5">
                  {currentPlan} reja
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Imkoniyatlar</p>
                <p className="font-medium text-slate-600 text-xs mt-0.5">
                  {currentPlan === 'PRO'
                    ? 'Cheksiz qarzlar, to\'liq yillik analitika, ustuvor yordam'
                    : currentPlan === 'PLUS'
                    ? 'Kengaytirilgan qarzlar, 1 oylik tahlillar'
                    : 'Bepul sinov rejimi'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security / Info Notice */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/80 shadow-2xs rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 text-base font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Xavfsizlik va Shaxsiy ma&apos;lumotlar
            </CardTitle>
            <CardDescription className="text-blue-700 text-xs">
              Barcha qarz yozuvlari va ma&apos;lumotlaringiz shifrlangan holda xavfsiz saqlanadi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-800 leading-relaxed">
              Agar do&apos;koningiz ma&apos;lumotlarini o&apos;zgartirmoqchi bo&apos;lsangiz yoki savollaringiz bo&apos;lsa,
              bizning qo&apos;llab-quvvatlash xizmati bilan istalgan vaqtda bog&apos;lanishingiz mumkin.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
