// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/user-context'
import { useRouter } from 'next/navigation'
import { FolderFilterBar } from '@/components/folders/folder-filter-bar'
import { AddDebtModal } from '@/components/debts/add-debt-modal'
import { DebtsListDraggable } from '@/components/debts/debts-list-draggable'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'
import { InteractiveTour } from '@/components/onboarding/interactive-tour'
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm">Yuklanmoqda...</p>
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
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Subscription & Onboarding Guides */}
        <SubscriptionBanner />
        <InteractiveTour />

        {/* Financial Overview Stats Cards */}
        <div id="tour-stats">
          <DashboardStats
            totalDebts={totalDebts}
            totalAmount={totalAmount}
            totalPaid={totalPaid}
            totalRemaining={totalRemaining}
            overdueCount={overdueCount}
          />
        </div>

        {/* Horizontal Folder Filter Bar */}
        <div id="tour-folders" className="pt-2">
          <FolderFilterBar
            activeFolder={activeFolder}
            onFolderChange={handleFolderChange}
          />
        </div>

        {/* Debts List */}
        <div
          id="tour-debts-list"
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 sm:p-6 min-h-[300px]"
        >
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="h-9 w-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-9 w-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="h-2.5 w-24 bg-slate-200/70 dark:bg-slate-800/70 rounded-full" />
                    </div>
                  </div>
                  <div className="hidden sm:block w-36 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-2 bg-slate-200/70 dark:bg-slate-800/70 rounded-full" />
                  </div>
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="flex gap-1.5">
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DebtsListDraggable
              debts={debts}
              onUpdate={fetchDebts}
              onAddNewDebt={() => setIsAddDebtOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="lg:hidden fixed bottom-20 right-5 z-40">
        <button
          id="tour-add-debt-mobile"
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
