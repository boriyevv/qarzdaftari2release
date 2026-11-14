// src/components/debts/auto-reminders-modal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, CheckCircle2, AlertTriangle, Clock, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { playSuccessSound } from '@/lib/sounds'

interface EligibleDebt {
  id: string
  debtor_name: string
  debtor_phone: string
  remaining: number
  due_date: string
  diff_days: number
  is_overdue: boolean
  already_sent_recently: boolean
  message_preview: string
}

interface AutoRemindersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AutoRemindersModal({ open, onOpenChange, onSuccess }: AutoRemindersModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [debts, setDebts] = useState<EligibleDebt[]>([])
  const [remainingCredits, setRemainingCredits] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchEligibleDebts()
      setResultMessage(null)
    }
  }, [open])

  const fetchEligibleDebts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/debts/auto-reminders')
      const data = await res.json()
      if (res.ok) {
        setDebts(data.eligibleDebts || [])
        setRemainingCredits(data.remainingCredits || 0)
        // Auto select those that haven't been sent recently
        const defaultSelected = new Set<string>()
        data.eligibleDebts?.forEach((d: EligibleDebt) => {
          if (!d.already_sent_recently) {
            defaultSelected.add(d.id)
          }
        })
        setSelectedIds(defaultSelected)
      }
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === debts.filter(d => !d.already_sent_recently).length) {
      setSelectedIds(new Set())
    } else {
      const all = new Set<string>()
      debts.forEach(d => {
        if (!d.already_sent_recently) all.add(d.id)
      })
      setSelectedIds(all)
    }
  }

  const handleSendReminders = async () => {
    if (selectedIds.size === 0) return
    setSending(true)
    try {
      const res = await fetch('/api/debts/auto-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debt_ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (res.ok) {
        playSuccessSound()
        setResultMessage(data.message || `${data.sentCount} ta eslatma muvaffaqiyatli yuborildi!`)
        onSuccess?.()
        toast.success(data.message || `${data.sentCount} ta eslatma muvaffaqiyatli yuborildi!`)
        setTimeout(() => {
          fetchEligibleDebts()
        }, 1500)
      } else {
        toast.error(data.error || 'Eslatmalarni yuborishda xato yuz berdi')
      }
    } catch (err) {
      console.error(err)
      toast.error('Tarmoq xatosi')
    } finally {
      setSending(false)
    }
  }

  const sendableDebts = debts.filter(d => !d.already_sent_recently)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
            Aqlli Avtomatik Eslatmalar (Avtopilot)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            To&apos;lov muddati 3 kun ichida tugaydigan yoki muddati o&apos;tgan qarzdorlarga eslatma yuborish
          </DialogDescription>
        </DialogHeader>

        {/* Info header bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              Eslatish kerak: <span className="font-bold">{sendableDebts.length} ta mijoz</span>
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-mono">
            Mavjud kreditlar: <span className="font-bold text-blue-600 dark:text-blue-400">{remainingCredits} ta</span>
          </div>
        </div>

        {/* Success Alert */}
        {resultMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Debtors List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Muddati yaqinlashgan qarzlar tekshirilmoqda...</span>
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ajoyib! Yaqin 3 kunda to&apos;lanishi kerak bo&apos;lgan yoki kechiktirilgan qarzlar yo&apos;q.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Barcha mijozlaringiz to&apos;lov muddatlariga rioya qilmoqda.
              </p>
            </div>
          ) : (
            debts.map((debt) => (
              <div
                key={debt.id}
                onClick={() => !debt.already_sent_recently && toggleSelect(debt.id)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  debt.already_sent_recently
                    ? 'opacity-50 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : selectedIds.has(debt.id)
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-2xs cursor-pointer'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      disabled={debt.already_sent_recently}
                      checked={selectedIds.has(debt.id)}
                      onChange={() => toggleSelect(debt.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {debt.debtor_name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {debt.debtor_phone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                        &quot;{debt.message_preview}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs font-mono text-orange-600 dark:text-orange-400 block">
                      {formatCurrency(debt.remaining)}
                    </span>
                    <Badge
                      className={`text-[9px] px-1.5 py-0 mt-0.5 ${
                        debt.already_sent_recently
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          : debt.is_overdue
                          ? 'bg-rose-600 text-white'
                          : debt.diff_days === 0
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {debt.already_sent_recently
                        ? 'Yaqinda yuborildi'
                        : debt.is_overdue
                        ? `${Math.abs(debt.diff_days)} kun kechikdi`
                        : debt.diff_days === 0
                        ? 'Bugun muddati'
                        : `${debt.diff_days} kun qoldi`}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {debts.length > 0 && (
          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between w-full">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {selectedIds.size === sendableDebts.length
                ? 'Tanlovni bekor qilish'
                : 'Barchasini tanlash'}
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                Yopish
              </Button>
              <Button
                type="button"
                onClick={handleSendReminders}
                disabled={sending || selectedIds.size === 0 || remainingCredits < selectedIds.size}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {selectedIds.size} ta eslatma yuborish
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
