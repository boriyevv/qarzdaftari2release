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
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
          <DropdownMenuItem onClick={onView} className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors">
            <Eye className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
            Ko&apos;rish
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors">
            <Edit className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
            Tahrirlash
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="dark:bg-slate-800" />
          
          <DropdownMenuItem onClick={() => handleOpenSMS('default')} className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors">
            <MessageSquare className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
            SMS yuborish (Auto)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenSMS('custom')} className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors">
            <Send className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
            SMS yuborish (Custom)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="dark:bg-slate-800" />
          
          <DropdownMenuItem 
            onClick={onDelete}
            className="rounded-xl text-xs font-semibold py-2 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400" />
            O&apos;chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* SMS Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100">SMS yuborish</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {debt.debtor_name} - {debt.debtor_phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* SMS Credits */}
            {smsCredits === 0 ? (
              <Alert variant="destructive" className="rounded-2xl border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  SMS kredit yo&apos;q. <a href="/sms-credits" className="underline font-bold hover:text-rose-900 dark:hover:text-rose-200">Sotib oling</a>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl">
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Mavjud SMS kredit:</span>
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold">{smsCredits}</Badge>
              </div>
            )}

            {/* Message Type */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SMS turi</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={smsType === 'default' ? 'default' : 'outline'}
                  onClick={() => setSmsType('default')}
                  className={`flex-1 rounded-xl text-xs font-bold ${
                    smsType === 'default'
                      ? 'bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Avtomatik
                </Button>
                <Button
                  type="button"
                  variant={smsType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSmsType('custom')}
                  className={`flex-1 rounded-xl text-xs font-bold ${
                    smsType === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  O&apos;zim yozaman
                </Button>
              </div>
            </div>

            {/* Message Content */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SMS matni</Label>
              {smsType === 'custom' ? (
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="SMS matnini yozing..."
                  rows={4}
                  className="mt-2 rounded-xl text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              ) : (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                  {generateDefaultMessage()}
                </div>
              )}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                {smsType === 'custom' ? customMessage.length : generateDefaultMessage().length} belgi
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSMSDialog(false)
                  setCustomMessage('')
                }}
                className="flex-1 rounded-xl h-10 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleSendSMS}
                disabled={loading || smsCredits === 0 || (smsType === 'custom' && !customMessage.trim())}
                className="flex-1 rounded-xl h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
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