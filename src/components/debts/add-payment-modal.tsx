// src/components/debts/add-payment-modal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  formatCurrency,
  formatAmountInput,
  parseAmountInput,
  numberToUzbekWords,
} from '@/lib/utils/currency'
import { playSuccessSound } from '@/lib/sounds'
import { nativeHaptics } from '@/lib/native'
import { MessageSquare, CheckCircle2, RotateCcw } from 'lucide-react'

interface Debt {
  id: string
  debtor_name: string
  debtor_phone?: string
  amount: number
  paid_amount: number
}

interface AddPaymentModalProps {
  debt: Debt
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PAYMENT_QUICK_CHIPS = [
  { label: '+10 000', value: 10000 },
  { label: '+50 000', value: 50000 },
  { label: '+100 000', value: 100000 },
  { label: '+500 000', value: 500000 },
]

export function AddPaymentModal({ debt, open, onOpenChange, onSuccess }: AddPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendSMS, setSendSMS] = useState(true)
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const remaining = Math.max(0, debt.amount - debt.paid_amount)

  const handleAddChipAmount = (addVal: number) => {
    const current = parseAmountInput(formData.amount)
    const next = Math.min(remaining, current + addVal)
    setFormData((prev) => ({ ...prev, amount: formatAmountInput(String(next)) }))
    nativeHaptics.impact('light').catch(() => {})
  }

  const handleFullSettlement = () => {
    setFormData((prev) => ({ ...prev, amount: formatAmountInput(String(remaining)) }))
    nativeHaptics.impact('medium').catch(() => {})
  }

  const handleClearAmount = () => {
    setFormData((prev) => ({ ...prev, amount: '' }))
    nativeHaptics.impact('light').catch(() => {})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const amount = parseAmountInput(formData.amount)

    if (amount <= 0) {
      setError("To'lov summasi 0 dan katta bo'lishi kerak")
      setLoading(false)
      return
    }

    if (amount > remaining) {
      setError(`To'lov summasi qoldiqdan oshib ketdi. Qoldiq: ${formatCurrency(remaining)}`)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debt_id: debt.id,
          amount,
          payment_date: formData.payment_date,
          note: formData.note || undefined,
          send_confirmation_sms: sendSMS && !!debt.debtor_phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato yuz berdi')
        return
      }

      playSuccessSound()
      nativeHaptics.notification('success').catch(() => {})

      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: '',
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            To&apos;lov Qo&apos;shish
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {debt.debtor_name} — Jami: {formatCurrency(debt.amount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Balance breakdown */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-3.5 text-xs">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Jami qarz:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(debt.amount)}
              </span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">To&apos;langan:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(debt.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-200/70 dark:border-blue-900/50 font-bold">
              <span className="text-slate-800 dark:text-slate-200">Qoldiq:</span>
              <span className="text-orange-600 dark:text-orange-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Amount input & quick chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To&apos;lov summasi (so&apos;m) <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={handleFullSettlement}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>To&apos;liq yopish</span>
                  </button>
                )}
                {parseAmountInput(formData.amount) > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tozalash</span>
                  </button>
                )}
              </div>
            </div>

            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="500 000"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: formatAmountInput(e.target.value) })}
              disabled={loading}
              className="rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-base tracking-wide"
            />

            {/* Quick amount chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {PAYMENT_QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => handleAddChipAmount(chip.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={handleFullSettlement}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 active:scale-95 transition-all cursor-pointer"
                >
                  Hammasi: {formatCurrency(remaining)}
                </button>
              )}
            </div>

            {/* Live readable amount in words */}
            {parseAmountInput(formData.amount) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in duration-150">
                <span className="text-blue-500 shrink-0">💎</span>
                <span className="truncate">{numberToUzbekWords(parseAmountInput(formData.amount))}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To&apos;lov sanasi
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Izoh (ixtiyoriy)
            </Label>
            <Textarea
              id="note"
              placeholder="Qo'shimcha ma'lumot..."
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Automatic SMS Confirmation Toggle */}
          {debt.debtor_phone && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={sendSMS}
                onChange={(e) => setSendSMS(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Mijozga SMS tasdiqnoma yuborish
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  &quot;To&apos;lovingiz qabul qilindi. Qoldiq: ...&quot; xushmuomala xabari
                </span>
              </div>
            </label>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Yuklanmoqda...' : 'To\'lovni Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
