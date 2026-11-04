// src/components/payments/uzum-payment-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, ExternalLink, ShieldCheck, X, ArrowLeft } from 'lucide-react'
import { UzumBankLogo } from './payment-logos'
import { formatPrice } from '@/lib/constants/plans'

interface UzumPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentUrl: string | null
  amount: number
  planTitle?: string
  onSuccess?: () => void
  onBack?: () => void
}

export function UzumPaymentModal({
  open,
  onOpenChange,
  paymentUrl,
  amount,
  planTitle = 'Obuna to\'lovi',
  onSuccess,
  onBack,
}: UzumPaymentModalProps) {
  const [loading, setLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  // Reset states when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setLoading(true)
        setIsSuccess(false)
      }, 300)
    }
  }, [open])

  // Listen to Uzum Checkout postMessage events and our custom /payment/uzum-callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return

      console.log('🔔 [Uzum Modal postMessage]:', data)

      // 1. Message from our own /payment/uzum-callback
      if (data.source === 'uzum-callback') {
        if (data.status === 'SUCCESS') {
          setIsSuccess(true)
          setTimeout(() => {
            onSuccess?.()
          }, 1500)
        } else if (data.status === 'CANCEL' || data.action === 'close') {
          if (onBack) {
            onBack()
          } else {
            onOpenChange(false)
          }
        }
        return
      }

      // 2. Direct message from Uzum Bank checkout
      if (data.action === 'close' || data.status) {
        if (data.status === 'SUCCESS' || data.errorCode === 0) {
          setIsSuccess(true)
          setTimeout(() => {
            onSuccess?.()
          }, 1500)
        } else if (
          data.status === 'CANCEL' ||
          data.status === 'ERROR' ||
          data.action === 'close'
        ) {
          if (onBack) {
            onBack()
          } else {
            onOpenChange(false)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onOpenChange, onSuccess, onBack])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] w-[95vw] h-[670px] max-h-[90vh] p-0 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col [&>button.absolute]:hidden !overflow-visible">
        {/* Floating Top Bar (Back to options + Close button) */}
        <div className="absolute -top-11 left-1 right-1 z-50 flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold shadow-lg backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Boshqa usul</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold shadow-lg backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Yopish (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Yopish</span>
          </button>
        </div>

        {isSuccess ? (
          /* SUCCESS CELEBRATION VIEW */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-b from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20 rounded-3xl overflow-hidden">
            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <Badge
                variant="outline"
                className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 font-semibold px-3 py-1 text-xs"
              >
                To&apos;lov tasdiqlandi
              </Badge>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Muvaffaqiyatli to&apos;landi!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uzum Bank orqali{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatPrice(amount)}
                </span>{' '}
                miqdoridagi to&apos;lov muvaffaqiyatli amalga oshirildi.
              </p>
            </div>

            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <span>Tarif:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{planTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <span>To&apos;lovchi tizim:</span>
                <span className="font-semibold text-purple-700 dark:text-purple-400">Uzum Bank</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400">
                <span>Holat:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Faollashtirildi</span>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.01] cursor-pointer"
              onClick={() => {
                onOpenChange(false)
                window.location.reload()
              }}
            >
              Dashboardga o&apos;tish
            </Button>
          </div>
        ) : (
          /* EMBEDDED UZUM CHECKOUT IFRAME VIEW */
          <div className="relative flex-1 w-full h-full bg-white dark:bg-slate-900 flex flex-col rounded-3xl overflow-hidden">
            {/* Shimmering Loader while iframe is initializing */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 z-10 p-6 text-center space-y-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-purple-500/15 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 bg-purple-50 dark:bg-purple-950/60 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-center shadow-sm">
                    <UzumBankLogo className="h-10 w-auto" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Loader2 className="w-4 h-4 text-purple-700 dark:text-purple-400 animate-spin" />
                    <span>Uzum Bank xavfsiz to&apos;lov oynasi</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Sahifa tayyorlanmoqda, iltimos kuting...
                  </p>
                </div>

                <div className="w-44 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Embedded Uzum Checkout Form */}
            {paymentUrl ? (
              <iframe
                src={paymentUrl}
                title="Uzum Bank Checkout"
                className="w-full flex-1 border-0 bg-white dark:bg-slate-900"
                allow="payment; camera; clipboard-write"
                onLoad={() => setLoading(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">To&apos;lov havolasi yuklanmadi.</p>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
                  Yopish
                </Button>
              </div>
            )}

            {/* Micro bottom bar */}
            {paymentUrl && !loading && (
              <div className="h-10 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                  Uzum Bank 100% himoyalangan
                </span>
                <div className="flex items-center gap-3">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold hover:underline cursor-pointer transition-colors"
                    >
                      Boshqa usul
                    </button>
                  )}
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    Yangi oynada
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
