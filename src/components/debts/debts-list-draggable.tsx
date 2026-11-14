// src/components/debts/debts-list-draggable.tsx
// Touch-enabled drag & drop with @dnd-kit + SMS + Quick Actions & CRM Filter Bar
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle,
  MessageSquare,
  Send,
  Search,
  X,
  Phone,
  Plus,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  User,
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  Receipt,
  Bell,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils/currency'
import { useUser } from '@/lib/contexts/user-context'
import { exportDebtsToExcel, exportDebtsToPDF, exportSingleDebtReceiptPDF } from '@/lib/export/debts-export'
import { toast } from 'sonner'
import { playSuccessSound } from '@/lib/sounds'
import { nativeHaptics } from '@/lib/native'
import { formatTelegramDebtReminder, getTelegramShareUrl, getTelegramDirectPhoneUrl, recordReminderSent } from '@/lib/utils/telegram-reminders'
import { AddPaymentModal } from './add-payment-modal'
import { EditDebtModal } from './edit-debt-modal'
import { AutoRemindersModal } from './auto-reminders-modal'

export interface Debt {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  paid_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'blacklisted'
  due_date: string | null
  debt_date: string
  note?: string
  folder: {
    id: string
    name: string
    color: string
  } | null
}

interface DebtsListDraggableProps {
  debts: Debt[]
  onUpdate: () => void
  onAddNewDebt?: () => void
}

// ─── Deterministic Avatar Helpers ─────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-pink-600',
  'from-emerald-600 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-600 to-blue-700',
  'from-rose-600 to-red-600',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatPhoneDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 12 && clean.startsWith('998')) {
    return `+998 (${clean.slice(3, 5)}) ${clean.slice(5, 8)}-${clean.slice(8, 10)}-${clean.slice(10, 12)}`
  }
  if (clean.length === 9) {
    return `+998 (${clean.slice(0, 2)}) ${clean.slice(2, 5)}-${clean.slice(5, 7)}-${clean.slice(7, 9)}`
  }
  return phone
}

// ─── Smart Due Date Calculator ────────────────────────────────────────
interface DueDateInfo {
  status: 'overdue' | 'today' | 'soon' | 'future' | 'none'
  text: string
  pillClasses: string
  badgeDot: string
}

function getDueDateInfo(dueDateStr: string | null, isFullyPaid: boolean): DueDateInfo {
  if (isFullyPaid) {
    return {
      status: 'none',
      text: "To'langan",
      pillClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
      badgeDot: 'bg-emerald-500',
    }
  }

  if (!dueDateStr) {
    return {
      status: 'none',
      text: 'Muddatsiz',
      pillClasses: 'bg-slate-100 text-slate-500 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      badgeDot: 'bg-slate-400',
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(dueDateStr)
  dueDate.setHours(0, 0, 0, 0)

  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const daysOver = Math.abs(diffDays)
    return {
      status: 'overdue',
      text: `${daysOver} kun kechikdi`,
      pillClasses: 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80 font-bold animate-pulse',
      badgeDot: 'bg-rose-500',
    }
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      text: 'Bugun to\'lash kerak',
      pillClasses: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80 font-bold',
      badgeDot: 'bg-amber-500 animate-ping',
    }
  }

  if (diffDays <= 3) {
    return {
      status: 'soon',
      text: `${diffDays} kundan keyin`,
      pillClasses: 'bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
      badgeDot: 'bg-amber-400',
    }
  }

  return {
    status: 'future',
    text: dueDate.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
    pillClasses: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    badgeDot: 'bg-slate-400',
  }
}

