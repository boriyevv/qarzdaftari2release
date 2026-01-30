// src/app/dashboard/page.tsx
// Fully responsive with mobile FAB, drawer sidebar, drag & drop
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/contexts/user-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FoldersSidebarResponsive } from '@/components/folders/folders-sidebar-responsive'
import { AddDebtModal } from '@/components/debts/add-debt-modal'
import { DebtsListDraggable } from '@/components/debts/debts-list-draggable'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { Sheet, SheetContent } from '@/components/ui/sheet'


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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleFolderChange = (folderId: string) => {
    setActiveFolder(folderId)
    setIsSidebarOpen(false)
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Yuklanmoqda...</p>
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
    <>
      {/* ========================================
          MOBILE LAYOUT (< lg breakpoint)
          ======================================== */}
      <div className="lg:hidden min-h-screen bg-slate-50 pb-20">
        {/* Mobile Header */}
        <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h1 className="text-lg font-bold">Dashboard</h1>
                <p className="text-xs text-slate-600 truncate max-w-[150px]">
                  {user.store_name}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Stats */}
        <div className="p-4">
          <DashboardStats
            totalDebts={totalDebts}
            totalAmount={totalAmount}
            totalPaid={totalPaid}
            totalRemaining={totalRemaining}
            overdueCount={overdueCount}
          />
        </div>

        {/* Mobile Debts List */}
        <div className="px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DebtsListDraggable debts={debts} onUpdate={fetchDebts} />
          )}
        </div>

        {/* Mobile FAB (Floating Action Button) */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setIsAddDebtOpen(true)}
            className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Drawer */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <FoldersSidebarResponsive
              activeFolder={activeFolder}
              onFolderChange={handleFolderChange}
              onClose={() => setIsSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* ========================================
          DESKTOP LAYOUT (>= lg breakpoint)
          ======================================== */}
      <div className="hidden lg:flex min-h-screen bg-slate-50">
        {/* Desktop Sidebar */}
        <div className="w-80 border-r bg-white h-screen sticky top-0">
          <FoldersSidebarResponsive
            activeFolder={activeFolder}
            onFolderChange={setActiveFolder}
          />
        </div>

        {/* Desktop Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Desktop Header */}
          <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-sm text-slate-600">{user.store_name}</p>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <Button onClick={() => setIsAddDebtOpen(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yangi Qarz
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Chiqish

                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>

                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Desktop Stats */}
          <div className="p-6">
            <DashboardStats
              totalDebts={totalDebts}
              totalAmount={totalAmount}
              totalPaid={totalPaid}
              totalRemaining={totalRemaining}
              overdueCount={overdueCount}
            />
          </div>

          {/* Desktop Debts List */}
          <div className="flex-1 px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <DebtsListDraggable debts={debts} onUpdate={fetchDebts} />
            )}
          </div>
        </div>
      </div>

      {/* Add Debt Modal (Shared for both mobile and desktop) */}
      <AddDebtModal
        open={isAddDebtOpen}
        onOpenChange={setIsAddDebtOpen}
        onSuccess={async () => {
          fetchDebts()
          setIsAddDebtOpen(false)
        }}
      />
    </>
  )
}