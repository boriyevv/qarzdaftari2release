// src/components/security/app-lock-provider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import {
  checkBiometrics,
  authenticateBiometrics,
  securityStorage,
} from '@/lib/native/biometrics'
import { nativeHaptics } from '@/lib/native'
import { playSuccessSound } from '@/lib/sounds'
import {
  Fingerprint,
  Delete,
  Shield,
  Lock,
  LogOut,
  Send,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface AppLockContextType {
  isLocked: boolean
  lockApp: () => void
  unlockApp: () => void
}

const AppLockContext = createContext<AppLockContextType>({
  isLocked: false,
  lockApp: () => {},
  unlockApp: () => {},
})

export const useAppLock = () => useContext(AppLockContext)

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [biometricName, setBiometricName] = useState('Biometrika')
  const [canUseBiometrics, setCanUseBiometrics] = useState(false)

  // Reset Flow States (Option 2: Telegram reset -> self-selected new PIN)
  const [lockMode, setLockMode] = useState<
    'enter_pin' | 'enter_reset_code' | 'enter_new_pin' | 'confirm_new_pin'
  >('enter_pin')
  const [tempNewPin, setTempNewPin] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  // 1. Check biometrics capability on mount
  useEffect(() => {
    checkBiometrics().then((status) => {
      setBiometricName(status.biometryName || 'Biometrika')
      setCanUseBiometrics(status.isAvailable)
    })
  }, [])

  // 2. Check if lock is needed on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Do not lock on public login/register/reset pages
    const path = window.location.pathname
    if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')) {
      return
    }

    if (securityStorage.isLockEnabled()) {
      const lastActive = securityStorage.getLastActiveTime()
      const timeout = securityStorage.getTimeout()

      if (!lastActive || (Date.now() - lastActive) >= timeout * 1000) {
        setIsLocked(true)
      }
    }
  }, [])

  // 3. Listen to App State Change (Native Capacitor) and Visibility Change (Web/PWA)
  useEffect(() => {
    if (typeof window === 'undefined') return

    let backgroundTime = 0

    // Capacitor Native Listener
    let nativeListener: any = null
    if (Capacitor.isNativePlatform()) {
      nativeListener = CapacitorApp.addListener('appStateChange', (state) => {
        const path = window.location.pathname
        if (path.startsWith('/login') || path.startsWith('/register')) return

        if (!state.isActive) {
          backgroundTime = Date.now()
        } else {
          if (securityStorage.isLockEnabled()) {
            const timeout = securityStorage.getTimeout()
            const elapsed = (Date.now() - backgroundTime) / 1000
            if (elapsed >= timeout) {
              setIsLocked(true)
              setPin('')
            }
          }
        }
      })
    }

    // Web / PWA Document Visibility Listener
    const handleVisibility = () => {
      const path = window.location.pathname
      if (path.startsWith('/login') || path.startsWith('/register')) return

      if (document.visibilityState === 'hidden') {
        backgroundTime = Date.now()
      } else if (document.visibilityState === 'visible') {
        if (securityStorage.isLockEnabled()) {
          const timeout = securityStorage.getTimeout()
          const elapsed = (Date.now() - backgroundTime) / 1000
          if (elapsed >= timeout) {
            setIsLocked(true)
            setPin('')
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (nativeListener && typeof nativeListener.remove === 'function') {
        nativeListener.remove()
      }
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // 4. Auto-trigger biometrics prompt when lock screen appears
  const triggerBiometrics = useCallback(async () => {
    if (!securityStorage.isBiometricsEnabled()) return

    const result = await authenticateBiometrics('Qarz Daftari ilovasini ochish')
    if (result.success) {
      playSuccessSound()
      setIsLocked(false)
      setPin('')
      setErrorMessage(null)
      securityStorage.recordActiveTime()
    }
  }, [])

  useEffect(() => {
    if (isLocked) {
      // Short delay so overlay renders smoothly first
      const timer = setTimeout(() => {
        triggerBiometrics()
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isLocked, triggerBiometrics])

  // 5. Handle PIN input & Reset State Machine
  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || isVerifyingCode) return
    await nativeHaptics.impact('light')

    const newPin = pin + digit
    setPin(newPin)
    setErrorMessage(null)

    if (newPin.length === 4) {
      // 1. Normal Lock Mode: Verify Current PIN
      if (lockMode === 'enter_pin') {
        const isValid = await securityStorage.verifyPin(newPin)
        if (isValid) {
          await nativeHaptics.notification('success')
          playSuccessSound()
          setIsLocked(false)
          setPin('')
          securityStorage.recordActiveTime()
        } else {
          await nativeHaptics.notification('error')
          setIsShaking(true)
          setErrorMessage("Noto'g'ri PIN kod")
          setTimeout(() => {
            setIsShaking(false)
            setPin('')
          }, 500)
        }
        return
      }

      // 2. Reset Step 1: Verify 4-digit code from Telegram
      if (lockMode === 'enter_reset_code') {
        setIsVerifyingCode(true)
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (typeof window !== 'undefined') {
            const phoneSession = localStorage.getItem('phone_user_session')
            if (phoneSession) headers['x-phone-session'] = phoneSession
          }

          const res = await fetch('/api/security/pin-reset', {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'verify_code', code: newPin }),
          })
          const data = await res.json()

          if (res.ok && data.success) {
            await nativeHaptics.notification('success')
            playSuccessSound()
            setLockMode('enter_new_pin')
            setPin('')
            setErrorMessage(null)
          } else {
            await nativeHaptics.notification('error')
            setIsShaking(true)
            setErrorMessage(data.message || "Noto'g'ri tasdiq kodi")
            setTimeout(() => {
              setIsShaking(false)
              setPin('')
            }, 500)
          }
        } catch {
          setErrorMessage("Tarmoq xatosi. Qaytadan urinib ko'ring")
          setTimeout(() => setPin(''), 500)
        } finally {
          setIsVerifyingCode(false)
        }
        return
      }

      // 3. Reset Step 2: Enter desired new PIN
      if (lockMode === 'enter_new_pin') {
        await nativeHaptics.impact('medium')
        setTempNewPin(newPin)
        setLockMode('confirm_new_pin')
        setPin('')
        setErrorMessage(null)
        return
      }

      // 4. Reset Step 3: Confirm desired new PIN
      if (lockMode === 'confirm_new_pin') {
        if (newPin === tempNewPin) {
          await securityStorage.savePin(newPin)

          try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (typeof window !== 'undefined') {
              const phoneSession = localStorage.getItem('phone_user_session')
              if (phoneSession) headers['x-phone-session'] = phoneSession
            }
            fetch('/api/security/pin-reset', {
              method: 'POST',
              headers,
              body: JSON.stringify({ action: 'save_new_pin' }),
            }).catch(() => {})
          } catch {}

          await nativeHaptics.notification('success')
          playSuccessSound()
          toast.success("Yangi PIN kod muvaffaqiyatli o'rnatildi! 🎉")
          setIsLocked(false)
          setLockMode('enter_pin')
          setPin('')
          setTempNewPin('')
          securityStorage.recordActiveTime()
        } else {
          await nativeHaptics.notification('error')
          setIsShaking(true)
          setErrorMessage("PIN kodlar mos kelmadi. Qaytadan kiriting")
          setTimeout(() => {
            setIsShaking(false)
            setPin('')
            setLockMode('enter_new_pin')
          }, 700)
        }
        return
      }
    }
  }

  const handleDelete = async () => {
    await nativeHaptics.impact('light')
    setPin((prev) => prev.slice(0, -1))
    setErrorMessage(null)
  }

  const handleRequestResetCode = async () => {
    setIsSendingCode(true)
    setErrorMessage(null)
    try {
      await nativeHaptics.impact('medium')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (typeof window !== 'undefined') {
        const phoneSession = localStorage.getItem('phone_user_session')
        if (phoneSession) headers['x-phone-session'] = phoneSession
      }

      const res = await fetch('/api/security/pin-reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'send_code' }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'NO_TELEGRAM') {
          toast.error("Telegram botingiz ulanmagan. Iltimos, hisobdan chiqib, telefon raqamingiz orqali kiring.")
          setErrorMessage("Telegram bot ulanmagan")
        } else {
          toast.error(data.message || "Kod yuborishda xatolik yuz berdi")
          setErrorMessage(data.message || "Xatolik yuz berdi")
        }
        return
      }

      toast.success("Telegram botingizga 4 xonali tasdiq kodi yuborildi! ✈️")
      playSuccessSound()
      setLockMode('enter_reset_code')
      setPin('')
      setErrorMessage(null)
    } catch {
      toast.error("Tarmoq xatosi. Qaytadan urinib ko'ring.")
      setErrorMessage("Tarmoq xatosi")
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleCancelReset = () => {
    setLockMode('enter_pin')
    setPin('')
    setTempNewPin('')
    setErrorMessage(null)
  }

  const handleLogout = async () => {
    await nativeHaptics.impact('light')
    toast.warning('Hisobdan chiqmoqchimisiz?', {
      description: "Qayta kirish uchun telefon raqamingiz orqali tasdiqlash lozim bo'ladi.",
      action: {
        label: 'Ha, chiqish',
        onClick: async () => {
          securityStorage.removePin()
          setIsLocked(false)
          try {
            await fetch('/api/auth/logout', { method: 'POST' })
          } catch {}
          window.location.href = '/login'
        },
      },
      cancel: {
        label: 'Bekor qilish',
        onClick: () => {},
      },
      duration: 8000,
    })
  }

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        lockApp: () => {
          setIsLocked(true)
          setLockMode('enter_pin')
          setPin('')
          setTempNewPin('')
          setErrorMessage(null)
        },
        unlockApp: () => {
          setIsLocked(false)
          setLockMode('enter_pin')
          setPin('')
          setTempNewPin('')
          setErrorMessage(null)
        },
      }}
    >
      {children}

      {/* FULL-SCREEN LOCK OVERLAY */}
      {isLocked && (
        <div className="fixed inset-0 z-[999999] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="w-full flex flex-col items-center text-center pt-8 sm:pt-12 space-y-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20 flex items-center justify-center transition-transform hover:scale-105">
              <Image
                src="/icons/icon-512x512.png"
                alt="Qarz Daftari"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Title & Subtitle based on lockMode */}
            {lockMode === 'enter_pin' && (
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Qarz Daftari
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ilovani ochish uchun 4 xonali PIN kodni kiriting
                </p>
              </div>
            )}

            {lockMode === 'enter_reset_code' && (
              <div className="space-y-1 animate-in fade-in">
                <h2 className="text-xl font-bold tracking-tight text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1.5">
                  <Send className="w-4 h-4" />
                  Telegram tasdiq kodi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Telegram botingizga yuborilgan 4 xonali tasdiq kodini kiriting
                </p>
              </div>
            )}

            {lockMode === 'enter_new_pin' && (
              <div className="space-y-1 animate-in fade-in">
                <h2 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  Yangi PIN kod
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  O&apos;zingiz xohlagan 4 xonali yangi PIN kodni kiriting
                </p>
              </div>
            )}

            {lockMode === 'confirm_new_pin' && (
              <div className="space-y-1 animate-in fade-in">
                <h2 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  PIN kodni tasdiqlang
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Xatolik yo&apos;qligini tekshirish uchun kodni qayta kiriting
                </p>
              </div>
            )}

            {/* 4 PIN / Code Dots */}
            <div
              className={`flex items-center justify-center gap-4 py-4 ${
                isShaking ? 'animate-bounce text-rose-500' : ''
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      errorMessage
                        ? 'bg-rose-500 ring-4 ring-rose-500/30'
                        : filled
                        ? lockMode === 'enter_reset_code'
                          ? 'bg-sky-500 scale-110 shadow-md shadow-sky-500/50'
                          : lockMode === 'enter_new_pin' || lockMode === 'confirm_new_pin'
                          ? 'bg-emerald-500 scale-110 shadow-md shadow-emerald-500/50'
                          : 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-md shadow-blue-500/50'
                        : 'border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60'
                    }`}
                  />
                )
              })}
            </div>

            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Number Pad (3x4) */}
          <div className="w-full max-w-xs grid grid-cols-3 gap-3.5 sm:gap-4 pb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num.toString())}
                disabled={isVerifyingCode}
                className="h-16 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-blue-600 active:text-white dark:active:bg-blue-600 dark:active:text-white border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-2xl flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row Left: Biometrics in lock mode or Cancel in reset mode */}
            {lockMode === 'enter_pin' ? (
              <button
                type="button"
                onClick={triggerBiometrics}
                disabled={!canUseBiometrics && !securityStorage.isBiometricsEnabled()}
                className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                title={biometricName}
              >
                <Fingerprint className="w-6 h-6" />
                <span className="text-[9px] font-semibold mt-0.5 text-slate-500 dark:text-slate-400 truncate max-w-[70px]">
                  {biometricName}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelReset}
                className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 flex flex-col items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Bekor qilish"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[9px] font-semibold mt-0.5">Bekor qilish</span>
              </button>
            )}

            {/* 0 */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={isVerifyingCode}
              className="h-16 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-blue-600 active:text-white dark:active:bg-blue-600 dark:active:text-white border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-2xl flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isVerifyingCode}
              className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Footer: Reset Actions / Logout */}
          {lockMode === 'enter_pin' ? (
            <div className="pb-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleRequestResetCode}
                disabled={isSendingCode}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kod yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>PIN kodni unutdingizmi?</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer py-1 px-2.5 rounded-lg"
              >
                <LogOut className="w-3 h-3" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          ) : (
            <div className="pb-4 flex items-center justify-center gap-4">
              {lockMode === 'enter_reset_code' && (
                <button
                  type="button"
                  onClick={handleRequestResetCode}
                  disabled={isSendingCode}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSendingCode ? 'animate-spin' : ''}`} />
                  <span>Kodni qayta yuborish</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCancelReset}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Bekor qilish</span>
              </button>
            </div>
          )}
        </div>
      )}
    </AppLockContext.Provider>
  )
}
