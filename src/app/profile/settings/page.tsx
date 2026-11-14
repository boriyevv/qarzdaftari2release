// src/app/profile/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useUser } from '@/lib/contexts/user-context'
import { useLanguage } from '@/lib/contexts/language-context'
import { AppLanguage } from '@/lib/i18n/translations'
import { UzbekistanFlag, RussiaFlag, UkFlag } from '@/components/ui/country-flags'
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
  const { language, setLanguage, dict } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [hapticsOn, setHapticsOn] = useState(true)
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS')

  useEffect(() => {
    setMounted(true)
    setSoundOn(isSoundEnabled())
    setHapticsOn(isHapticsEnabled())
    const savedCurrency = localStorage.getItem('qd_preferred_currency')
    if (savedCurrency === 'USD') setCurrency('USD')
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
      toast.success(dict.settings.sound_enabled_toast)
    } else {
      toast.info(dict.settings.sound_disabled_toast)
    }
  }

  const handleToggleHaptics = async (checked: boolean) => {
    setHapticsOn(checked)
    setHapticsEnabled(checked)
    if (checked) {
      await nativeHaptics.impact('medium')
      toast.success(dict.settings.haptics_enabled_toast)
    } else {
      toast.info(dict.settings.haptics_disabled_toast)
    }
  }

  const handleChangeCurrency = async (curr: 'UZS' | 'USD') => {
    setCurrency(curr)
    localStorage.setItem('qd_preferred_currency', curr)
    await nativeHaptics.impact('light')
    toast.success(
      `${dict.settings.currency_title}: ${curr === 'UZS' ? dict.settings.currency_uzs : dict.settings.currency_usd}`
    )
  }

  const handleChangeLang = async (newLang: AppLanguage) => {
    setLanguage(newLang)
    await nativeHaptics.impact('light')
    if (newLang === 'ru') {
      toast.success('Русский язык успешно установлен')
    } else if (newLang === 'en') {
      toast.success('English language activated')
    } else {
      toast.success("O'zbek tili tanlandi")
    }
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm">{dict.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell
      title={dict.settings.title}
      subtitle={dict.settings.subtitle}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* Navigation Back Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{dict.settings.back_to_profile}</span>
        </Link>

        {/* 1. Theme Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {dict.settings.theme_title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {dict.settings.theme_desc}
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
                  <span>{dict.settings.theme_light}</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">{dict.settings.theme_light_desc}</span>
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
                  <span>{dict.settings.theme_dark}</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">{dict.settings.theme_dark_desc}</span>
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
                  <Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-1.5" />
                  <span>{dict.settings.theme_system}</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">{dict.settings.theme_system_desc}</span>
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
              {dict.settings.sounds_title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {dict.settings.sounds_desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Audio Chime Row */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <div className="space-y-0.5 pr-3">
                <div className="flex items-center gap-2">
                  {soundOn ? (
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dict.settings.sound_chime}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                  {dict.settings.sound_chime_desc}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => playSuccessSound()}
                  title={dict.settings.test_sound}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                  <span>{dict.settings.test_sound}</span>
                </button>

                <Switch
                  checked={soundOn}
                  onCheckedChange={handleToggleSound}
                  aria-label={dict.settings.sound_chime}
                />
              </div>
            </div>

            {/* Haptics Feedback Row */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <div className="space-y-0.5 pr-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dict.settings.haptics_title}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                  {dict.settings.haptics_desc}
                </p>
              </div>

              <Switch
                checked={hapticsOn}
                onCheckedChange={handleToggleHaptics}
                aria-label={dict.settings.haptics_title}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Currency Settings Card */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {dict.settings.currency_title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {dict.settings.currency_desc}
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
                  <p className="text-xs font-bold">{dict.settings.currency_uzs}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{dict.settings.currency_uzs_desc}</p>
                </div>
                {currency === 'UZS' && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                    {dict.settings.active_badge}
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
                  <p className="text-xs font-bold">{dict.settings.currency_usd}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{dict.settings.currency_usd_desc}</p>
                </div>
                {currency === 'USD' && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                    {dict.settings.active_badge}
                  </Badge>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 4. Language Settings Card with Official Flags */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              {dict.settings.lang_title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {dict.settings.lang_desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            {/* O'zbekcha 🇺🇿 */}
            <button
              type="button"
              onClick={() => handleChangeLang('uz')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                language === 'uz'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <UzbekistanFlag className="w-8 h-5.5 rounded-md shadow-xs" />
                <div>
                  <p className="text-xs sm:text-sm font-bold">{dict.settings.lang_uz}</p>
                  <p className="text-[10px] text-slate-400">{dict.settings.lang_uz_sub}</p>
                </div>
              </div>
              {language === 'uz' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Русский 🇷🇺 */}
            <button
              type="button"
              onClick={() => handleChangeLang('ru')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                language === 'ru'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <RussiaFlag className="w-8 h-5.5 rounded-md shadow-xs" />
                <div>
                  <p className="text-xs sm:text-sm font-bold">{dict.settings.lang_ru}</p>
                  <p className="text-[10px] text-slate-400">{dict.settings.lang_ru_sub}</p>
                </div>
              </div>
              {language === 'ru' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* English 🇬🇧 */}
            <button
              type="button"
              onClick={() => handleChangeLang('en')}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 text-blue-900 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <UkFlag className="w-8 h-5.5 rounded-md shadow-xs" />
                <div>
                  <p className="text-xs sm:text-sm font-bold">{dict.settings.lang_en}</p>
                  <p className="text-[10px] text-slate-400">{dict.settings.lang_en_sub}</p>
                </div>
              </div>
              {language === 'en' && (
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
