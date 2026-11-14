///components/debts/edit-debt-modal.tsx
'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatFullPhoneInput } from '@/lib/utils/phone'
import { formatAmountInput, parseAmountInput, numberToUzbekWords } from '@/lib/utils/currency'

interface Debt {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  due_date: string | null
  note?: string
  folder: {
    id: string
    name: string
  } | null
}

interface EditDebtModalProps {
  debt: Debt
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Folder {
  id: string
  name: string
  color: string
}

export function EditDebtModal({ debt, open, onOpenChange, onSuccess }: EditDebtModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [formData, setFormData] = useState({
    debtor_name: debt.debtor_name,
    debtor_phone: debt.debtor_phone,
    amount: debt.amount.toString(),
    due_date: debt.due_date || '',
    folder_id: debt.folder?.id || '',
    note: debt.note || '',
  })

  useEffect(() => {
    if (open) {
      fetchFolders()
      setFormData({
        debtor_name: debt.debtor_name,
        debtor_phone: formatFullPhoneInput(debt.debtor_phone),
        amount: formatAmountInput(debt.amount),
        due_date: debt.due_date || '',
        folder_id: debt.folder?.id || '',
        note: debt.note || '',
      })
    }
  }, [open, debt])

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders')
      const data = await response.json()
      if (response.ok) {
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Folders fetch error:', error)
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatFullPhoneInput(value)
    setFormData({ ...formData, debtor_phone: formatted })
  }

  const addAmount = (addVal: number) => {
    const current = parseAmountInput(formData.amount)
    setFormData({ ...formData, amount: formatAmountInput(current + addVal) })
  }

  const addDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setFormData({ ...formData, due_date: d.toISOString().split('T')[0] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const rawDigits = formData.debtor_phone.replace(/\D/g, '')
      let fullPhone = ''
      if (rawDigits.length > 0) {
        fullPhone = rawDigits.startsWith('998') ? `+${rawDigits}` : `+998${rawDigits}`
      }
      const numAmount = parseAmountInput(formData.amount)

      if (numAmount <= 0) {
        setError("Qarz summasi 0 dan katta bo'lishi kerak")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/debts/${debt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtor_name: formData.debtor_name.trim(),
          debtor_phone: fullPhone || undefined,
          amount: numAmount,
          due_date: formData.due_date || null,
          folder_id: formData.folder_id || null,
          note: formData.note || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato yuz berdi')
        return
      }

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
      <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Qarzni Tahrirlash
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Qarz ma&apos;lumotlarini o&apos;zgartiring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit_debtor_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To&apos;liq ism <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit_debtor_name"
              placeholder="Ali Valiyev"
              required
              value={formData.debtor_name}
              onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="edit_debtor_phone" className="font-semibold text-slate-700 dark:text-slate-300">
                Telefon raqam <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </Label>
              {formData.debtor_phone && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, debtor_phone: '' })}
                  className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  O&apos;chirish
                </button>
              )}
            </div>
            <Input
              id="edit_debtor_phone"
              type="tel"
              placeholder="+998 (90) 123-45-67"
              value={formData.debtor_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tracking-wide font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="edit_amount" className="font-semibold text-slate-700 dark:text-slate-300">
                Qarz summasi (so&apos;m) <span className="text-red-500">*</span>
              </Label>
              {parseAmountInput(formData.amount) > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: '' })}
                  className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Tozalash
                </button>
              )}
            </div>
            <Input
              id="edit_amount"
              type="text"
              inputMode="numeric"
              placeholder="1 000 000"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: formatAmountInput(e.target.value) })}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold tracking-wide"
            />
            {parseAmountInput(formData.amount) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in duration-200">
                <span className="text-blue-500 shrink-0">💎</span>
                <span className="truncate">{numberToUzbekWords(parseAmountInput(formData.amount))}</span>
              </div>
            )}

            {/* Tezkor qo'shish chiplari */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addAmount(amt)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer active:scale-95"
                >
                  +{amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="edit_due_date" className="font-semibold text-slate-700 dark:text-slate-300">
                Qaytarish muddati
              </Label>
              {formData.due_date && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, due_date: '' })}
                  className="text-slate-400 hover:text-rose-500 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Muddatni o&apos;chirish
                </button>
              )}
            </div>
            <Input
              id="edit_due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              disabled={loading}
              className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            {/* Tezkor sana chiplari */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[
                { label: '+3 kun', days: 3 },
                { label: '1 hafta', days: 7 },
                { label: '2 hafta', days: 14 },
                { label: '1 oy', days: 30 },
              ].map((chip) => (
                <button
                  key={chip.days}
                  type="button"
                  onClick={() => addDays(chip.days)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_folder_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Folder
            </Label>
            <Select
              value={formData.folder_id}
              onValueChange={(value) => setFormData({ ...formData, folder_id: value })}
              disabled={loading}
            >
              <SelectTrigger className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Folder tanlang" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id} className="cursor-pointer dark:focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_note" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Izoh
            </Label>
            <Textarea
              id="edit_note"
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Yuklanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}