// src/app/profile/security/pin/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { securityStorage, checkBiometrics } from '@/lib/native/biometrics'
import { nativeHaptics } from '@/lib/native'
import { playSuccessSound } from '@/lib/sounds'
import { toast } from 'sonner'
import { KeyRound, ShieldCheck, Delete, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function SetPinPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  const [step, setStep] = useState<1 | 2>(1)
  const [firstPin, setFirstPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile/security/pin')
    }
  }, [user, userLoading])

  const handleDigit = useCallback(
    async (digit: string) => {
      if (isSuccess) return
      setError(null)
      await nativeHaptics.impact('light')

      if (step === 1) {
        if (firstPin.length < 4) {
          const next = firstPin + digit
          setFirstPin(next)
          if (next.length === 4) {
            await nativeHaptics.impact('medium')
            setTimeout(() => {
              setStep(2)
            }, 220)
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const next = confirmPin + digit
          setConfirmPin(next)
          if (next.length === 4) {
            if (next === firstPin) {
              // Match! Save PIN and enable lock
              setIsSuccess(true)
              await securityStorage.savePin(next)
              const bioStatus = await checkBiometrics()
              if (bioStatus.isAvailable) {
                securityStorage.setBiometricsEnabled(true)
              }
              playSuccessSound()
              await nativeHaptics.notification('success')
              toast.success("4 xonali PIN kod muvaffaqiyatli saqlandi!")
              setTimeout(() => {
                router.replace('/profile/security')
              }, 400)
            } else {
              // Mismatch!
              await nativeHaptics.notification('error')
              setError("PIN kodlar mos kelmadi. Boshidan kiriting.")
              setIsShaking(true)
              setTimeout(() => {
                setIsShaking(false)
                setConfirmPin('')
                setFirstPin('')
                setStep(1)
              }, 800)
            }
          }
        }
      }
    },
    [step, firstPin, confirmPin, isSuccess, router]
  )

  const handleDelete = useCallback(async () => {
    if (isSuccess) return
    await nativeHaptics.impact('light')
    setError(null)
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1))
    } else {
      setConfirmPin((prev) => prev.slice(0, -1))
    }
  }, [step, isSuccess])

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleDelete])

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-xs font-medium text-slate-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const currentPin = step === 1 ? firstPin : confirmPin

  return (
    <AppShell
      title="PIN Kod O'rnatish"
      subtitle="4 xonali xavfsizlik kodi"
      showBack={true}
      onBack={() => router.push('/profile/security')}
    >
      <div className="max-w-md mx-auto px-4 py-4 sm:py-8 flex flex-col items-center justify-between min-h-[calc(100vh-10rem)]">
        {/* Top Back Link */}
        <div className="w-full flex items-center justify-between mb-4">
          <Link
            href="/profile/security"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xavfsizlik bo&apos;limiga qaytish</span>
          </Link>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {step === 1 ? '1 / 2-QADAM' : '2 / 2-QADAM'}
          </span>
        </div>

        {/* Center Header & Dots Section */}
        <div className="w-full flex flex-col items-center text-center space-y-4 pt-2 pb-6">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg ${
              isSuccess
                ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isSuccess
                ? 'PIN Kod Saqlandi!'
                : step === 1
                ? 'Yangi PIN kod kiriting'
                : 'PIN kodni tasdiqlang'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isSuccess
                ? "Ilova himoyasi faollashtirildi"
                : step === 1
                ? 'Ilovani ochish uchun yangi 4 xonali kod tanlang'
                : 'Xatolik yo\'qligiga ishonch hosil qilish uchun kodni qayta tering'}
            </p>
          </div>

          {/* 4 Animated PIN Dots */}
          <div
            className={`flex items-center justify-center gap-4 py-3 transition-transform ${
              isShaking ? 'animate-bounce text-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const filled = currentPin.length > index
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    error
                      ? 'bg-rose-500 ring-4 ring-rose-500/20 scale-110'
                      : filled
                      ? 'bg-blue-600 dark:bg-blue-500 ring-4 ring-blue-500/20 scale-125 shadow-md shadow-blue-500/40'
                      : 'border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                />
              )
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}
        </div>

        {/* Full-width Fintech Numeric Keypad */}
        <div className="w-full max-w-xs space-y-3 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num.toString())}
                disabled={isSuccess}
                className="h-16 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-blue-600 active:text-white dark:active:bg-blue-600 border border-slate-200/80 dark:border-slate-800 text-xl font-bold text-slate-900 dark:text-white shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row */}
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                <ShieldCheck className="w-5 h-5 opacity-40" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={isSuccess}
              className="h-16 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-blue-600 active:text-white dark:active:bg-blue-600 border border-slate-200/80 dark:border-slate-800 text-xl font-bold text-slate-900 dark:text-white shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isSuccess || currentPin.length === 0}
              className="h-16 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              title="O'chirish"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
