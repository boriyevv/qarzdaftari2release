// src/app/profile/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useUser } from '@/lib/contexts/user-context'
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Play,
  ArrowLeft,
  Smartphone,
  Coins,
  Globe,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { isSoundEnabled, setSoundEnabled, playSuccessSound } from '@/lib/sounds'
import { isHapticsEnabled, setHapticsEnabled, nativeHaptics } from '@/lib/native'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
  const { user, loading: userLoading } = useUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [hapticsOn, setHapticsOn] = useState(true)
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS')
  const [lang, setLang] = useState<'uz' | 'ru'>('uz')

  useEffect(() => {
    setMounted(true)
    setSoundOn(isSoundEnabled())
    setHapticsOn(isHapticsEnabled())
    const savedCurrency = localStorage.getItem('qd_preferred_currency')
    if (savedCurrency === 'USD') setCurrency('USD')
    const savedLang = localStorage.getItem('qd_preferred_lang')
    if (savedLang === 'ru') setLang('ru')
  }, [])

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile/settings')
    }
  }, [user, userLoading])

  const handleToggleSound = (checked: boolean) => {
    setSoundOn(checked)
    setSoundEnabled(checked)
    if (checked) {
      setTimeout(() => playSuccessSound(), 50)
      toast.success("To'lov bildirishnoma tovushi yoqildi")
    } else {
      toast.info("Bildirishnoma tovushi o'chirildi")
    }
  }

  const handleToggleHaptics = async (checked: boolean) => {
    setHapticsOn(checked)
    setHapticsEnabled(checked)
    if (checked) {
      await nativeHaptics.impact('medium')
      toast.success("Haptik tebranish (vibratsiya) yoqildi")
    } else {
      toast.info("Haptik tebranish o'chirildi")
    }
  }

  const handleChangeCurrency = async (curr: 'UZS' | 'USD') => {
    setCurrency(curr)
    localStorage.setItem('qd_preferred_currency', curr)
    await nativeHaptics.impact('light')
    toast.success(`Asosiy valyuta: ${curr === 'UZS' ? "O'zbekiston so'mi (UZS)" : "AQSH dollari (USD)"} tanlandi`)
  }

  const handleChangeLang = async (newLang: 'uz' | 'ru') => {
    setLang(newLang)
    localStorage.setItem('qd_preferred_lang', newLang)
    await nativeHaptics.impact('light')
    if (newLang === 'ru') {
      toast.info("Русский язык выбран. Интерфейс адаптируется")
    } else {
      toast.success("O'zbek tili tanlandi")
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
      title="Sozlamalar"
      subtitle="Mavzu, tovushlar, vibratsiya va til parametrlari"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* Navigation Back Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Profilga qaytish</span>
        </Link>

        {/* 1. Theme Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ilova mavzusi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qurilmangizga mos qulay rang rejimini tanlang
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            {mounted && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await nativeHaptics.impact('light')
                    setTheme('light')
                  }}
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
                  onClick={async () => {
                    await nativeHaptics.impact('light')
                    setTheme('dark')
                  }}
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
                  onClick={async () => {
                    await nativeHaptics.impact('light')
                    setTheme('system')
                  }}
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

        {/* 2. Sounds & Haptics Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tovushlar va Haptika
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Bildirishnomalar va tugmalar tebranishini boshqarish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-1">
            {/* Audio chime row */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    To&apos;lov bildirishnoma ovozi
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Qarz to&apos;lovi kiritilganda yoqimli chimes yangraydi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => playSuccessSound()}
                  className="rounded-xl h-8 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Tovushni sinash"
                >
                  <Play className="w-3 h-3 mr-1 text-blue-600 fill-blue-600" />
                  Sinash
                </Button>
                <Switch
                  checked={soundOn}
                  onCheckedChange={handleToggleSound}
                />
              </div>
            </div>

            {/* Haptic feedback row */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    Haptik tebranish (Vibratsiya)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Tugmalar bosilganda va amallarda yengil tebranish
                  </p>
                </div>
              </div>

              <Switch
                checked={hapticsOn}
                onCheckedChange={handleToggleHaptics}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Currency & Formatting Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              Valyuta va Formatlash
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarzlar va to&apos;lovlar summasini ko&apos;rsatish formati
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChangeCurrency('UZS')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  currency === 'UZS'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/80 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">UZS (So&apos;m)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">O&apos;zbekiston so&apos;mi</p>
                </div>
                {currency === 'UZS' && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                    Asosiy
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleChangeCurrency('USD')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/80 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">USD ($)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">AQSH dollari</p>
                </div>
                {currency === 'USD' && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                    Asosiy
                  </Badge>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 4. Language Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Ilova tili
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarz Daftari interfeysi va hisobotlar tili
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            {/* O'zbekcha */}
            <button
              type="button"
              onClick={() => handleChangeLang('uz')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                lang === 'uz'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🇺🇿</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold">O&apos;zbekcha (Lotin)</p>
                  <p className="text-[10px] text-slate-400">Asosiy til</p>
                </div>
              </div>
              {lang === 'uz' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Русский */}
            <button
              type="button"
              onClick={() => handleChangeLang('ru')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                lang === 'ru'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🇷🇺</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold">Русский</p>
                  <p className="text-[10px] text-slate-400">Дополнительный язык</p>
                </div>
              </div>
              {lang === 'ru' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
