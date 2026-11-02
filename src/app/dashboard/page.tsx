// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/user-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FolderFilterBar } from '@/components/folders/folder-filter-bar'
import { AddDebtModal } from '@/components/debts/add-debt-modal'
import { DebtsListDraggable } from '@/components/debts/debts-list-draggable'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'
import { OnboardingTooltip } from '@/components/onboarding/tooltip-guide'
import { AppShell } from '@/components/layout/app-shell'
import { Plus } from 'lucide-react'

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

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState('all')
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, userLoading])

  useEffect(() => {
    if (user) {
      fetchDebts()
    }
  }, [user, activeFolder])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const url =
        activeFolder === 'all'
          ? '/api/debts'
          : `/api/debts?folder_id=${activeFolder}`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setDebts(data.debts || [])
      }
    } catch (error) {
      console.error('Debts fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFolderChange = (folderId: string) => {
    setActiveFolder(folderId)
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const totalDebts = debts.length
  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0)
  const totalPaid = debts.reduce((sum, debt) => sum + debt.paid_amount, 0)
  const totalRemaining = totalAmount - totalPaid
  const overdueCount = debts.filter((d) => d.status === 'overdue').length

  return (
    <AppShell
      title="Dashboard"
      subtitle={user.store_name || "Do'kon boshqaruvi"}
      showAddDebtButton={true}
      onAddDebtSuccess={fetchDebts}
      actions={
        <Button
          onClick={() => setIsAddDebtOpen(true)}
          className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          Yangi Qarz
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Subscription & Onboarding Guides */}
        <SubscriptionBanner />
        <OnboardingTooltip />

        {/* Financial Overview Stats Cards */}
        <DashboardStats
          totalDebts={totalDebts}
          totalAmount={totalAmount}
          totalPaid={totalPaid}
          totalRemaining={totalRemaining}
          overdueCount={overdueCount}
        />

        {/* Horizontal Folder Filter Bar */}
        <div className="pt-2">
          <FolderFilterBar
            activeFolder={activeFolder}
            onFolderChange={handleFolderChange}
          />
        </div>

        {/* Debts List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
              <p className="text-slate-500 text-xs mt-3">Qarzlar yuklanmoqda...</p>
            </div>
          ) : (
            <DebtsListDraggable debts={debts} onUpdate={fetchDebts} />
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="lg:hidden fixed bottom-20 right-5 z-40">
        <button
          onClick={() => setIsAddDebtOpen(true)}
          className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Yangi qarz qo'shish"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Add Debt Modal */}
      <AddDebtModal
        open={isAddDebtOpen}
        onOpenChange={setIsAddDebtOpen}
        folderId={activeFolder === 'all' ? null : activeFolder}
        onSuccess={async () => {
          fetchDebts()
          setIsAddDebtOpen(false)
        }}
      />
    </AppShell>
  )
}
