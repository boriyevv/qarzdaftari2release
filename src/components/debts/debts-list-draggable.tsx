// src/components/debts/debts-list-draggable.tsx
// Touch-enabled drag & drop with @dnd-kit + SMS INTEGRATION
'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/currency'
import { AddPaymentModal } from './add-payment-modal'
import { EditDebtModal } from './edit-debt-modal'
import { cn } from '@/lib/utills'
import { MessageSquare, Send, AlertCircle } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Debt {
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
}

// SMS Dialog Component
function SMSDialog({ 
  debt, 
  open, 
  onOpenChange 
}: { 
  debt: Debt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [smsType, setSmsType] = useState<'default' | 'custom'>('default')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [smsCredits, setSmsCredits] = useState(0)

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

  const handleSendSMS = async () => {
    if (!debt) return
    
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
        onOpenChange(false)
        setCustomMessage('')
        setSmsType('default')
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

  if (!debt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onOpenChange(false)
                setCustomMessage('')
                setSmsType('default')
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
  )
}

// Sortable Debt Row (Desktop)
function SortableDebtRow({ debt, onAction }: { debt: Debt; onAction: (action: string, debt: Debt) => void }) {
  const router = useRouter()
  const handleDebtorClick = (phone: string) => {
    router.push(`/debtor/${encodeURIComponent(phone)}`)
  }

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
    opacity: isDragging ? 0.5 : 1,
  }

  const remaining = debt.amount - debt.paid_amount

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Kutilmoqda' },
      paid: { variant: 'default', label: "To'langan" },
      overdue: { variant: 'destructive', label: "Muddati o'tgan" },
      blacklisted: { variant: 'destructive', label: 'Bloklangan' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50">
      <td className="px-4 py-3" onClick={() => handleDebtorClick(debt.debtor_phone)}>
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move p-1 hover:bg-slate-200 rounded touch-none"
          >
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
          </div>

          {debt.folder && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: debt.folder.color }}
            />
          )}
          <div>
            <div className="font-medium">{debt.debtor_name}</div>
            <div className="text-sm text-slate-500">{debt.debtor_phone}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3" onClick={() => handleDebtorClick(debt.debtor_phone)}>
        <div className="font-medium">{formatCurrency(debt.amount)}</div>
        {debt.paid_amount > 0 && (
          <div className="text-sm text-green-600">
            {formatCurrency(debt.paid_amount)} to'langan
          </div>
        )}
      </td>
      <td className="px-4 py-3" onClick={() => handleDebtorClick(debt.debtor_phone)}>
        <div className={remaining > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
          {formatCurrency(remaining)}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600" onClick={() => handleDebtorClick(debt.debtor_phone)}>
        {debt.due_date ? new Date(debt.due_date).toLocaleDateString('uz-UZ') : '—'}
      </td>
      <td className="px-4 py-3" onClick={() => handleDebtorClick(debt.debtor_phone)}>{getStatusBadge(debt.status)}</td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction('payment', debt)}>
              To'lov qo'shish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit', debt)}>
              Tahrirlash
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => onAction('sms-auto', debt)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS yuborish (Auto)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('sms-custom', debt)}>
              <Send className="w-4 h-4 mr-2" />
              SMS yuborish (Custom)
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => onAction('delete', debt)} className="text-red-600">
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// Sortable Debt Card (Mobile) - SAME SMS MENU ADDED
function SortableDebtCard({ debt, onAction }: { debt: Debt; onAction: (action: string, debt: Debt) => void }) {
  const router = useRouter()
  const handleDebtorClick = (phone: string) => {
    router.push(`/debtor/${encodeURIComponent(phone)}`)
  }

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
    opacity: isDragging ? 0.5 : 1,
  }

  const remaining = debt.amount - debt.paid_amount

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Kutilmoqda' },
      paid: { variant: 'default', label: "To'langan" },
      overdue: { variant: 'destructive', label: "Muddati o'tgan" },
      blacklisted: { variant: 'destructive', label: 'Bloklangan' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div
          onClick={() => handleDebtorClick(debt.debtor_phone)}
          className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move p-2 hover:bg-slate-100 rounded touch-none"
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
          </div>

          {debt.folder && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: debt.folder.color }}
            />
          )}
          <div>
            <div className="font-medium">{debt.debtor_name}</div>
            <div className="text-sm text-slate-500">{debt.debtor_phone}</div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction('payment', debt)}>
              To'lov qo'shish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit', debt)}>
              Tahrirlash
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => onAction('sms-auto', debt)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS (Auto)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('sms-custom', debt)}>
              <Send className="w-4 h-4 mr-2" />
              SMS (Custom)
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => onAction('delete', debt)} className="text-red-600">
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y"
        onClick={() => handleDebtorClick(debt.debtor_phone)}>
        <div>
          <div className="text-xs text-slate-500">Jami</div>
          <div className="font-medium">{formatCurrency(debt.amount)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Qoldiq</div>
          <div className={remaining > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between"
        onClick={() => handleDebtorClick(debt.debtor_phone)}>
        <div className="text-sm text-slate-600">
          {debt.due_date ? new Date(debt.due_date).toLocaleDateString('uz-UZ') : 'Muddat yo\'q'}
        </div>
        {getStatusBadge(debt.status)}
      </div>
    </div>
  )
}

export function DebtsListDraggable({ debts, onUpdate }: DebtsListDraggableProps) {
  const [search, setSearch] = useState('')
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSMSOpen, setIsSMSOpen] = useState(false)
  const [smsTypeToOpen, setSmsTypeToOpen] = useState<'default' | 'custom'>('default')
  const [localDebts, setLocalDebts] = useState(debts)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setLocalDebts(debts)
  }, [debts])

  const filteredDebts = localDebts.filter(debt =>
    debt.debtor_name.toLowerCase().includes(search.toLowerCase()) ||
    debt.debtor_phone.includes(search)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

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
      case 'sms-auto':
        setSmsTypeToOpen('default')
        setIsSMSOpen(true)
        break
      case 'sms-custom':
        setSmsTypeToOpen('custom')
        setIsSMSOpen(true)
        break
      case 'delete':
        if (confirm('Qarzni o\'chirmoqchimisiz?')) {
          try {
            const response = await fetch(`/api/debts/${debt.id}`, {
              method: 'DELETE',
            })
            if (response.ok) {
              onUpdate()
            }
          } catch (error) {
            console.error('Delete error:', error)
          }
        }
        break
    }
  }

  if (debts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-slate-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Qarzlar yo'q</h3>
        <p className="text-slate-600">
          Yangi qarz qo'shish uchun pastdagi tugmani bosing
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Qarzdor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Summa
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Qoldiq
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Muddat
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Holat
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredDebts.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredDebts.map((debt) => (
                    <SortableDebtRow
                      key={debt.id}
                      debt={debt}
                      onAction={handleAction}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredDebts.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredDebts.map((debt) => (
              <SortableDebtCard
                key={debt.id}
                debt={debt}
                onAction={handleAction}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Modals */}
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
          />
        </>
      )}
    </div>
  )
}