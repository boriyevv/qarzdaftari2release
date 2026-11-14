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
import { Fingerprint, Delete, Shield, Lock, LogOut } from 'lucide-react'

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

  // 5. Handle PIN input
  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return
    await nativeHaptics.impact('light')

    const newPin = pin + digit
    setPin(newPin)
    setErrorMessage(null)

    if (newPin.length === 4) {
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
    }
  }

  const handleDelete = async () => {
    await nativeHaptics.impact('light')
    setPin((prev) => prev.slice(0, -1))
    setErrorMessage(null)
  }

  const handleLogout = async () => {
    if (confirm("Hisobdan chiqmoqchimisiz? Qayta kirish uchun telefon raqamingiz orqali tasdiqlash lozim bo'ladi.")) {
      securityStorage.removePin()
      setIsLocked(false)
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      window.location.href = '/login'
    }
  }

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        lockApp: () => {
          setIsLocked(true)
          setPin('')
        },
        unlockApp: () => {
          setIsLocked(false)
          setPin('')
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

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Qarz Daftari
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ilovani ochish uchun 4 xonali PIN kodni kiriting
              </p>
            </div>

            {/* 4 PIN Dots */}
            <div className={`flex items-center justify-center gap-4 py-4 ${isShaking ? 'animate-bounce text-rose-500' : ''}`}>
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      errorMessage
                        ? 'bg-rose-500 ring-4 ring-rose-500/30'
                        : filled
                        ? 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-md shadow-blue-500/50'
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
                className="h-16 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-blue-600 active:text-white dark:active:bg-blue-600 dark:active:text-white border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-2xl flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row: Biometrics or Empty */}
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

            {/* 0 */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-16 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-blue-600 active:text-white dark:active:bg-blue-600 dark:active:text-white border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-2xl flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              0
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Footer: Forgot PIN / Logout */}
          <div className="pb-4">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer py-2 px-3 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>PIN kodni unutdingizmi? Hisobdan chiqish</span>
            </button>
          </div>
        </div>
      )}
    </AppLockContext.Provider>
  )
}
