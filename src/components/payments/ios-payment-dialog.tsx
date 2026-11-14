// src/components/payments/ios-payment-dialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Globe, ShieldCheck } from 'lucide-react'
import { openExternalUrl } from '@/lib/native'

interface IosPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUrl?: string
  title?: string
  description?: string
}

export function IosPaymentDialog({
  open,
  onOpenChange,
  targetUrl = 'https://debtbook.uz/pricing',
  title = "To'lov xizmati haqida ma'lumot",
  description = "Apple App Store qoidalariga muvofiq, B2B korporativ tarif rejalari va xizmatlar uchun to'lovlar rasmiy veb-saytimiz orqali xavfsiz amalga oshiriladi.",
}: IosPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-200 dark:border-slate-800">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
            <Globe className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Click, Payme va Uzum Bank orqali xavfsiz to&apos;lov</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>To&apos;lovdan so&apos;ng mobil ilovangizda imkoniyatlar bir zumda faollashadi</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl text-xs"
          >
            Yopish
          </Button>
          <Button
            type="button"
            onClick={() => {
              openExternalUrl(targetUrl)
              onOpenChange(false)
            }}
            className="w-full sm:w-auto rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Veb-saytda to&apos;lash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
