// src/components/profile/security-lock-settings.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  checkBiometrics,
  securityStorage,
} from '@/lib/native/biometrics'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Clock,
  KeyRound,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export function SecurityLockSettings() {
  const router = useRouter()
  const [hasPin, setHasPin] = useState(false)
  const [isLockEnabled, setIsLockEnabled] = useState(false)
  const [isBioEnabled, setIsBioEnabled] = useState(false)
  const [timeoutSec, setTimeoutSec] = useState(0)
  const [biometricName, setBiometricName] = useState('Face ID / Barmoq izi')
  const [canUseBio, setCanUseBio] = useState(false)

  const reloadSettings = () => {
    setHasPin(securityStorage.hasPin())
    setIsLockEnabled(securityStorage.isLockEnabled())
    setIsBioEnabled(securityStorage.isBiometricsEnabled())
    setTimeoutSec(securityStorage.getTimeout())
  }

  useEffect(() => {
    reloadSettings()
    checkBiometrics().then((status) => {
      setBiometricName(status.biometryName || 'Face ID / Barmoq izi')
      setCanUseBio(status.isAvailable)
    })
  }, [])

  const handleToggleLock = (checked: boolean) => {
    if (!hasPin && checked) {
      router.push('/profile/security/pin')
      return
    }
    securityStorage.setLockEnabled(checked)
    setIsLockEnabled(checked)
    toast.success(checked ? "PIN kod qulfi faollashtirildi" : "Ilova qulfi o'chirildi")
  }

  const handleToggleBio = (checked: boolean) => {
    securityStorage.setBiometricsEnabled(checked)
    setIsBioEnabled(checked)
    toast.success(checked ? `${biometricName} tekshiruvi yoqildi` : `${biometricName} o'chirildi`)
  }

  const handleChangeTimeout = (sec: number) => {
    securityStorage.setTimeout(sec)
    setTimeoutSec(sec)
    toast.success("Qulflash vaqti yangilandi")
  }

  const handleRemoveLock = () => {
    toast.warning("Ilova qulfini o'chirmoqchimisiz?", {
      description: "PIN kod va biometrik himoya o'chiriladi.",
      action: {
        label: "O'chirish",
        onClick: () => {
          securityStorage.removePin()
          reloadSettings()
          toast.success("Xavfsizlik qulfi o'chirildi")
        },
      },
      cancel: {
        label: "Bekor qilish",
        onClick: () => {},
      },
    })
  }

  return (
    <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              Ilova Xavfsizligi va Qulfi (PIN & Biometrika)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Do&apos;kondagi telefoningiz begona shaxslar qo&apos;liga tushganda qarzlarni himoyalash
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={`self-start sm:self-auto font-bold text-[11px] px-2.5 py-1 rounded-full ${
              hasPin && isLockEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
          >
            {hasPin && isLockEnabled ? 'Himoyalangan' : 'Faol emas'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* If NO PIN yet: Prompt to create one on dedicated page */}
        {!hasPin ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  4 xonali PIN kod o&apos;rnating
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ilovani har gal ochganingizda begona odamlar ma&apos;lumotlaringizni ko&apos;ra olmasligi uchun maxsus xavfsizlik kodi o&apos;rnating.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => router.push('/profile/security/pin')}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>PIN kod o&apos;rnatish</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        ) : (
          /* If PIN IS SET: Full controls */
          <div className="space-y-3">
            {/* Toggle 1: Enable PIN Lock */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  PIN kod qulfi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ilovaga har kirishda 4 xonali kod so&apos;raladi
                </p>
              </div>
              <Switch
                checked={isLockEnabled}
                onCheckedChange={handleToggleLock}
              />
            </div>

            {/* Toggle 2: Biometrics (Face ID / Fingerprint) */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {biometricName} orqali ochish
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PIN kod kiritmasdan bir zumda biometrika bilan ochish
                </p>
              </div>
              <Switch
                checked={isBioEnabled}
                onCheckedChange={handleToggleBio}
                disabled={!isLockEnabled}
              />
            </div>

            {/* Timeout options */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Qulflash vaqti (Avto-qulf)
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Darhol', sec: 0 },
                  { label: '1 daqiqa', sec: 60 },
                  { label: '5 daqiqa', sec: 300 },
                ].map((opt) => (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => handleChangeTimeout(opt.sec)}
                    disabled={!isLockEnabled}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      timeoutSec === opt.sec
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Change PIN / Remove */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile/security/pin')}
                className="rounded-xl text-xs font-semibold h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                PIN kodni o&apos;zgartirish
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLock}
                className="rounded-xl text-xs font-semibold h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Qulfni o&apos;chirish
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
