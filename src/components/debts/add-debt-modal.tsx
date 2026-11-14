// src/components/debts/add-debt-modal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  MessageSquare,
  AlertCircle,
  ExternalLink,
  X,
  Contact,
  UserCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { playPingSound } from '@/lib/sounds'
import { useUser } from '@/lib/contexts/user-context'
import { nativeContacts, nativeHaptics } from '@/lib/native'
import { toast } from 'sonner'
import { formatPhoneDigits } from '@/lib/utils/phone'
import {
  formatAmountInput,
  parseAmountInput,
  numberToUzbekWords,
  formatCurrency,
} from '@/lib/utils/currency'
import { enqueueOfflineDebt } from '@/lib/services/offline-debts.service'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

interface DebtorSuggestion {
  name: string
  phone: string
  totalDebt: number
  totalRemaining: number
  activeDebtsCount: number
}

interface AddDebtModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  folderId?: string | null
}

const QUICK_AMOUNT_CHIPS = [
  { label: '+10 000', value: 10000 },
  { label: '+50 000', value: 50000 },
  { label: '+100 000', value: 100000 },
  { label: '+500 000', value: 50000 },
  { label: '+1 000 000', value: 1000000 },
]

export function AddDebtModal({ open, onOpenChange, onSuccess, folderId }: AddDebtModalProps) {
  const { user } = useUser()
  const amountInputRef = useRef<HTMLInputElement>(null)
  const nameContainerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [sendSMS, setSendSMS] = useState(false)
  const [useCustomMessage, setUseCustomMessage] = useState(false)
  const [smsCredits, setSmsCredits] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [supportsContacts, setSupportsContacts] = useState(false)

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<DebtorSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedDebtorBadge, setSelectedDebtorBadge] = useState<{
    name: string
    remaining: number
  } | null>(null)

  const [formData, setFormData] = useState({
    debtor_name: '',
    debtor_phone: '',
    amount: '',
    due_date: '',
    note: '',
    shop_name: '',
    custom_sms_message: '',
  })

  useEffect(() => {
    setSupportsContacts(nativeContacts.isSupported())
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        debtor_name: '',
        debtor_phone: '',
        amount: '',
        due_date: '',
        note: '',
        shop_name: user?.store_name || '',
        custom_sms_message: '',
      })
      setSendSMS(false)
      setUseCustomMessage(false)
      setErrorMessage(null)
      setSelectedDebtorBadge(null)
      setShowSuggestions(false)
      fetchSMSCredits()
    }
  }, [open, user?.store_name])

  // Debounced search for existing debtors
  useEffect(() => {
    const q = formData.debtor_name.trim()
    if (!open || q.length < 1 || selectedDebtorBadge) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/debtors/suggest?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        }
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [formData.debtor_name, open, selectedDebtorBadge])

  const fetchSMSCredits = async () => {
    try {
      const response = await fetch('/api/sms-credits')
      const data = await response.json()
      if (response.ok) {
        setSmsCredits(data.remaining_credits || 0)
      }
    } catch {
      setSmsCredits(0)
    }
  }

  const handlePickContact = async () => {
    try {
      const picked = await nativeContacts.pick()
      if (picked) {
        const raw = picked.phone.replace(/\D/g, '').slice(-9)
        const formatted = formatPhoneDigits(raw)
        setFormData((prev) => ({
          ...prev,
          debtor_name: picked.name || prev.debtor_name,
          debtor_phone: formatted || prev.debtor_phone,
        }))
        toast.success(`Kontakt tanlandi: ${picked.name}`)
        nativeHaptics.notification('success').catch(() => {})
      }
    } catch (err: unknown) {
      console.warn('Contact picker error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Kontakt yuklashda xatolik: ${msg}`)
    }
  }

  const handleSelectSuggestion = (sug: DebtorSuggestion) => {
    const raw = (sug.phone || '').replace(/\D/g, '').slice(-9)
    const formatted = raw ? formatPhoneDigits(raw) : ''

    setFormData((prev) => ({
      ...prev,
      debtor_name: sug.name,
      debtor_phone: formatted,
    }))

    setSelectedDebtorBadge({
      name: sug.name,
      remaining: sug.totalRemaining,
    })

    setShowSuggestions(false)
    nativeHaptics.impact('light').catch(() => {})

    // Auto-focus amount input for ultra-fast data entry
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 50)
  }

  // Quick amount chip handlers
  const handleAddChipAmount = (addVal: number) => {
    const current = parseAmountInput(formData.amount)
    const next = current + addVal
    setFormData((prev) => ({ ...prev, amount: formatAmountInput(String(next)) }))
    nativeHaptics.impact('light').catch(() => {})
  }

  const handleClearAmount = () => {
    setFormData((prev) => ({ ...prev, amount: '' }))
    nativeHaptics.impact('light').catch(() => {})
    amountInputRef.current?.focus()
  }

  const generateDefaultMessage = () => {
    const { debtor_name, amount, due_date, shop_name } = formData
    const numAmount = parseAmountInput(amount)
    if (!debtor_name || numAmount <= 0) return "Ma'lumotlarni to'ldiring..."
    const formattedAmount = formatCurrency(numAmount)
    const shopText = shop_name ? ` "${shop_name}"` : ''
    const dueDateText = due_date
      ? ` To'lov muddati: ${new Date(due_date).toLocaleDateString('uz-UZ')}.`
      : ''
    return `Hurmatli ${debtor_name}, Siz${shopText}dan ${formattedAmount} qarz oldingiz.${dueDateText} Qarz Daftari.`
  }

  const rawPhone = formData.debtor_phone.replace(/\D/g, '')
  const hasPhone = rawPhone.length === 9
  const numAmount = parseAmountInput(formData.amount)

  const canSubmit = () => {
    if (!formData.debtor_name.trim() || formData.debtor_name.trim().length < 2) return false
    if (numAmount <= 0) return false
    // If phone is provided, it must be complete (9 digits)
    if (rawPhone.length > 0 && rawPhone.length < 9) return false
    // If SMS is requested, phone and credits are required
    if (sendSMS && (!hasPhone || smsCredits === 0)) return false
    if (sendSMS && useCustomMessage && !formData.custom_sms_message.trim()) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!canSubmit()) return
    setLoading(true)

    try {
      const fullPhone = hasPhone ? `+998${rawPhone}` : ''
      const debtPayload: Record<string, unknown> = {
        debtor_name: formData.debtor_name.trim(),
        debtor_phone: fullPhone,
        amount: numAmount,
      }
      if (formData.due_date) {
        debtPayload.due_date = formData.due_date
      }
      if (formData.note.trim()) {
        debtPayload.note = formData.note.trim()
      }
      if (folderId) {
        debtPayload.folder_id = folderId
      }

      // Check if user is offline before network call
      if (typeof window !== 'undefined' && !navigator.onLine) {
        enqueueOfflineDebt(debtPayload)
        playPingSound()
        nativeHaptics.notification('warning').catch(() => {})
        toast.info("Oflayn rejim: Qarz xotirada saqlandi! Internet tiklanganda avtomatik serverga yuklanadi.")
        onSuccess()
        onOpenChange(false)
        return
      }

      try {
        const debtResponse = await fetch('/api/debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debtPayload),
        })
        const debtData = await debtResponse.json()
        if (!debtResponse.ok) {
          throw new Error(debtData.error || "Qarz qo'shishda xato yuz berdi")
        }

        const debtId = debtData.debt?.id || debtData.id

        // Send SMS via Eskiz if requested and phone is provided
        if (sendSMS && hasPhone && smsCredits > 0) {
          try {
            const smsMessage = useCustomMessage
              ? formData.custom_sms_message
              : generateDefaultMessage()
            await fetch('/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                debt_id: debtId,
                recipient_phone: `+998${rawPhone}`,
                message: smsMessage,
                type: 'debt_created',
              }),
            })
          } catch {
            // SMS error is non-fatal for debt creation
          }
        }

        playPingSound()
        nativeHaptics.notification('success').catch(() => {})
        toast.success("Qarz muvaffaqiyatli saqlandi!")
        onSuccess()
        onOpenChange(false)
      } catch (networkErr: any) {
        // If network request failed due to connectivity, fallback to offline queue
        if (
          typeof window !== 'undefined' &&
          (!navigator.onLine ||
            networkErr.message?.includes('Failed to fetch') ||
            networkErr.message?.includes('NetworkError'))
        ) {
          enqueueOfflineDebt(debtPayload)
          playPingSound()
          nativeHaptics.notification('warning').catch(() => {})
          toast.info("Aloqa uzildi: Qarz xotirada saqlandi va internet ulanganda yuklanadi.")
          onSuccess()
          onOpenChange(false)
          return
        }
        throw networkErr
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Xato yuz berdi'
      setErrorMessage(msg)
      nativeHaptics.notification('error').catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  const validationHint = !formData.debtor_name || formData.debtor_name.trim().length < 2
    ? "Qarzdor ismini kiriting (kamida 2 ta harf)"
    : !formData.amount || numAmount <= 0
    ? "Qarz summasini kiriting"
    : rawPhone.length > 0 && rawPhone.length < 9
    ? "Telefon raqamini to'liq 9 ta raqam qilib kiriting yoki bo'sh qoldiring"
    : sendSMS && !hasPhone
    ? "SMS yuborish uchun telefon raqami kiritilishi shart"
    : sendSMS && smsCredits === 0
    ? "SMS yuborish uchun kredit yetarli emas"
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex flex-col gap-0 p-0
          w-[calc(100%-2rem)] max-w-lg
          max-h-[90dvh]
          overflow-y-auto
          overscroll-contain
          bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl
        "
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="[&>button]:hidden flex-shrink-0 flex flex-row items-start justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Yangi qarz kiritish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Qarzdor ma&apos;lumotlari va qarz summasi
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mt-1 -mr-1 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
            >
              <span className="sr-only">Yopish</span>
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 px-4 py-4 space-y-4">
            {/* Server / Validation Error alert */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Debtor Name Input with Live Autocomplete Suggestions */}
            <div ref={nameContainerRef} className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="debtor_name" className="text-sm font-medium">
                  Qarzdor ismi <span className="text-red-500">*</span>
                </Label>
                {supportsContacts && (
                  <button
                    type="button"
                    onClick={handlePickContact}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/80"
                    title="Telefon kontaktlaridan tanlash"
                  >
                    <Contact className="w-3.5 h-3.5" />
                    <span>Kontaktlardan tanlash</span>
                  </button>
                )}
              </div>

              <Input
                id="debtor_name"
                value={formData.debtor_name}
                onChange={(e) => {
                  setFormData({ ...formData, debtor_name: e.target.value })
                  if (selectedDebtorBadge && e.target.value !== selectedDebtorBadge.name) {
                    setSelectedDebtorBadge(null)
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0 && !selectedDebtorBadge) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="Ismi yoki taxallusi (masalan: Rustam aka)"
                required
                autoFocus
                autoComplete="off"
                className="h-11 rounded-xl"
              />

              {/* Selected Existing Customer Badge */}
              {selectedDebtorBadge && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">
                      Mavjud mijoz tanlandi • Joriy qarzi:{' '}
                      <strong className="text-blue-700 dark:text-blue-300">
                        {formatCurrency(selectedDebtorBadge.remaining)}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDebtorBadge(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Mijoz tanlovini bekor qilish"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50">
                    Mavjud mijozlardan tanlang:
                  </div>
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectSuggestion(sug)
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {sug.name?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {sug.name}
                          </span>
                        </div>
                        {sug.phone && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 pl-8 block">
                            {sug.phone}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                          {formatCurrency(sug.totalRemaining)}
                        </span>
                        <span className="text-[10px] text-slate-400">joriy qarz</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Debtor Phone - NOW OPTIONAL! */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="debtor_phone" className="text-sm font-medium">
                  Telefon raqam{' '}
                  <span className="text-slate-400 text-xs font-normal">(ixtiyoriy)</span>
                </Label>
                <span className="text-[11px] text-slate-400">SMS / Telegram uchun</span>
              </div>
              <div className="flex h-11 items-center rounded-xl border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <span className="pl-3 pr-1 text-sm font-semibold text-slate-700 dark:text-slate-300 select-none whitespace-nowrap">
                  +998
                </span>
                <span className="text-slate-300 dark:text-slate-700 text-sm select-none">|</span>
                <input
                  id="debtor_phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.debtor_phone}
                  onChange={(e) => {
                    const formatted = formatPhoneDigits(e.target.value)
                    setFormData({ ...formData, debtor_phone: formatted })
                  }}
                  placeholder="(90) 123-45-67"
                  className="flex-1 bg-transparent pl-2 pr-3 text-sm font-medium outline-none placeholder:text-muted-foreground tracking-wide"
                />
                {formData.debtor_phone && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, debtor_phone: '' })}
                    className="pr-3 text-slate-400 hover:text-slate-600"
                    title="Tozalash"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Qarz miqdori (so'm) + TEZKOR CHIPLAR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Qarz miqdori (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                {numAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tozalash</span>
                  </button>
                )}
              </div>

              <Input
                ref={amountInputRef}
                id="amount"
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => {
                  const formatted = formatAmountInput(e.target.value)
                  setFormData({ ...formData, amount: formatted })
                }}
                placeholder="100 000"
                required
                className="h-12 font-bold text-lg tracking-wide rounded-xl"
              />

              {/* Quick Amount Addition Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {QUICK_AMOUNT_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleAddChipAmount(chip.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/50 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Live readable amount in Uzbek words */}
              {numAmount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in duration-150">
                  <span className="text-blue-500 shrink-0">💎</span>
                  <span className="truncate">{numberToUzbekWords(numAmount)}</span>
                </div>
              )}
            </div>

            {/* To'lov muddati */}
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-sm font-medium">
                To&apos;lov muddati{' '}
                <span className="text-slate-400 text-xs font-normal">(ixtiyoriy)</span>
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Izoh */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm font-medium">
                Izoh{' '}
                <span className="text-slate-400 text-xs font-normal">(nimalar olgani)</span>
              </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Masalan: 2 qop un, 5 litr yog'..."
                rows={2}
                className="resize-none rounded-xl"
              />
            </div>

            {/* SMS Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">SMS xabarnoma</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {hasPhone
                        ? 'Qarzdorga yangi qarz haqida SMS yuborish'
                        : 'Telefon raqam kiritilmagan (SMS nofaol)'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={sendSMS}
                  disabled={!hasPhone}
                  onCheckedChange={(checked) => {
                    if (!hasPhone) {
                      toast.info("SMS yuborish uchun avval telefon raqamini kiriting")
                      return
                    }
                    setSendSMS(checked)
                  }}
                  className="shrink-0"
                />
              </div>

              {/* Credits badge */}
              {hasPhone && smsCredits > 0 && (
                <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl">
                  <span>Mavjud balans:</span>
                  <span className="font-bold">{smsCredits} ta SMS</span>
                </div>
              )}

              {/* No-credits warning */}
              {sendSMS && hasPhone && smsCredits === 0 && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="truncate">SMS balansingizda kredit yo&apos;q</span>
                  </div>
                  <a
                    href="/sms-credits"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5 flex-shrink-0 text-xs"
                  >
                    <span>Sotib olish</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Custom message toggle & preview */}
              {sendSMS && hasPhone && smsCredits > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Matnni tahrirlash</p>
                    <Switch
                      checked={useCustomMessage}
                      onCheckedChange={setUseCustomMessage}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {useCustomMessage ? (
                      <Textarea
                        value={formData.custom_sms_message}
                        onChange={(e) =>
                          setFormData({ ...formData, custom_sms_message: e.target.value })
                        }
                        placeholder="SMS matnini yozing..."
                        rows={3}
                        className="text-sm resize-none rounded-xl"
                      />
                    ) : (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {generateDefaultMessage()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Validation hint */}
            {validationHint && (
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 pb-1">
                {validationHint}
              </p>
            )}
          </div>

          {/* Footer with primary action */}
          <div className="flex gap-2 px-4 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-11 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading || !canSubmit()}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:cursor-not-allowed"
            >
              {loading ? 'Saqlanmoqda...' : "Qarzni saqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
