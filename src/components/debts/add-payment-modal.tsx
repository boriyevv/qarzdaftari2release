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
import { formatCurrency } from '@/lib/utils/currency'
import { playSuccessSound } from '@/lib/sounds'

interface Debt {
  id: string
  debtor_name: string
  amount: number
  paid_amount: number
}

interface AddPaymentModalProps {
  debt: Debt
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddPaymentModal({ debt, open, onOpenChange, onSuccess }: AddPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const remaining = debt.amount - debt.paid_amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const amount = parseFloat(formData.amount)

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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato yuz berdi')
        return
      }

      // Celebratory audio chime
      playSuccessSound()

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

          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-3.5 text-xs">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Jami qarz:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(debt.amount)}</span>
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

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To&apos;lov summasi (so&apos;m) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="500000"
              required
              min="1"
              max={remaining}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100"
            />
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
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Izoh (ixtiyoriy)
            </Label>
            <Textarea
              id="note"
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100"
            />
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Yuklanmoqda...' : 'To\'lovni Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
