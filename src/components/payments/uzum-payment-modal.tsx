// src/components/payments/uzum-payment-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { UzumBankLogo } from './payment-logos'
import { formatPrice } from '@/lib/constants/plans'

interface UzumPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentUrl: string | null
  amount: number
  planTitle?: string
  onSuccess?: () => void
}

export function UzumPaymentModal({
  open,
  onOpenChange,
  paymentUrl,
  amount,
  planTitle = 'Obuna to\'lovi',
  onSuccess,
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

  // Listen to Uzum Checkout window.postMessage events:
  // Payload: { status: 'SUCCESS' | 'CANCEL' | 'ERROR', action: 'close', payment_id?: string, errorCode?: number }
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || ''
      const isUzumOrigin =
        origin.includes('uzumbank.uz') ||
        origin.includes('uzumcheckout.uz') ||
        origin.includes('checkout.uzum.uz')

      if (!isUzumOrigin && typeof event.data !== 'object') return

      const data = event.data
      if (!data) return

      console.log('🔔 [Uzum Checkout postMessage]:', data)

      if (data.action === 'close' || data.status) {
        if (data.status === 'SUCCESS' || data.errorCode === 0) {
          setIsSuccess(true)
          setTimeout(() => {
            onSuccess?.()
          }, 1500)
        } else if (data.status === 'CANCEL' || data.status === 'ERROR' || data.action === 'close') {
          onOpenChange(false)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] w-[95vw] h-[670px] max-h-[90vh] p-0 rounded-3xl border border-slate-200/80 shadow-2xl bg-white flex flex-col [&>button.absolute]:hidden !overflow-visible">
        {/* Floating Close Button Above Modal Card - NEVER overlaps iframe elements */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute -top-11 right-1 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold shadow-lg backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Yopish (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Yopish</span>
        </button>

        {isSuccess ? (
          /* SUCCESS CELEBRATION VIEW */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-b from-white to-purple-50/40 rounded-3xl overflow-hidden">
            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold px-3 py-1 text-xs">
                To&apos;lov tasdiqlandi
              </Badge>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Muvaffaqiyatli to&apos;landi!
              </h3>
              <p className="text-xs text-slate-500">
                Uzum Bank orqali <span className="font-semibold text-slate-800">{formatPrice(amount)}</span> miqdoridagi to&apos;lov muvaffaqiyatli amalga oshirildi.
              </p>
            </div>

            <div className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Tarif:</span>
                <span className="font-semibold text-slate-800">{planTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>To&apos;lovchi tizim:</span>
                <span className="font-semibold text-purple-700">Uzum Bank</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500">
                <span>Holat:</span>
                <span className="font-semibold text-emerald-600">Faollashtirildi</span>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.01]"
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
          <div className="relative flex-1 w-full h-full bg-white flex flex-col rounded-3xl overflow-hidden">
            {/* Shimmering Loader while iframe is initializing */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center space-y-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-purple-500/15 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 bg-purple-50 rounded-2xl border border-purple-200/80 flex items-center justify-center shadow-sm">
                    <UzumBankLogo className="h-10 w-auto" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-800">
                    <Loader2 className="w-4 h-4 text-purple-700 animate-spin" />
                    <span>Uzum Bank xavfsiz to&apos;lov oynasi</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sahifa tayyorlanmoqda, iltimos kuting...
                  </p>
                </div>

                <div className="w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Embedded Uzum Checkout Form - clean edge to edge */}
            {paymentUrl ? (
              <iframe
                src={paymentUrl}
                title="Uzum Bank Checkout"
                className="w-full flex-1 border-0 bg-white"
                allow="payment; camera; clipboard-write"
                onLoad={() => setLoading(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">To&apos;lov havolasi yuklanmadi.</p>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Yopish
                </Button>
              </div>
            )}

            {/* Micro bottom bar for troubleshooting & cancel */}
            {paymentUrl && !loading && (
              <div className="h-10 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  Uzum Bank 100% himoyalangan
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:text-purple-800 font-medium flex items-center gap-1 hover:underline"
                  >
                    Yangi oynada
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="text-slate-400 hover:text-slate-600 font-medium hover:underline"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
