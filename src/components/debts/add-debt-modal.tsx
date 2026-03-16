// src/components/debts/add-debt-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, AlertCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

interface AddDebtModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  folderId?: string | null
}

export function AddDebtModal({ open, onOpenChange, onSuccess, folderId }: AddDebtModalProps) {
  const [loading, setLoading] = useState(false)
  const [sendSMS, setSendSMS] = useState(false)
  const [useCustomMessage, setUseCustomMessage] = useState(false)
  const [smsCredits, setSmsCredits] = useState(0)

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
    if (open) {
      setFormData({
        debtor_name: '',
        debtor_phone: '',
        amount: '',
        due_date: '',
        note: '',
        shop_name: '',
        custom_sms_message: '',
      })
      setSendSMS(false)
      setUseCustomMessage(false)
      fetchSMSCredits()
    }
  }, [open])

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

  const generateDefaultMessage = () => {
    const { debtor_name, amount, due_date, shop_name } = formData
    if (!debtor_name || !amount) return "Ma'lumotlarni to'ldiring..."
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(Number(amount))
    const shopText = shop_name ? ` "${shop_name}"` : ''
    const dueDateText = due_date
      ? ` To'lov muddati: ${new Date(due_date).toLocaleDateString('uz-UZ')}.`
      : ''
    return `Hurmatli ${debtor_name}, Siz${shopText}dan ${formattedAmount} so'm qarz oldingiz.${dueDateText} Qarz Daftari.`
  }

  const canSubmit = () => {
    if (!formData.debtor_name || formData.debtor_phone.length < 9 || !formData.amount) return false
    if (sendSMS && smsCredits === 0) return false
    if (sendSMS && useCustomMessage && !formData.custom_sms_message.trim()) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit()) return
    setLoading(true)

    try {
      const debtPayload: Record<string, unknown> = {
        debtor_name: formData.debtor_name.trim(),
        debtor_phone: `+998${formData.debtor_phone}`,
        amount: Number(formData.amount),
        due_date: formData.due_date || null,
        note: formData.note.trim() || null,
      }
      if (folderId) debtPayload.folder_id = folderId

      const debtResponse = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtPayload),
      })
      const debtData = await debtResponse.json()
      if (!debtResponse.ok) throw new Error(debtData.error || "Qarz qo'shishda xato")

      const debtId = debtData.debt?.id || debtData.id
      let smsSent = false

      if (sendSMS && smsCredits > 0) {
        try {
          const smsMessage = useCustomMessage
            ? formData.custom_sms_message
            : generateDefaultMessage()
          const smsResponse = await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              debt_id: debtId,
              recipient_phone: `+998${formData.debtor_phone}`,
              message: smsMessage,
              type: 'debt_created',
            }),
          })
          if (smsResponse.ok) smsSent = true
        } catch {
          // SMS error silently ignored, debt was created
        }
      }

      alert(smsSent ? "✅ Qarz qo'shildi va SMS yuborildi!" : "✅ Qarz muvaffaqiyatli qo'shildi!")
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Xato yuz berdi'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const validationHint = !formData.debtor_name || formData.debtor_phone.length < 9 || !formData.amount
    ? "⚠️ Barcha majburiy maydonlarni to'ldiring"
    : sendSMS && smsCredits === 0
    ? "⚠️ SMS ni o'chiring yoki kredit sotib oling"
    : sendSMS && useCustomMessage && !formData.custom_sms_message.trim()
    ? "⚠️ SMS matni bo'sh"
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        FIX: overflow-y-auto is on DialogContent itself (via className).
        We do NOT use nested scrollable containers — that causes the
        sticky footer to break on mobile when the virtual keyboard opens.

        The form uses flex-col with the footer naturally at the bottom
        (no sticky/fixed positioning needed when the whole modal scrolls).
      */}
      <DialogContent
        className="
          flex flex-col gap-0 p-0
          w-[calc(100%-2rem)] max-w-lg
          max-h-[90dvh]
          overflow-y-auto
          overscroll-contain
        "
        // Prevent Radix from auto-closing on overlay click while keyboard is open
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        {/*
          hideCloseButton prop yoki [data-radix-dialog-close] yo'q bo'lsa,
          DialogContent o'zi default X button render qiladi.
          Biz uni className orqali yashirib, o'zimizni qo'shamiz —
          lekin bu ham duplikat chiqaradi.
          To'g'ri yechim: DialogContent ga `hideCloseButton` prop bering
          (shadcn v0.8+ da bor), yoki DialogContent source'ga
          showCloseButton={false} qo'shilgan bo'lsa shuni ishlating.
          Agar sizning shadcn versiyangizda bu prop yo'q bo'lsa,
          quyidagi [&>button:first-of-type]:hidden trick ishlaydi.
        */}
        <DialogHeader className="[&>button]:hidden flex-shrink-0 flex flex-row items-start justify-between p-4 pb-3 border-b">
          <div>
            <DialogTitle className="text-base font-semibold">Yangi qarz</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              Qarzdor ma&apos;lumotlari
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mt-1 -mr-1"
            >
              <span className="sr-only">Yopish</span>
              ✕
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* ── Scrollable body + footer inside one <form> ─────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 px-4 py-4 space-y-4">

            {/* Debtor Name */}
            <div className="space-y-1.5">
              <Label htmlFor="debtor_name" className="text-sm font-medium">
                Qarzdor ismi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="debtor_name"
                value={formData.debtor_name}
                onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                placeholder="Ismi Familiyasi"
                required
                autoFocus
                className="h-11"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="debtor_phone" className="text-sm font-medium">
                Telefon <span className="text-red-500">*</span>
              </Label>
              {/*
                +998 prefix fixed va o'chirib bo'lmaydi.
                State faqat prefix'dan keyingi qismni saqlaydi (max 9 raqam).
                Submit paytida to'liq raqam birlashtirilib yuboriladi.
              */}
              <div className="flex h-11 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="pl-3 pr-1 text-sm font-medium text-foreground select-none whitespace-nowrap">
                  +998
                </span>
                <span className="text-muted-foreground text-sm select-none">|</span>
                <input
                  id="debtor_phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.debtor_phone}
                  onChange={(e) => {
                    // Faqat raqamlar, max 9 ta
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setFormData({ ...formData, debtor_phone: digits })
                  }}
                  placeholder="901234567"
                  required
                  className="flex-1 bg-transparent pl-1.5 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">
                Qarz miqdori (so&apos;m) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100000"
                required
                className="h-11"
              />
            </div>

            {/* Shop Name */}
            <div className="space-y-1.5">
              <Label htmlFor="shop_name" className="text-sm">
                Do&apos;kon nomi{' '}
                <span className="text-slate-400 text-xs">(SMS uchun)</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shop_name"
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                placeholder="Mening do'konim"
                className="h-11"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-sm">
                To&apos;lov muddati
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm">
                Izoh
                <span className="text-red-500">*</span>
                </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Qo'shimcha ma'lumot..."
                rows={2}
                className="resize-none"
              />
            </div>

            {/* ── SMS Section ───────────────────────────────────── */}
            <div className="border rounded-lg p-3 space-y-3 bg-slate-50">

              {/* Toggle row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <MessageSquare className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">SMS yuborish</p>
                    <p className="text-xs text-slate-500 mt-0.5">Qarzdorga eslatma</p>
                  </div>
                </div>
                <Switch
                  checked={sendSMS}
                  onCheckedChange={setSendSMS}
                  className="shrink-0"
                />
              </div>

              {/* Credits badge */}
              {smsCredits === 0 ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    SMS kredit yo&apos;q.{' '}
                    <a href="/sms-credits" className="underline font-medium">
                      Sotib oling
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center justify-between text-xs p-2 bg-green-50 rounded">
                  <span className="text-green-900">Mavjud:</span>
                  <span className="font-bold text-green-700">{smsCredits} SMS</span>
                </div>
              )}

              {/* No-credits warning when SMS is toggled ON */}
              {sendSMS && smsCredits === 0 && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    SMS yuborish uchun kredit kerak. SMS ni o&apos;chiring yoki kredit
                    sotib oling.
                  </AlertDescription>
                </Alert>
              )}

              {/* Custom message section */}
              {sendSMS && smsCredits > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-medium">O&apos;zim yozaman</p>
                    <Switch
                      checked={useCustomMessage}
                      onCheckedChange={setUseCustomMessage}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">SMS matni</Label>
                    {useCustomMessage ? (
                      <>
                        <Textarea
                          value={formData.custom_sms_message}
                          onChange={(e) =>
                            setFormData({ ...formData, custom_sms_message: e.target.value })
                          }
                          placeholder="SMS matnini yozing..."
                          rows={3}
                          className="text-sm resize-none"
                        />
                        {formData.custom_sms_message.trim() === '' && (
                          <p className="text-xs text-red-500">
                            ⚠️ SMS matni bo&apos;sh bo&apos;lmasligi kerak
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="p-2 bg-white rounded text-xs border leading-relaxed">
                        {generateDefaultMessage()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Validation hint */}
            {validationHint && (
              <p className="text-xs text-center text-slate-600 pb-1">{validationHint}</p>
            )}
          </div>

          {/* ── Footer — naturally at the bottom, NO sticky ──────── */}
          <div className="flex gap-2 px-4 py-4 border-t bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-11"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading || !canSubmit()}
              className="flex-1 h-11"
            >
              {loading ? 'Saqlanmoqda...' : "Qo'shish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}