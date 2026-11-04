// src/app/payment/uzum-callback/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function UzumCallbackContent() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status')
  const isSuccess = statusParam === 'success' || statusParam === 'SUCCESS'
  const isCancel =
    statusParam === 'cancel' ||
    statusParam === 'CANCEL' ||
    statusParam === 'failed' ||
    statusParam === 'FAILED'

  const [notified, setNotified] = useState(false)

  useEffect(() => {
    // Notify parent window (the modal iframe container)
    try {
      const payload = {
        source: 'uzum-callback',
        status: isSuccess ? 'SUCCESS' : 'CANCEL',
        action: isSuccess ? 'success' : 'close',
      }

      console.log('📤 [Uzum Callback] Sending postMessage to parent:', payload)

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*')
      }

      if (window.top && window.top !== window) {
        window.top.postMessage(payload, '*')
      }

      setNotified(true)
    } catch (e) {
      console.error('Failed to notify parent window:', e)
    }

    // If opened directly (not in iframe), redirect after 1.5s
    if (window.self === window.top) {
      const timer = setTimeout(() => {
        window.location.href = isSuccess
          ? '/dashboard?payment=success'
          : '/pricing'
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, isCancel])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
      <div className="max-w-xs w-full text-center space-y-4">
        {isSuccess ? (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">To&apos;lov qabul qilindi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ilova yangilanmoqda, iltimos kuting...</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">To&apos;lov bekor qilindi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Oyna yopilmoqda...</p>
            </div>
          </>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    </div>
  )
}

export default function UzumCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      }
    >
      <UzumCallbackContent />
    </Suspense>
  )
}
