// src/components/debts/add-debt-modal.tsx
// FULLY RESPONSIVE VERSION
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, AlertCircle, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
    } catch (error) {
      console.error('Failed to fetch SMS credits:', error)
      setSmsCredits(0)
    }
  }

  const generateDefaultMessage = () => {
    const { debtor_name, amount, due_date, shop_name } = formData
    
    if (!debtor_name || !amount) return 'Ma\'lumotlarni to\'ldiring...'
    
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(Number(amount))
    const shopText = shop_name ? ` "${shop_name}"` : ''
    const dueDateText = due_date 
      ? ` To'lov muddati: ${new Date(due_date).toLocaleDateString('uz-UZ')}.`
      : ''
    
    return `Hurmatli ${debtor_name}, Siz${shopText}dan ${formattedAmount} so'm qarz oldingiz.${dueDateText} Qarz Daftari.`
  }

  const canSubmit = () => {
    if (!formData.debtor_name || !formData.debtor_phone || !formData.amount) {
      return false
    }

    if (sendSMS) {
      if (smsCredits === 0) {
        return false
      }
      if (useCustomMessage && !formData.custom_sms_message.trim()) {
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canSubmit()) {
      return
    }

    setLoading(true)

    try {
      const debtPayload: any = {
        debtor_name: formData.debtor_name.trim(),
        debtor_phone: formData.debtor_phone.trim(),
        amount: Number(formData.amount),
        due_date: formData.due_date || null,
        note: formData.note.trim() || null,
      }

      if (folderId) {
        debtPayload.folder_id = folderId
      }

      const debtResponse = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtPayload),
      })

      const debtData = await debtResponse.json()

      if (!debtResponse.ok) {
        throw new Error(debtData.error || 'Qarz qo\'shishda xato')
      }

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
              recipient_phone: formData.debtor_phone.trim(),
              message: smsMessage,
              type: 'debt_created',
            }),
          })

          if (smsResponse.ok) {
            smsSent = true
          }
        } catch (smsError) {
          console.error('SMS error:', smsError)
        }
      }

      if (smsSent) {
        alert('✅ Qarz qo\'shildi va SMS yuborildi!')
      } else {
        alert('✅ Qarz muvaffaqiyatli qo\'shildi!')
      }

      onSuccess()
      onOpenChange(false)

    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[95vh] p-0 gap-0">
        {/* Header - Fixed */}
        <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Yangi qarz</DialogTitle>
              <DialogDescription className="text-sm">
                Qarzdor ma&apos;lumotlari
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(95vh-80px)]">
          <div className="overflow-y-auto px-4 py-4 space-y-3">
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
              <Input
                id="debtor_phone"
                type="tel"
                value={formData.debtor_phone}
                onChange={(e) => setFormData({ ...formData, debtor_phone: e.target.value })}
                placeholder="+998901234567"
                required
                className="h-11"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">
                Qarz miqdori (so&apos;m) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
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
                Do&apos;kon nomi <span className="text-slate-400 text-xs">(SMS uchun)</span>
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
              <Label htmlFor="due_date" className="text-sm">To&apos;lov muddati</Label>
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
              <Label htmlFor="note" className="text-sm">Izoh</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Qo'shimcha ma'lumot..."
                rows={2}
                className="resize-none"
              />
            </div>

            {/* SMS Section */}
            <div className="border rounded-lg p-3 space-y-3 bg-slate-50">
              {/* SMS Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <MessageSquare className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">SMS yuborish</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qarzdorga eslatma
                    </p>
                  </div>
                </div>
                <Switch
                  checked={sendSMS}
                  onCheckedChange={setSendSMS}
                  className="flex-shrink-0"
                />
              </div>

              {/* Credits Info */}
              {smsCredits === 0 ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    SMS kredit yo&apos;q. <a href="/sms-credits" className="underline font-medium">Sotib oling</a>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center justify-between text-xs p-2 bg-green-50 rounded">
                  <span className="text-green-900">Mavjud:</span>
                  <span className="font-bold text-green-700">{smsCredits} SMS</span>
                </div>
              )}

              {/* SMS Options */}
              {sendSMS && smsCredits === 0 && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    SMS yuborish uchun kredit kerak. SMS ni o&apos;chiring yoki kredit sotib oling.
                  </AlertDescription>
                </Alert>
              )}

              {sendSMS && smsCredits > 0 && (
                <>
                  {/* Custom Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-medium">O&apos;zim yozaman</p>
                    <Switch
                      checked={useCustomMessage}
                      onCheckedChange={setUseCustomMessage}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">SMS matni</Label>
                    {useCustomMessage ? (
                      <>
                        <Textarea
                          value={formData.custom_sms_message}
                          onChange={(e) => setFormData({ ...formData, custom_sms_message: e.target.value })}
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
            {!canSubmit() && (
              <p className="text-xs text-center text-slate-600 py-2">
                {!formData.debtor_name || !formData.debtor_phone || !formData.amount
                  ? '⚠️ Barcha majburiy maydonlarni to\'ldiring'
                  : sendSMS && smsCredits === 0
                  ? '⚠️ SMS ni o\'chiring yoki kredit sotib oling'
                  : sendSMS && useCustomMessage && !formData.custom_sms_message.trim()
                  ? '⚠️ SMS matni bo\'sh'
                  : ''
                }
              </p>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex gap-2 p-4 border-t bg-white sticky bottom-0">
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
              {loading ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}