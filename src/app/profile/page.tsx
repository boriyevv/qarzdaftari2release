// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/contexts/user-context'
import {
  User,
  Store,
  Phone,
  Crown,
  Shield,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Play,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { isSoundEnabled, setSoundEnabled, playSuccessSound } from '@/lib/sounds'
import { CashiersManagement } from '@/components/profile/cashiers-management'

export default function ProfilePage() {
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  const [soundOn, setSoundOn] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSoundOn(isSoundEnabled())
  }, [])

  const handleToggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) {
      setTimeout(() => playSuccessSound(), 50)
    }
  }

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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-blue-500/20 flex-shrink-0">
                {user?.store_name?.[0] || user?.full_name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.store_name || user?.full_name || "Mening Do'konim"}
                  </h1>
                  <Badge
                    className={`text-xs font-black uppercase px-2.5 py-0.5 ${
                      currentPlan === 'PRO'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : currentPlan === 'PLUS'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {currentPlan}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Egasi: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.full_name || '-'}</span>
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
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900/40 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Hisobdan chiqish
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance & Sound Preferences (New!) */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ilova ko&apos;rinishi va Tovushlar
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qurilmangizga mos rang mavzusi va to&apos;lov tasdiqlash tovushlarini sozlang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Mavzu (Theme)
              </label>
              {mounted && (
                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      theme === 'light'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500 mb-1.5" />
                    <span>Yorug&apos;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      theme === 'dark'
                        ? 'bg-blue-950/50 border-blue-500 text-blue-400 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400 mb-1.5" />
                    <span>Qorong&apos;i</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      theme === 'system'
                        ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-slate-500 mb-1.5" />
                    <span>Tizim</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span>Mikro-tovushlar (Audio Chimes)</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Qarzga to&apos;lov qabul qilinganda yoqimli muvaffaqiyat ovozi yangraydi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => playSuccessSound()}
                  className="rounded-xl h-8 px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  title="Tovushni eshitib ko'rish"
                >
                  <Play className="w-3 h-3 mr-1 text-blue-600" />
                  Sinash
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleToggleSound}
                  className={`rounded-xl h-8 px-3 text-xs font-bold transition-all ${
                    soundOn
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {soundOn ? 'Yoqilgan' : "O'chirilgan"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cashiers & Staff Management (Multi-user Mode) */}
        <CashiersManagement />

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Do&apos;kon ma&apos;lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Do&apos;kon nomi</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {user?.store_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Telefon raqam</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {user?.phone || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Obuna holati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Joriy tarif</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {currentPlan} reja
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Imkoniyatlar</p>
                <p className="font-medium text-slate-600 dark:text-slate-400 text-xs mt-0.5">
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-blue-200/80 dark:border-blue-900/50 shadow-2xs rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 dark:text-blue-200 text-base font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Xavfsizlik va Shaxsiy ma&apos;lumotlar
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300 text-xs">
              Barcha qarz yozuvlari va ma&apos;lumotlaringiz shifrlangan holda xavfsiz saqlanadi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Agar do&apos;koningiz ma&apos;lumotlarini o&apos;zgartirmoqchi bo&apos;lsangiz yoki savollaringiz bo&apos;lsa,
              bizning qo&apos;llab-quvvatlash xizmati bilan istalgan vaqtda bog&apos;lanishingiz mumkin.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
