// src/app/offline/page.tsx
'use client'

import React from 'react'
import { WifiOff, RotateCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-8 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <WifiOff className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Internet aloqasi yo&apos;q
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Qarz Daftari bilan ishlash uchun internet ulanishi zarur. Iltimos, Wi-Fi yoki mobil aloqa tarmog&apos;ini tekshirib, qayta urinib ko&apos;ring.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>💡 Foydali maslahat:</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Agar ilovani telefoningizga o&apos;rnatib olgan bo&apos;lsangiz, avval ochilgan sahifalar kesh xotirada saqlanadi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            type="button"
            onClick={handleReload}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            Qayta yuklash
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
