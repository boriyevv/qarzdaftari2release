// src/components/pwa/offline-indicator.tsx
'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Check initial state
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      {isOffline ? (
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500/95 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-amber-400">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Internet aloqasi yo&apos;q — Internetsiz rejim</span>
        </div>
      ) : (
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-600/95 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-emerald-500 animate-out fade-out">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Internet aloqasi tiklandi!</span>
        </div>
      )}
    </div>
  )
}
