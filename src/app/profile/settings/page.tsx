// src/app/profile/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/contexts/user-context'
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Play,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { isSoundEnabled, setSoundEnabled, playSuccessSound } from '@/lib/sounds'

export default function ProfileSettingsPage() {
  const { user, loading: userLoading } = useUser()
  const { theme, setTheme } = useTheme()
  const [soundOn, setSoundOn] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSoundOn(isSoundEnabled())
  }, [])

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile/settings')
    }
  }, [user, userLoading])

  const handleToggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) {
      setTimeout(() => playSuccessSound(), 50)
    }
  }

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
      title="Ilova sozlamalari"
      subtitle="Mavzu (ranglar) va mikro-tovushlarni boshqarish"
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

        {/* Theme Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tizim mavzusi (Theme)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qurilmangizga mos qulay rang mavzusini tanlang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mounted && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span>Yorug&apos;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-blue-950/50 border-blue-500 text-blue-400 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400 mb-1.5" />
                  <span>Qorong&apos;i</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Laptop className="w-5 h-5 text-slate-500 mb-1.5" />
                  <span>Avto (Tizim)</span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sound Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Mikro-tovushlar (Audio Chimes)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarz to&apos;lovi qabul qilinganda yangraydigan muvaffaqiyat ovozi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {soundOn ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>To&apos;lov bildirishnoma ovozi</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Har safar to&apos;lov kiritilganda yoqimli chimes yangraydi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => playSuccessSound()}
                  className="rounded-xl h-8 px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {soundOn ? 'Yoqilgan' : "O'chirilgan"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