// ─── Reminder & SMS Dialog Component ──────────────────────────────────
function SMSDialog({
  debt,
  open,
  onOpenChange,
  initialChannel = 'telegram',
  onSent,
}: {
  debt: Debt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  initialChannel?: 'telegram' | 'sms'
  onSent?: () => void
}) {
  const [channel, setChannel] = useState<'telegram' | 'sms'>(initialChannel)
  const [smsType, setSmsType] = useState<'default' | 'custom'>('default')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [smsCredits, setSmsCredits] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setChannel(initialChannel)
      setCustomMessage('')
    }
  }, [open, initialChannel])

  useEffect(() => {
    if (open && debt) {
      fetchSMSCredits()
    }
  }, [open, debt])

  const fetchSMSCredits = async () => {
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
    if (!debt) return ''
    const remainingAmount = debt.amount - debt.paid_amount
    const formattedAmount = remainingAmount.toLocaleString('uz-UZ')
    const dueDateText = debt.due_date
      ? ` ${new Date(debt.due_date).toLocaleDateString('uz-UZ')} sanasigacha`
      : ''
    return `Hurmatli ${debt.debtor_name}, sizda ${formattedAmount} so'm qarz mavjud.${dueDateText} To'lashingizni so'raymiz. Qarz Daftari.`
  }

  const generateTelegramMessage = (): string => {
    if (!debt) return ''
    const remainingAmount = debt.amount - debt.paid_amount
    return formatTelegramDebtReminder({
      debtorName: debt.debtor_name,
      debtorPhone: debt.debtor_phone,
      remainingAmount,
      dueDate: debt.due_date,
      storeName: "Qarz Daftari",
    })
  }

  const handleSendTelegram = async () => {
    if (!debt) return
    if (!debt.debtor_phone) {
      toast.info("Ushbu qarzdorning telefon raqami kiritilmagan")
      return
    }
    const rawMessage = smsType === 'custom' && customMessage.trim() ? customMessage : generateTelegramMessage()
    const cleanPhone = debt.debtor_phone.replace(/[\s-]/g, '')
    const statementUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://debtbook.uz'}/debtor/${encodeURIComponent(cleanPhone)}`

    const shareUrl = getTelegramShareUrl(rawMessage, statementUrl)
    window.open(shareUrl, '_blank')

    await recordReminderSent(debt.id)
    playSuccessSound()
    toast.success("Telegram eslatmasi ochildi!")
    onSent?.()
    onOpenChange(false)
  }

  const handleDirectTelegramChat = async () => {
    if (!debt) return
    if (!debt.debtor_phone) {
      toast.info("Ushbu qarzdorning telefon raqami kiritilmagan")
      return
    }
    const directUrl = getTelegramDirectPhoneUrl(debt.debtor_phone)
    window.open(directUrl, '_blank')
    await recordReminderSent(debt.id)
    playSuccessSound()
    onSent?.()
  }

  const handleCopyMessage = () => {
    const text = channel === 'telegram'
      ? (smsType === 'custom' && customMessage.trim() ? customMessage : generateTelegramMessage())
      : (smsType === 'custom' && customMessage.trim() ? customMessage : generateDefaultMessage())
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''))
    setCopied(true)
    toast.success("Eslatma matni nusxalandi!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendSMS = async () => {
    if (!debt) return
    setLoading(true)

    try {
      const message = smsType === 'custom' ? customMessage : generateDefaultMessage()
      if (!message.trim()) {
        toast.error('SMS matnini kiriting')
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
        toast.success('SMS muvaffaqiyatli yuborildi!')
        playSuccessSound()
        await recordReminderSent(debt.id)
        onSent?.()
        onOpenChange(false)
        setCustomMessage('')
        setSmsType('default')
      } else {
        toast.error(data.error || 'SMS yuborishda xato')
      }
    } catch (error) {
      console.error('SMS send error:', error)
      toast.error('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  if (!debt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              {channel === 'telegram' ? (
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              )}
              <span>Qarz Eslatmasi Yuborish</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            {debt.debtor_name} ({formatPhoneDisplay(debt.debtor_phone)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Channel Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setChannel('telegram')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                channel === 'telegram'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs ring-1 ring-sky-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span>Telegram</span>
              <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 rounded-full font-black">
                BEPUL
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                channel === 'sms'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>SMS</span>
              <span className="text-[10px] text-slate-400">({smsCredits} ta)</span>
            </button>
          </div>

          {/* TELEGRAM VIEW */}
          {channel === 'telegram' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <span className="font-semibold text-sky-900 dark:text-sky-200">
                    100% Bepul eslatma (SMS balansi sarflanmaydi)
                  </span>
                </div>
                <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-400/40 text-[10px] font-black">
                  Cheksiz
                </Badge>
              </div>

              {/* Message Type */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xabar turi</Label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Nusxalandi' : 'Nusxalash'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={smsType === 'default' ? 'default' : 'outline'}
                    onClick={() => setSmsType('default')}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      smsType === 'default'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Standart eslatma
                  </Button>
                  <Button
                    type="button"
                    variant={smsType === 'custom' ? 'default' : 'outline'}
                    onClick={() => setSmsType('custom')}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      smsType === 'custom'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    O&apos;zim yozaman
                  </Button>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xabar matni</Label>
                {smsType === 'custom' ? (
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Telegram xabar matnini yozing..."
                    rows={5}
                    className="mt-1.5 rounded-xl text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <div className="mt-1.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line max-h-44 overflow-y-auto">
                    {generateTelegramMessage().replace(/<[^>]*>/g, '')}
                  </div>
                )}
              </div>

              {/* Telegram Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDirectTelegramChat}
                  className="w-full sm:w-auto h-10 px-3 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Qarzdor bilan to'g'ridan-to'g'ri Telegram chatni ochish"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
                  Chatni ochish
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setCustomMessage('')
                  }}
                  className="w-full sm:w-auto flex-1 h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Bekor qilish
                </Button>

                <Button
                  type="button"
                  onClick={handleSendTelegram}
                  className="w-full sm:w-auto flex-1 h-10 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Telegramda yuborish
                </Button>
              </div>
            </div>
          )}

          {/* SMS VIEW */}
          {channel === 'sms' && (
            <div className="space-y-3.5">
              {/* SMS Credits */}
              {smsCredits === 0 ? (
                <Alert variant="destructive" className="rounded-2xl border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <AlertDescription className="text-xs flex items-center justify-between">
                    <span>SMS balansingizda kredit qolmagan.</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setChannel('telegram')}
                      className="h-7 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold"
                    >
                      Telegramda bepul yuborish &rarr;
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800 rounded-2xl">
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Mavjud SMS balansi:</span>
                  <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                    {smsCredits} ta kredit
                  </Badge>
                </div>
              )}

              {/* Message Type */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SMS turi</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={smsType === 'default' ? 'default' : 'outline'}
                    onClick={() => setSmsType('default')}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      smsType === 'default' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Avtomatik shablon
                  </Button>
                  <Button
                    type="button"
                    variant={smsType === 'custom' ? 'default' : 'outline'}
                    onClick={() => setSmsType('custom')}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      smsType === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
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
                    className="mt-1.5 rounded-xl text-xs font-medium border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <div className="mt-1.5 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {generateDefaultMessage()}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                  {smsType === 'custom'
                    ? `${customMessage.length} ta belgi (1 ta SMS ~ 70-160 belgi)`
                    : `${generateDefaultMessage().length} ta belgi`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setCustomMessage('')
                    setSmsType('default')
                  }}
                  className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="button"
                  onClick={handleSendSMS}
                  disabled={
                    loading ||
                    smsCredits === 0 ||
                    (smsType === 'custom' && !customMessage.trim())
                  }
                  className="flex-1 h-11 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  {loading ? 'Yuborilmoqda...' : 'SMS Yuborish'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


// ─── Desktop Table Row ────────────────────────────────────────────────
function SortableDebtRow({
  debt,
  onAction,
  isCashier,
}: {
  debt: Debt
  onAction: (action: string, debt: Debt) => void
  isCashier?: boolean
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: debt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const remaining = Math.max(0, debt.amount - debt.paid_amount)
  const isFullyPaid = debt.status === 'paid' || remaining === 0
  const paidPercent =
    debt.amount > 0 ? Math.min(100, Math.round((debt.paid_amount / debt.amount) * 100)) : 0
  const dueDateInfo = getDueDateInfo(debt.due_date, isFullyPaid)

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(debt.debtor_phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
        isDragging ? 'bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-1 ring-blue-300 dark:ring-blue-800' : ''
      }`}
    >
      {/* 1. Drag Handle + Debtor Profile */}
      <td className="py-3.5 pl-4 pr-3">
        <div className="flex items-center gap-3">
          {/* Drag Grip Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors touch-none focus:outline-none"
            title="Surish uchun torting"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
          </button>

          {/* Gradient Initial Avatar */}
          <div
            className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
              debt.debtor_name
            )} text-white flex items-center justify-center font-extrabold text-xs shadow-xs flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => router.push(`/debtor/${encodeURIComponent(debt.debtor_phone || debt.id)}`)}
          >
            {getInitials(debt.debtor_name)}
          </div>

          {/* Name & Phone */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => router.push(`/debtor/${encodeURIComponent(debt.debtor_phone || debt.id)}`)}
                className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate max-w-[200px]"
                title={debt.debtor_name}
              >
                {debt.debtor_name}
              </span>

              {debt.folder && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800"
                  title={`Papka: ${debt.folder.name}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: debt.folder.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                    {debt.folder.name}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {debt.debtor_phone ? (
                <>
                  <span>{formatPhoneDisplay(debt.debtor_phone)}</span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    title="Raqamdan nusxa olish"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-slate-400 italic font-sans">
                  Tel kiritilmagan
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Amount & Progress Bar */}
      <td className="py-3.5 px-3 min-w-[170px]">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Jami:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {formatCurrency(debt.amount)}
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyPaid ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${paidPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>{paidPercent}% to&apos;landi</span>
            {debt.paid_amount > 0 && (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                {formatCurrencyShort(debt.paid_amount)}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 3. Remaining Balance */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        {isFullyPaid ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            To&apos;langan
          </span>
        ) : (
          <div className="space-y-0.5">
            <div className="font-black text-sm font-mono tracking-tight text-orange-600 dark:text-orange-400">
              {formatCurrency(remaining)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Qoldiq qarz</div>
          </div>
        )}
      </td>

      {/* 4. Smart Due Date Pill */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border ${dueDateInfo.pillClasses}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dueDateInfo.badgeDot}`} />
          <span>{dueDateInfo.text}</span>
        </span>
      </td>

      {/* 5. Direct Quick Action Buttons (Surfaced!) */}
      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick Payment Button */}
          {!isFullyPaid && (
            <Button
              type="button"
              size="sm"
              onClick={() => onAction('payment', debt)}
              className="h-8 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-200/90 dark:border-emerald-800/80 rounded-xl font-bold text-xs shadow-2xs transition-all hover:scale-105"
              title="To'lov qabul qilish"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              To&apos;lov
            </Button>
          )}

          {/* Quick Telegram Reminder Button (100% Free) */}
          {!isFullyPaid && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAction('telegram-remind', debt)}
              className="h-8 px-2.5 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-500 text-sky-700 dark:text-sky-300 hover:text-white border border-sky-200/80 dark:border-sky-900/60 rounded-xl font-bold text-xs shadow-2xs transition-all hover:scale-105"
              title="Telegram orqali eslatma (Bepul)"
            >
              <Send className="w-3.5 h-3.5 mr-1 text-sky-500 hover:text-white" />
              Telegram
            </Button>
          )}

          {/* Quick SMS Button */}
          {!isFullyPaid && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAction('sms-auto', debt)}
              className="h-8 px-2.5 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-200/80 dark:border-blue-900/60 rounded-xl font-bold text-xs shadow-2xs transition-all hover:scale-105"
              title="SMS eslatma jo'natish"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              SMS
            </Button>
          )}

          {/* Quick Call Link */}
          <a
            href={`tel:${debt.debtor_phone}`}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all hover:scale-105"
            title="Qarzdorga qo'ng'iroq qilish"
          >
            <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </a>

          {/* Dropdown Menu for More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
              <DropdownMenuItem
                onClick={() => router.push(`/debtor/${encodeURIComponent(debt.debtor_phone || debt.id)}`)}
                className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                Profilni ko&apos;rish
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportSingleDebtReceiptPDF(debt)}
                className="rounded-xl text-xs font-semibold py-2 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-700 dark:focus:text-indigo-300 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Chek / Kvitansiya (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction('edit', debt)}
                className="rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                Tahrirlash
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction('telegram-remind', debt)}
                className="rounded-xl text-xs font-semibold py-2 cursor-pointer text-sky-600 dark:text-sky-400 focus:text-sky-700 dark:focus:text-sky-300 focus:bg-sky-50 dark:focus:bg-sky-950/40 transition-colors"
              >
                <Send className="w-3.5 h-3.5 mr-2 text-sky-500" />
                Telegram eslatma (Bepul)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction('sms-custom', debt)}
                className="rounded-xl text-xs font-semibold py-2 cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300 focus:bg-blue-50 dark:focus:bg-blue-950/40 transition-colors"
              >
                <Send className="w-3.5 h-3.5 mr-2 text-blue-500 dark:text-blue-400" />
                SMS (O&apos;zim yozaman)
              </DropdownMenuItem>
              {!isCashier && (
                <>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => onAction('delete', debt)}
                    className="rounded-xl text-xs font-semibold py-2 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-600 dark:text-rose-400" />
                    O&apos;chirish
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

// ─── Mobile Sortable Debt Card (with horizontal swipe actions) ──────────
function SortableDebtCard({
  debt,
  onAction,
}: {
  debt: Debt
  onAction: (action: string, debt: Debt) => void
}) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: debt.id })

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDragging) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    isHorizontalSwipe.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isDragging) return

    const deltaX = e.touches[0].clientX - touchStartRef.current.x
    const deltaY = e.touches[0].clientY - touchStartRef.current.y

    // First threshold to establish direction
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
        if (isHorizontalSwipe.current) {
          setIsSwiping(true)
        }
      }
    }

    if (isHorizontalSwipe.current) {
      // Horizontal swipe active - clamp between -110 and 110 px
      const clamped = Math.max(-110, Math.min(110, deltaX))
      setSwipeOffset(clamped)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return

    const currentOffset = swipeOffset
    setIsSwiping(false)
    setSwipeOffset(0)
    touchStartRef.current = null
    isHorizontalSwipe.current = null

    // Threshold check (70px)
    if (currentOffset > 70) {
      // Swiped right -> To'lov qo'shish
      nativeHaptics.impact('light').catch(() => {})
      onAction('payment', debt)
    } else if (currentOffset < -70) {
      // Swiped left -> Telegram eslatma
      if (debt.debtor_phone) {
        nativeHaptics.impact('light').catch(() => {})
        onAction('telegram-remind', debt)
      } else {
        toast.info("Telegram eslatma uchun telefon raqami kiritilishi kerak")
      }
    }
  }

  const handleTouchCancel = () => {
    setIsSwiping(false)
    setSwipeOffset(0)
    touchStartRef.current = null
    isHorizontalSwipe.current = null
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const remaining = Math.max(0, debt.amount - debt.paid_amount)
  const isFullyPaid = debt.status === 'paid' || remaining === 0
  const paidPercent =
    debt.amount > 0 ? Math.min(100, Math.round((debt.paid_amount / debt.amount) * 100)) : 0
  const dueDateInfo = getDueDateInfo(debt.due_date, isFullyPaid)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-2xl select-none"
    >
      {/* Swipe Underlay Action Reveals */}
      <div
        className={`absolute inset-0 rounded-2xl flex items-center justify-between px-5 pointer-events-none transition-colors duration-150 ${
          swipeOffset > 25
            ? 'bg-emerald-600'
            : swipeOffset < -25
            ? 'bg-sky-500'
            : 'bg-transparent'
        }`}
      >
        {/* Left reveal: + To'lov (revealed when swiping right) */}
        <div
          className={`flex items-center gap-2 text-white font-bold transition-opacity duration-150 ${
            swipeOffset > 20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-white font-extrabold text-sm tracking-tight">+ To&apos;lov</span>
        </div>

        {/* Right reveal: Telegram eslatma (revealed when swiping left) */}
        <div
          className={`flex items-center gap-2 text-white font-bold transition-opacity duration-150 ${
            swipeOffset < -20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-white font-extrabold text-sm tracking-tight">Telegram</span>
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Foreground Interactive Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 space-y-3.5 ${
          isDragging ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Top Header: Avatar + Name + Due Date */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Drag Handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 touch-none focus:outline-none transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
              </svg>
            </button>

            {/* Initial Avatar */}
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                debt.debtor_name
              )} text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => router.push(`/debtor/${encodeURIComponent(debt.debtor_phone || debt.id)}`)}
            >
              {getInitials(debt.debtor_name)}
            </div>

            <div className="min-w-0">
              <div
                className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                onClick={() => router.push(`/debtor/${encodeURIComponent(debt.debtor_phone || debt.id)}`)}
              >
                {debt.debtor_name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {debt.debtor_phone ? (
                  formatPhoneDisplay(debt.debtor_phone)
                ) : (
                  <span className="text-slate-400 italic font-sans">Tel yo&apos;q</span>
                )}
              </div>
            </div>
          </div>

          {/* Due Date Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border flex-shrink-0 ${dueDateInfo.pillClasses}`}
          >
            <span className={`w-1 h-1 rounded-full ${dueDateInfo.badgeDot}`} />
            <span>{dueDateInfo.text}</span>
          </span>
        </div>

        {/* Financials & Progress Bar */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Qoldiq summa:</span>
            <span
              className={`font-black text-base font-mono tracking-tight ${
                isFullyPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {formatCurrency(remaining)}
            </span>
          </div>

          <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${paidPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>Jami: {formatCurrencyShort(debt.amount)}</span>
            <span>{paidPercent}% to&apos;langan</span>
          </div>
        </div>

        {/* Mobile Action Bar: Quick Communication Icons + Prominent Payment CTA */}
        <div className="flex items-center gap-2 pt-1.5">
          {/* Quick Communication Actions: Phone, Telegram, SMS */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Phone */}
            {debt.debtor_phone ? (
              <a
                href={`tel:${debt.debtor_phone}`}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center transition-all active:scale-90"
                title="Qo'ng'iroq qilish"
                aria-label="Qo'ng'iroq"
              >
                <Phone className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => toast.info("Ushbu qarzdorning telefon raqami kiritilmagan")}
                className="w-9 h-9 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-center cursor-not-allowed opacity-60"
                title="Telefon kiritilmagan"
                aria-label="Telefon kiritilmagan"
              >
                <Phone className="w-4 h-4 opacity-50" />
              </button>
            )}

            {/* Telegram */}
            <button
              type="button"
              onClick={() => {
                if (!debt.debtor_phone) {
                  toast.info("Telegram eslatma uchun telefon raqami kiritilishi kerak")
                  return
                }
                onAction('telegram-remind', debt)
              }}
              disabled={!debt.debtor_phone}
              className={`w-9 h-9 rounded-xl transition-all active:scale-90 flex items-center justify-center border ${
                debt.debtor_phone
                  ? 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white border-sky-200 dark:border-sky-900/60 shadow-2xs'
                  : 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
              }`}
              title={debt.debtor_phone ? "Telegram orqali eslatma (Bepul)" : "Telefon kiritilmagan"}
              aria-label="Telegram"
            >
              <Send className="w-3.5 h-3.5" />
            </button>

            {/* SMS */}
            <button
              type="button"
              onClick={() => {
                if (!debt.debtor_phone) {
                  toast.info("SMS yuborish uchun telefon raqami kiritilishi kerak")
                  return
                }
                onAction('sms-auto', debt)
              }}
              disabled={!debt.debtor_phone}
              className={`w-9 h-9 rounded-xl transition-all active:scale-90 flex items-center justify-center border ${
                debt.debtor_phone
                  ? 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border-blue-200 dark:border-blue-900/60 shadow-2xs'
                  : 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
              }`}
              title={debt.debtor_phone ? "SMS xabar yuborish" : "Telefon kiritilmagan"}
              aria-label="SMS"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Action Button: Prominent + To'lov olish */}
          {isFullyPaid ? (
            <button
              type="button"
              onClick={() => onAction('payment', debt)}
              className="flex-1 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>To&apos;langan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAction('payment', debt)}
              className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>To&apos;lov olish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main DebtsListDraggable Component ────────────────────────────────
export function DebtsListDraggable({
  debts,
  onUpdate,
  onAddNewDebt,
}: DebtsListDraggableProps) {
  const router = useRouter()
  const { user } = useUser()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'paid'>('all')
  const [sortBy, setSortBy] = useState<'remaining-desc' | 'remaining-asc' | 'due-asc' | 'date-desc' | 'name-asc'>('date-desc')

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSMSOpen, setIsSMSOpen] = useState(false)
  const [smsTypeToOpen, setSmsTypeToOpen] = useState<'default' | 'custom'>('default')
  const [reminderChannel, setReminderChannel] = useState<'telegram' | 'sms'>('telegram')
  const [isAutoRemindersOpen, setIsAutoRemindersOpen] = useState(false)
  const [localDebts, setLocalDebts] = useState<Debt[]>(debts)

  const handleExport = (format: 'excel' | 'pdf') => {
    const filterNames: Record<string, string> = {
      all: 'Barcha qarzlar',
      active: 'Faol qarzdorlar',
      overdue: "Muddati o'tgan qarzlar",
      paid: "To'langan qarzlar",
    }
    const filterLabel = filterNames[statusFilter] || 'Barchasi'

    if (format === 'excel') {
      exportDebtsToExcel({
        storeName: user?.store_name || user?.full_name || 'Qarz Daftari',
        filterLabel,
        debts: displayedDebts,
      })
    } else {
      exportDebtsToPDF({
        storeName: user?.store_name || user?.full_name || 'Qarz Daftari',
        filterLabel,
        debts: displayedDebts,
      })
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setLocalDebts(debts)
  }, [debts])

  // Count metrics for status filter chips
  const counts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let activeCount = 0
    let overdueCount = 0
    let paidCount = 0

    localDebts.forEach((d) => {
      const remaining = d.amount - d.paid_amount
      const isPaid = d.status === 'paid' || remaining <= 0
      if (isPaid) {
        paidCount++
      } else {
        activeCount++
        if (d.status === 'overdue' || (d.due_date && new Date(d.due_date) < today)) {
          overdueCount++
        }
      }
    })

    return {
      all: localDebts.length,
      active: activeCount,
      overdue: overdueCount,
      paid: paidCount,
    }
  }, [localDebts])

  // Filtered & Sorted debts
  const displayedDebts = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase()
    const cleanDigits = search.replace(/\D/g, '')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let result = localDebts.filter((d) => {
      // 1. Search query filter
      if (cleanSearch) {
        const matchesName = d.debtor_name.toLowerCase().includes(cleanSearch)
        const matchesPhone = d.debtor_phone.includes(cleanDigits || cleanSearch)
        if (!matchesName && !matchesPhone) return false
      }

      // 2. Status chip filter
      const remaining = d.amount - d.paid_amount
      const isPaid = d.status === 'paid' || remaining <= 0

      if (statusFilter === 'active' && isPaid) return false
      if (statusFilter === 'paid' && !isPaid) return false
      if (statusFilter === 'overdue') {
        if (isPaid) return false
        const isOverdue = d.status === 'overdue' || (d.due_date && new Date(d.due_date) < today)
        if (!isOverdue) return false
      }

      return true
    })

    // 3. Sorting
    result.sort((a, b) => {
      const remA = Math.max(0, a.amount - a.paid_amount)
      const remB = Math.max(0, b.amount - b.paid_amount)

      switch (sortBy) {
        case 'remaining-desc':
          return remB - remA
        case 'remaining-asc':
          return remA - remB
        case 'due-asc': {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        case 'name-asc':
          return a.debtor_name.localeCompare(b.debtor_name)
        case 'date-desc':
        default:
          return new Date(b.debt_date || 0).getTime() - new Date(a.debt_date || 0).getTime()
      }
    })

    return result
  }, [localDebts, search, statusFilter, sortBy])

  // Total filtered remaining sum
  const totalFilteredRemaining = useMemo(() => {
    return displayedDebts.reduce((sum, d) => sum + Math.max(0, d.amount - d.paid_amount), 0)
  }, [displayedDebts])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localDebts.findIndex((d) => d.id === active.id)
    const newIndex = localDebts.findIndex((d) => d.id === over.id)
    const newDebts = arrayMove(localDebts, oldIndex, newIndex)
    setLocalDebts(newDebts)
  }

  const handleAction = async (action: string, debt: Debt) => {
    setSelectedDebt(debt)

    switch (action) {
      case 'payment':
        setIsPaymentOpen(true)
        break
      case 'edit':
        setIsEditOpen(true)
        break
      case 'telegram-remind':
        setReminderChannel('telegram')
        setSmsTypeToOpen('default')
        setIsSMSOpen(true)
        break
      case 'sms-auto':
        setReminderChannel('sms')
        setSmsTypeToOpen('default')
        setIsSMSOpen(true)
        break
      case 'sms-custom':
        setSmsTypeToOpen('custom')
        setIsSMSOpen(true)
        break
      case 'delete':
        if (user?.role === 'cashier') {
          alert("Kassir qarzni o'chirish huquqiga ega emas. Faqat do'kon egasi o'chira oladi.")
          return
        }
        if (confirm(`${debt.debtor_name} ning qarz yozuvini o'chirmoqchimisiz?`)) {
          try {
            const response = await fetch(`/api/debts/${debt.id}`, { method: 'DELETE' })
            if (response.ok) {
              onUpdate()
            } else {
              const data = await response.json()
              alert(data.error || "O'chirishda xatolik yuz berdi")
            }
          } catch (error) {
            console.error('Delete error:', error)
          }
        }
        break
    }
  }

  return (
    <div className="space-y-4">
      {/* ─── CRM TOOLBAR: Search, Status Chips & Sort ─────────────────── */}
      <div className="flex flex-col gap-2.5">
        {/* Top line: Search input + Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              type="text"
              placeholder="Qarzdor ismi yoki telefoni bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 h-10 rounded-2xl border-slate-200/90 dark:border-slate-800 text-xs shadow-2xs focus-visible:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 transition-colors w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Sort + Auto Reminders + Export */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0">
            {/* Sort Select */}
            <div className="flex-1 sm:flex-none min-w-[130px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 w-full px-3 pr-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors"
              >
                <option value="date-desc">Eng yangilar</option>
                <option value="remaining-desc">Qoldiq: Ko&apos;p</option>
                <option value="remaining-asc">Qoldiq: Kam</option>
                <option value="due-asc">Muddati yaqin</option>
                <option value="name-asc">Ism (A-Z)</option>
              </select>
            </div>

            {/* Auto Reminders Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAutoRemindersOpen(true)}
              className="h-10 px-3 rounded-2xl border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700 flex items-center gap-1.5 transition-all shrink-0"
              title="Yaqinlashgan qarzlar uchun avtomatik eslatmalar"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Avto Eslatma</span>
            </Button>

            {/* Export Dropdown Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-3 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
                  title="Qarzlar ro'yxatini yuklab olish"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="whitespace-nowrap">Eksport</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in-50 zoom-in-95"
              >
                <DropdownMenuItem
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 focus:text-emerald-700 dark:focus:text-emerald-300 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold">Excel (.xlsx)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Jadval va hisob-kitoblar</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/50 focus:text-rose-700 dark:focus:text-rose-300 cursor-pointer mt-0.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold">PDF Hisobot (A4)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Chop etish va hisobot uchun</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bottom line: Filter Chips & Active Summary */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pr-4 pb-1 sm:pb-0 scrollbar-none">
            {/* 1. All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Barchasi</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {counts.all}
              </span>
            </button>

            {/* 2. Active Debtors */}
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'active'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200/60 dark:border-orange-900/50'
              }`}
            >
              <span>Qarzdorlar</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === 'active'
                    ? 'bg-orange-700 text-white'
                    : 'bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200'
                }`}
              >
                {counts.active}
              </span>
            </button>

            {/* 3. Overdue */}
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>Muddati o&apos;tgan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                }`}
              >
                {counts.overdue}
              </span>
            </button>

            {/* 4. Paid in Full */}
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-900/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>To&apos;langanlar</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {counts.paid}
              </span>
            </button>
          </div>

          {/* Active Summary Pill */}
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Ko&apos;rsatilmoqda:{' '}
            <span className="text-slate-900 dark:text-slate-100 font-bold">{displayedDebts.length} ta</span>
            {totalFilteredRemaining > 0 && (
              <>
                {' '}
                • Qoldiq:{' '}
                <span className="text-orange-600 dark:text-orange-400 font-bold font-mono">
                  {formatCurrencyShort(totalFilteredRemaining)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── EMPTY STATES ────────────────────────────────────────────── */}
      {displayedDebts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-400">
            {search ? <Search className="w-7 h-7" /> : <Sparkles className="w-7 h-7 text-blue-500" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {search
                ? "Qidiruvingiz bo'yicha qarz topilmadi"
                : statusFilter === 'overdue'
                ? "Muddati o'tgan qarzlar yo'q!"
                : statusFilter === 'paid'
                ? "To'langan qarzlar ro'yxati bo'sh"
                : "Hozircha qarzlar mavjud emas"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {search
                ? `"${search}" so'rovi bo'yicha hech qanday qarzdor topilmadi. Qidiruvni tozalab ko'ring.`
                : statusFilter === 'overdue'
                ? 'Ajoyib! Barcha mijozlaringiz to\'lov muddatlariga amal qilmoqda.'
                : 'Do\'koningizga yangi qarz kiritish uchun yuqoridagi "+ Qarz qo\'shish" tugmasini bosing.'}
            </p>
          </div>
          {search ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Qidiruvni tozalash
            </Button>
          ) : (
            onAddNewDebt && (
              <Button
                type="button"
                size="sm"
                onClick={onAddNewDebt}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Birinchi qarzni kiritish
              </Button>
            )
          )}
        </div>
      ) : (
        <>
          {/* ─── DESKTOP TABLE VIEW (Modern Enterprise Layout) ───────── */}
          <div className="hidden lg:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    <tr>
                      <th className="py-3 pl-4 pr-3">Qarzdor</th>
                      <th className="py-3 px-3">Summa va Foiz</th>
                      <th className="py-3 px-3">Qoldiq</th>
                      <th className="py-3 px-3">To&apos;lov muddati</th>
                      <th className="py-3 pl-3 pr-4 text-right">Tezkor amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <SortableContext
                      items={displayedDebts.map((d) => d.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {displayedDebts.map((debt) => (
                        <SortableDebtRow
                          key={debt.id}
                          debt={debt}
                          onAction={handleAction}
                          isCashier={user?.role === 'cashier'}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>

          {/* ─── MOBILE CARD VIEW ────────────────────────────────────── */}
          <div className="lg:hidden space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedDebts.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {displayedDebts.map((debt) => (
                  <SortableDebtCard
                    key={debt.id}
                    debt={debt}
                    onAction={handleAction}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {/* ─── MODALS ──────────────────────────────────────────────────── */}
      <AutoRemindersModal
        open={isAutoRemindersOpen}
        onOpenChange={setIsAutoRemindersOpen}
        onSuccess={onUpdate}
      />

      {selectedDebt && (
        <>
          <AddPaymentModal
            debt={selectedDebt}
            open={isPaymentOpen}
            onOpenChange={setIsPaymentOpen}
            onSuccess={onUpdate}
          />
          <EditDebtModal
            debt={selectedDebt}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSuccess={onUpdate}
          />
          <SMSDialog
            debt={selectedDebt}
            open={isSMSOpen}
            onOpenChange={setIsSMSOpen}
            initialChannel={reminderChannel}
            onSent={onUpdate}
          />
        </>
      )}
    </div>
  )
}
