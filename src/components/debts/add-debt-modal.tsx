// src/components/debts/add-debt-modal.tsx
// CORRECT SMS VALIDATION LOGIC
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
  const [sendSMS, setSendSMS] = useState(false) // User controls this
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

  // Reset form when modal opens
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

  // ✅ CORRECT VALIDATION LOGIC
  const canSubmit = () => {
    // Required fields
    if (!formData.debtor_name || !formData.debtor_phone || !formData.amount) {
      return false
    }

    // SMS validation ONLY if user enabled it
    if (sendSMS) {
      // Must have credits
      if (smsCredits === 0) {
        return false
      }
      // Custom message must not be empty
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
      // 1. Create debt
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

      console.log('📝 Creating debt:', debtPayload)

      const debtResponse = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtPayload),
      })

      const debtData = await debtResponse.json()
      console.log('📝 Debt response:', debtData)

      if (!debtResponse.ok) {
        throw new Error(debtData.error || 'Qarz qo\'shishda xato')
      }

      const debtId = debtData.debt?.id || debtData.id

      // 2. Send SMS ONLY if user enabled it AND has credits
      let smsSent = false
      if (sendSMS && smsCredits > 0) {
        try {
          const smsMessage = useCustomMessage 
            ? formData.custom_sms_message 
            : generateDefaultMessage()

          console.log('📱 Sending SMS:', { debtId, phone: formData.debtor_phone })

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

          const smsData = await smsResponse.json()

          if (smsResponse.ok) {
            smsSent = true
            console.log('✅ SMS sent successfully')
          } else {
            console.error('❌ SMS failed:', smsData.error)
            alert(`⚠️ Qarz qo'shildi, lekin SMS yuborilmadi: ${smsData.error}`)
          }
        } catch (smsError: any) {
          console.error('❌ SMS error:', smsError)
          alert(`⚠️ Qarz qo'shildi, lekin SMS yuborilmadi: ${smsError.message}`)
        }
      }

      // 3. Show success message
      if (smsSent) {
        alert('✅ Qarz qo\'shildi va SMS yuborildi!')
      } else {
        alert('✅ Qarz muvaffaqiyatli qo\'shildi!')
      }

      // 4. Close modal and refresh
      onSuccess()
      onOpenChange(false)

    } catch (error: any) {
      console.error('❌ Error:', error)
      alert(error.message || 'Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi qarz qo&apos;shish</DialogTitle>
          <DialogDescription>
            Qarzdor ma&apos;lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debtor Name */}
          <div>
            <Label htmlFor="debtor_name">
              Qarzdor ismi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="debtor_name"
              value={formData.debtor_name}
              onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
              placeholder="Ismi Familiyasi"
              required
              autoFocus
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="debtor_phone">
              Telefon raqami <span className="text-red-500">*</span>
            </Label>
            <Input
              id="debtor_phone"
              type="tel"
              value={formData.debtor_phone}
              onChange={(e) => setFormData({ ...formData, debtor_phone: e.target.value })}
              placeholder="+998901234567"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">
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
            />
          </div>

          {/* Shop Name (for SMS) */}
          <div>
            <Label htmlFor="shop_name">
              Do&apos;kon nomi <span className="text-slate-400">(SMS uchun)</span>
            </Label>
            <Input
              id="shop_name"
              value={formData.shop_name}
              onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
              placeholder="Mening do'konim"
            />
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due_date">To&apos;lov muddati</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Izoh</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          {/* SMS Option */}
          <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">SMS yuborish</p>
                  <p className="text-xs text-slate-500">
                    Qarzdorga eslatma yuborish
                  </p>
                </div>
              </div>
              {/* ✅ ALWAYS ENABLED - User controls it */}
              <Switch
                checked={sendSMS}
                onCheckedChange={setSendSMS}
              />
            </div>

            {/* Show credits info always */}
            {smsCredits === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  SMS kredit yo&apos;q. <a href="/sms-credits" className="underline font-medium">Sotib oling</a>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded">
                <span className="text-green-900">Mavjud kredit:</span>
                <span className="font-bold text-green-700">{smsCredits} SMS</span>
              </div>
            )}

            {/* Show SMS options only if enabled */}
            {sendSMS && (
              <>
                {/* Warning if no credits */}
                {smsCredits === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      SMS yuborish uchun kredit kerak. SMS ni o&apos;chiring yoki kredit sotib oling.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show message options only if has credits */}
                {smsCredits > 0 && (
                  <>
                    {/* Custom Message Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-sm font-medium">O&apos;zim yozaman</p>
                      <Switch
                        checked={useCustomMessage}
                        onCheckedChange={setUseCustomMessage}
                      />
                    </div>

                    {/* Message Preview/Edit */}
                    <div>
                      <Label className="text-xs">SMS matni</Label>
                      {useCustomMessage ? (
                        <>
                          <Textarea
                            value={formData.custom_sms_message}
                            onChange={(e) => setFormData({ ...formData, custom_sms_message: e.target.value })}
                            placeholder="SMS matnini yozing..."
                            rows={4}
                            className="mt-1"
                          />
                          {formData.custom_sms_message.trim() === '' && (
                            <p className="text-xs text-red-500 mt-1">
                              ⚠️ SMS matni bo&apos;sh bo&apos;lmasligi kerak
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="mt-1 p-3 bg-white rounded-lg text-sm border">
                          {generateDefaultMessage()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading || !canSubmit()}
              className="flex-1"
            >
              {loading ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </Button>
          </div>

          {/* Show why button is disabled */}
          {!canSubmit() && (
            <p className="text-xs text-center text-slate-600">
              {!formData.debtor_name || !formData.debtor_phone || !formData.amount
                ? '⚠️ Barcha majburiy maydonlarni to\'ldiring'
                : sendSMS && smsCredits === 0
                ? '⚠️ SMS yuborish uchun kredit yo\'q - SMS ni o\'chiring yoki kredit sotib oling'
                : sendSMS && useCustomMessage && !formData.custom_sms_message.trim()
                ? '⚠️ SMS matni bo\'sh'
                : ''
              }
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}