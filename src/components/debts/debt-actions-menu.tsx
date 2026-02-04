// src/components/debts/debt-actions-menu.tsx
'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MoreVertical, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  Send
} from 'lucide-react'

interface Debt {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  paid_amount: number
  due_date: string | null
}

interface DebtActionsMenuProps {
  debt: Debt
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

export function DebtActionsMenu({ debt, onEdit, onDelete, onView }: DebtActionsMenuProps) {
  const [showSMSDialog, setShowSMSDialog] = useState(false)
  const [smsType, setSmsType] = useState<'default' | 'custom'>('default')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [smsCredits, setSmsCredits] = useState(0)

  const handleOpenSMS = async (type: 'default' | 'custom') => {
    setSmsType(type)
    setShowSMSDialog(true)
    
    // Fetch credits
    try {
      const response = await fetch('/api/sms-credits')
      const data = await response.json()
      if (response.ok) {
        setSmsCredits(data.remaining_credits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch SMS credits:', error)
    }
  }

  const generateDefaultMessage = (): string => {
    const remainingAmount = debt.amount - debt.paid_amount
    const formattedAmount = remainingAmount.toLocaleString('uz-UZ')
    const dueDateText = debt.due_date 
      ? ` ${new Date(debt.due_date).toLocaleDateString('uz-UZ')} sanasigacha`
      : ''
    
    return `Hurmatli ${debt.debtor_name}, sizda ${formattedAmount} so'm qarz mavjud.${dueDateText} To'lashingizni so'raymiz. Qarz Daftari.`
  }

  const handleSendSMS = async () => {
    setLoading(true)

    try {
      const message = smsType === 'custom' ? customMessage : generateDefaultMessage()

      if (!message.trim()) {
        alert('SMS matnini kiriting')
        return
      }

      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debt_id: debt.id,
          recipient_phone: debt.debtor_phone,
          message,
          type: 'payment_reminder',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('SMS muvaffaqiyatli yuborildi!')
        setShowSMSDialog(false)
        setCustomMessage('')
      } else {
        alert(data.error || 'SMS yuborishda xato')
      }
    } catch (error) {
      console.error('SMS send error:', error)
      alert('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4 mr-2" />
            Ko&apos;rish
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Tahrirlash
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleOpenSMS('default')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS yuborish (Auto)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenSMS('custom')}>
            <Send className="w-4 h-4 mr-2" />
            SMS yuborish (Custom)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            O&apos;chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* SMS Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS yuborish</DialogTitle>
            <DialogDescription>
              {debt.debtor_name} - {debt.debtor_phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* SMS Credits */}
            {smsCredits === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  SMS kredit yo&apos;q. <a href="/sms-credits" className="underline">Sotib oling</a>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-900">Mavjud SMS kredit:</span>
                <Badge className="bg-green-600">{smsCredits}</Badge>
              </div>
            )}

            {/* Message Type */}
            <div>
              <Label>SMS turi</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={smsType === 'default' ? 'default' : 'outline'}
                  onClick={() => setSmsType('default')}
                  className="flex-1"
                >
                  Avtomatik
                </Button>
                <Button
                  type="button"
                  variant={smsType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSmsType('custom')}
                  className="flex-1"
                >
                  O&apos;zim yozaman
                </Button>
              </div>
            </div>

            {/* Message Content */}
            <div>
              <Label>SMS matni</Label>
              {smsType === 'custom' ? (
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="SMS matnini yozing..."
                  rows={5}
                  className="mt-2"
                />
              ) : (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm">
                  {generateDefaultMessage()}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {smsType === 'custom' ? customMessage.length : generateDefaultMessage().length} belgi
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSMSDialog(false)
                  setCustomMessage('')
                }}
                className="flex-1"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleSendSMS}
                disabled={loading || smsCredits === 0 || (smsType === 'custom' && !customMessage.trim())}
                className="flex-1"
              >
                {loading ? 'Yuborilmoqda...' : 'Yuborish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}