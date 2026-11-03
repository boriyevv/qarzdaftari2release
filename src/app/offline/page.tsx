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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <WifiOff className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Internet aloqasi yo&apos;q
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qarz Daftari bilan ishlash uchun internet ulanishi zarur. Iltimos, Wi-Fi yoki mobil aloqa tarmog&apos;ini tekshirib, qayta urinib ko&apos;ring.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1.5 text-xs text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>💡 Foydali maslahat:</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
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
            className="flex-1 h-11 rounded-xl text-xs font-bold text-slate-700"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
