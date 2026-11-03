// src/components/pwa/pwa-install-banner.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, X, Smartphone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IosInstallDialog } from './ios-install-dialog'

// Global event to allow any button (e.g. Sidebar / Header) to trigger installation prompt
export function triggerPwaInstallPrompt() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('qd-open-pwa-install'))
  }
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true) // default true until verified
  const [isIos, setIsIos] = useState(false)
  const [showIosDialog, setShowIosDialog] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if running in standalone mode (already installed as PWA)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standaloneMode)

    if (standaloneMode) return

    // 2. Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isAppleDevice)

    // 3. Check dismissal memory (7 days)
    const dismissedAt = localStorage.getItem('qd_pwa_dismissed_at')
    if (dismissedAt) {
      const diffMs = Date.now() - parseInt(dismissedAt, 10)
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays < 7) {
        setIsDismissed(true)
      } else {
        setIsDismissed(false)
      }
    } else {
      setIsDismissed(false)
    }

    // 4. Capture native beforeinstallprompt (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 5. Global trigger listener (when user clicks "Ilovani o'rnatish" in Sidebar)
    const handleExternalTrigger = () => {
      if (isAppleDevice) {
        setShowIosDialog(true)
      } else if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setDeferredPrompt(null)
            setShowBanner(false)
          }
        })
      } else {
        // Fallback info for desktop/unsupported browser
        setShowIosDialog(true)
      }
    }

    window.addEventListener('qd-open-pwa-install', handleExternalTrigger)

    // On iOS Safari, show banner after 3 seconds if not dismissed
    if (isAppleDevice && !standaloneMode) {
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('qd-open-pwa-install', handleExternalTrigger)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosDialog(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowBanner(false)
      }
    } else {
      setShowIosDialog(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('qd_pwa_dismissed_at', Date.now().toString())
  }

  if (isStandalone) return null
  if (!showBanner || isDismissed) {
    return <IosInstallDialog open={showIosDialog} onOpenChange={setShowIosDialog} />
  }

  return (
    <>
      {/* Floating Bottom Banner */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9000] animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="p-4 rounded-3xl bg-slate-950/95 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3.5">
          {/* App Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight">
                  Qarz Daftari ilovasi
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Telefoningizga o&apos;rnatib, tezkor kiring
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              O&apos;rnatish
            </Button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Keyinroq"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal */}
      <IosInstallDialog open={showIosDialog} onOpenChange={setShowIosDialog} />
    </>
  )
}
