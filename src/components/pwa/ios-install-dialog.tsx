// src/components/pwa/ios-install-dialog.tsx
'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Share, PlusSquare, Smartphone, Check } from 'lucide-react'

interface IosInstallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IosInstallDialog({ open, onOpenChange }: IosInstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100">
        <DialogHeader className="text-left space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 shadow-xs">
            <Smartphone className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
            iPhone (iOS) ga o&apos;rnatish
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Qarz Daftari ilovasini iPhone bosh ekraniga qo&apos;shish uchun 3 ta oddiy qadam:
          </DialogDescription>
        </DialogHeader>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 pt-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                <span>Safari pastki panelida</span>
                <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded font-semibold text-[11px]">
                  <Share className="w-3.5 h-3.5 mr-1" />
                  Ulashish (Share)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">tugmasini bosing.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                <span>Menyuni pastga surib</span>
                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold text-[11px]">
                  <PlusSquare className="w-3.5 h-3.5 mr-1" />
                  Bosh ekranga qo&apos;shish
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                (Add to Home Screen) qatorini tanlang.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                O&apos;ng yuqori burchakdagi <span className="text-blue-600 dark:text-blue-400">&quot;Qo&apos;shish&quot; (Add)</span> tugmasini bosing.
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ilova belgisi telefoningiz bosh ekranida paydo bo&apos;ladi!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Tushundim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
