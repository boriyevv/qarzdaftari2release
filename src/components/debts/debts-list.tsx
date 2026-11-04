// src/components/debts/debts-list.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Calendar, User } from 'lucide-react'

interface Debt {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  paid_amount: number
  status: string
  due_date: string | null
  created_at: string
}

interface DebtsListProps {
  debts: Debt[]
}

export function DebtsList({ debts }: DebtsListProps) {
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleDebtorClick = (phone: string) => {
    router.push(`/debtor/${encodeURIComponent(phone)}`)
  }

  if (debts.length === 0) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-400">Hozircha qarzlar yo&apos;q</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Yangi qarz qo&apos;shish uchun + tugmasini bosing
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2" data-tour="debts-list">
      {/* Hint for first-time users */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 mb-4 lg:hidden">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          💡 <strong>Maslahat:</strong> Qarzdor ustiga bosing - to&apos;liq ma&apos;lumot va tarix
        </p>
      </div>

      {debts.map((debt) => (
        <Card
          key={debt.id}
          className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all duration-150 active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            {/* Left: Debtor Info */}
            <div className="flex-1 min-w-0"
              onClick={() => handleDebtorClick(debt.debtor_phone)}
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                <h3 className="font-semibold truncate text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{debt.debtor_name}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{debt.debtor_phone}</p>

              {/* Due Date */}
              {debt.due_date && (
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Muddat: {formatDate(debt.due_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Center: Amount Info */}
            <div className="text-right mx-4">
              <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {formatCurrency(debt.amount - debt.paid_amount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {debt.paid_amount > 0 && `${formatCurrency(debt.paid_amount)} to'landi`}
              </p>
            </div>

            {/* Right: Status + Arrow */}
            <div className="flex items-center gap-2">
              <Badge variant={debt.status === 'paid' ? 'default' : 'secondary'}>
                {debt.status === 'paid' ? 'To\'landi' : 'Ochiq'}
              </Badge>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}