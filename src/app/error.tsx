// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('⚠️ Root error boundary caught an unhandled exception:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Kutilmagan xatolik yuz berdi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Dasturda vaqtinchalik nosozlik kuzatildi. Ma&apos;lumotlaringiz xavfsiz saqlanmoqda.
            Quyidagi tugma orqali sahifani qayta ishga tushirishingiz mumkin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1 rounded-2xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            Bosh sahifa
          </Button>
          <Button
            type="button"
            onClick={() => reset()}
            className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Qayta urinish
          </Button>
        </div>
      </div>
    </div>
  )
}
