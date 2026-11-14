// src/components/profile/security-lock-settings.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  checkBiometrics,
  securityStorage,
} from '@/lib/native/biometrics'
import { nativeHaptics } from '@/lib/native'
import { playSuccessSound } from '@/lib/sounds'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Clock,
  KeyRound,
  Trash2,
  CheckCircle2,
  Delete,
  Sparkles,
} from 'lucide-react'

export function SecurityLockSettings() {
  const [hasPin, setHasPin] = useState(false)
  const [isLockEnabled, setIsLockEnabled] = useState(false)
  const [isBioEnabled, setIsBioEnabled] = useState(false)
  const [timeoutSec, setTimeoutSec] = useState(0)
  const [biometricName, setBiometricName] = useState('Face ID / Barmoq izi')
  const [canUseBio, setCanUseBio] = useState(false)

  // PIN Setup Modal state
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [firstPin, setFirstPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [setupError, setSetupError] = useState<string | null>(null)

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
      handleOpenSetup()
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
    if (confirm("Rostdan ham ilova PIN kodi va biometrik qulfini o'chirmoqchimisiz?")) {
      securityStorage.removePin()
      reloadSettings()
      toast.success("Xavfsizlik qulfi o'chirildi")
    }
  }

  const handleOpenSetup = () => {
    setStep(1)
    setFirstPin('')
    setConfirmPin('')
    setSetupError(null)
    setSetupModalOpen(true)
  }

  const handleSetupDigit = async (digit: string) => {
    await nativeHaptics.impact('light')
    setSetupError(null)

    if (step === 1) {
      if (firstPin.length < 4) {
        const next = firstPin + digit
        setFirstPin(next)
        if (next.length === 4) {
          setTimeout(() => {
            setStep(2)
          }, 200)
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit
        setConfirmPin(next)
        if (next.length === 4) {
          if (next === firstPin) {
            await securityStorage.savePin(next)
            if (canUseBio) {
              securityStorage.setBiometricsEnabled(true)
            }
            reloadSettings()
            playSuccessSound()
            toast.success("4 xonali PIN kod muvaffaqiyatli o'rnatildi!")
            setSetupModalOpen(false)
          } else {
            await nativeHaptics.notification('error')
            setSetupError("PIN kodlar bir-biriga mos kelmadi. Qaytadan urinib ko'ring.")
            setTimeout(() => {
              setConfirmPin('')
              setStep(1)
              setFirstPin('')
            }, 600)
          }
        }
      }
    }
  }

  const handleSetupDelete = async () => {
    await nativeHaptics.impact('light')
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1))
    } else {
      setConfirmPin((prev) => prev.slice(0, -1))
    }
    setSetupError(null)
  }

  return (
    <>
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

            <div className="self-start sm:self-auto shrink-0">
              {hasPin && isLockEnabled ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 text-xs inline-flex items-center gap-1.5 rounded-full shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Himoyalangan
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-slate-500 dark:text-slate-400 font-semibold px-2.5 py-1 text-xs rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                >
                  O&apos;chirilgan
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {!hasPin ? (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  PIN kod o&apos;rnatilmagan
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ilovani har safar ochganda barmoq izi yoki 4 xonali kod so&apos;rash uchun PIN kod yarating.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleOpenSetup}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 px-4 shadow-sm shadow-indigo-500/20"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                PIN kod o&apos;rnatish
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle 1: PIN Lock */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    PIN kod bilan qulflash
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ilova ochilganda yoki fondan qaytganda kod so&apos;rash
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
                  onClick={handleOpenSetup}
                  className="rounded-xl text-xs font-semibold h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  PIN kodni o&apos;zgartirish
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLock}
                  className="rounded-xl text-xs font-semibold h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Qulfni o&apos;chirish
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PIN SETUP MODAL */}
      <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
        <DialogContent className="sm:max-w-xs rounded-3xl p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="text-center items-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {step === 1 ? 'Yangi 4 xonali PIN kod' : 'PIN kodni tasdiqlang'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {step === 1
                ? 'Ilovani ochish uchun yangi 4 ta raqam kiriting'
                : 'Xatolik yo\'qligini tekshirish uchun kodni qayta kiriting'}
            </DialogDescription>
          </DialogHeader>

          {/* Dots */}
          <div className="flex items-center justify-center gap-3.5 py-4">
            {[0, 1, 2, 3].map((index) => {
              const currentPin = step === 1 ? firstPin : confirmPin
              const filled = currentPin.length > index
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    setupError
                      ? 'bg-rose-500 ring-4 ring-rose-500/20'
                      : filled
                      ? 'bg-indigo-600 dark:bg-indigo-500 scale-110 shadow-sm shadow-indigo-500/50'
                      : 'border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  }`}
                />
              )
            })}
          </div>

          {setupError && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 text-center pb-1">
              {setupError}
            </p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSetupDigit(num.toString())}
                className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-indigo-600 active:text-white dark:active:bg-indigo-600 border border-slate-200 dark:border-slate-800 font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleSetupDigit('0')}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-indigo-600 active:text-white dark:active:bg-indigo-600 border border-slate-200 dark:border-slate-800 font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleSetupDelete}
              className="h-12 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
