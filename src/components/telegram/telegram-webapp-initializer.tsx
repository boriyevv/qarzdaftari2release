// src/components/telegram/telegram-webapp-initializer.tsx
'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        close: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        enableClosingConfirmation: () => void
        initDataUnsafe?: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
      }
    }
  }
}

export function TelegramWebAppInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tg = window.Telegram?.WebApp
    if (tg) {
      try {
        tg.ready()
        tg.expand()
        // Match dark slate header
        tg.setHeaderColor?.('#0f172a')
        tg.setBackgroundColor?.('#0f172a')
      } catch (err) {
        console.warn('Telegram WebApp init error:', err)
      }
    }
  }, [])

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          try {
            window.Telegram.WebApp.ready()
            window.Telegram.WebApp.expand()
          } catch {}
        }
      }}
    />
  )
}
