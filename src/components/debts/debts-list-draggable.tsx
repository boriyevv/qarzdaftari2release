// src/components/debts/debts-list-draggable.tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { formatCurrency } from '@/src/lib/utils/currency'
import { AddPaymentModal } from './add-payment-modal'
import { EditDebtModal } from './edit-debt-modal'
import { cn } from '@/src/lib/utills'

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

export function DebtsListDraggable({ debts, onUpdate }: DebtsListDraggableProps) {
  const [search, setSearch] = useState('')
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [localDebts, setLocalDebts] = useState(debts)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Update local state when props change
  useState(() => {
    setLocalDebts(debts)
  })

  const filteredDebts = localDebts.filter(debt =>
    debt.debtor_name.toLowerCase().includes(search.toLowerCase()) ||
    debt.debtor_phone.includes(search)
  )

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

  const handleDelete = async (debtId: string) => {
    if (!confirm('Qarzni o\'chirmoqchimisiz?')) return

    try {
      const response = await fetch(`/api/debts/${debtId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Drag handlers
  const handleDragStart = (debtId: string) => {
    setDraggedItem(debtId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    const draggedIdx = localDebts.findIndex(d => d.id === draggedItem)
    const targetIdx = localDebts.findIndex(d => d.id === targetId)

    if (draggedIdx === -1 || targetIdx === -1) return

    const newDebts = [...localDebts]
    const [removed] = newDebts.splice(draggedIdx, 1)
    newDebts.splice(targetIdx, 0, removed)

    setLocalDebts(newDebts)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    // Here you could save the new order to backend if needed
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
              {filteredDebts.map((debt) => {
                const remaining = debt.amount - debt.paid_amount
                return (
                  <tr
                    key={debt.id}
                    draggable
                    onDragStart={() => handleDragStart(debt.id)}
                    onDragOver={(e) => handleDragOver(e, debt.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'hover:bg-slate-50 cursor-move',
                      draggedItem === debt.id && 'opacity-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
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
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(debt.amount)}</div>
                      {debt.paid_amount > 0 && (
                        <div className="text-sm text-green-600">
                          {formatCurrency(debt.paid_amount)} to'langan
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={remaining > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        {formatCurrency(remaining)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {debt.due_date
                        ? new Date(debt.due_date).toLocaleDateString('uz-UZ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(debt.status)}</td>
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDebt(debt)
                              setIsPaymentOpen(true)
                            }}
                          >
                            To'lov qo'shish
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDebt(debt)
                              setIsEditOpen(true)
                            }}
                          >
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(debt.id)}
                            className="text-red-600"
                          >
                            O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredDebts.map((debt) => {
          const remaining = debt.amount - debt.paid_amount
          return (
            <div
              key={debt.id}
              draggable
              onDragStart={() => handleDragStart(debt.id)}
              onDragOver={(e) => handleDragOver(e, debt.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'bg-white rounded-lg border p-4 space-y-3 cursor-move active:opacity-50',
                draggedItem === debt.id && 'opacity-50'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
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
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDebt(debt)
                        setIsPaymentOpen(true)
                      }}
                    >
                      To'lov qo'shish
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDebt(debt)
                        setIsEditOpen(true)
                      }}
                    >
                      Tahrirlash
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(debt.id)}
                      className="text-red-600"
                    >
                      O'chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y">
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

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {debt.due_date
                    ? new Date(debt.due_date).toLocaleDateString('uz-UZ')
                    : 'Muddat yo\'q'}
                </div>
                {getStatusBadge(debt.status)}
              </div>
            </div>
          )
        })}
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
        </>
      )}
    </div>
  )
}