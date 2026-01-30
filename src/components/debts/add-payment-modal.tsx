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

      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: '',
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>To'lov Qo'shish</DialogTitle>
          <DialogDescription>
            {debt.debtor_name} - {formatCurrency(debt.amount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Jami qarz:</span>
              <span className="font-medium">{formatCurrency(debt.amount)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">To'langan:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(debt.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-200">
              <span className="font-medium">Qoldiq:</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              To'lov summasi (so'm) <span className="text-red-500">*</span>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">To'lov sanasi</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Izoh</Label>
            <Textarea
              id="note"
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'To\'lov Qo\'shish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}