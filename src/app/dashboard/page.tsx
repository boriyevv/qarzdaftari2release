// // src/app/dashboard/page.tsx
// // Fully responsive with mobile FAB, drawer sidebar, drag & drop
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
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'
import { OnboardingTooltip } from '@/components/onboarding/tooltip-guide'
import { MainNav } from '@/components/layout/main-nav'


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
        <SubscriptionBanner/>
        <OnboardingTooltip/>
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
        <div className="fixed bottom-16 right-6 z-30">
          <button
            onClick={() => setIsAddDebtOpen(true)}
            className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

<MainNav />

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
             <SubscriptionBanner/>



              <div className="flex items-center justify-between mt-4">
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



// src/app/dashboard/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { CompactStats } from '@/components/dashboard/compact-stats'
// import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'
// import { OnboardingTooltip } from '@/components/onboarding/tooltip-guide'
// import { DebtsList } from '@/components/debts/debts-list'
// import { Plus, BarChart3, MessageSquare, Crown, ArrowRight } from 'lucide-react'

// export default function DashboardPage() {
//   const [debts, setDebts] = useState([])
//   const [stats, setStats] = useState({
//     totalDebts: 0,
//     totalAmount: 0,
//     paidAmount: 0,
//     pendingAmount: 0,
//     overdueCount: 0,
//   })
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchDashboardData()
//   }, [])

//   const fetchDashboardData = async () => {
//     try {
//       // Fetch debts
//       const response = await fetch('/api/debts')
//       const data = await response.json()
      
//       if (response.ok) {
//         setDebts(data.debts || [])
        
//         // Calculate stats
//         const totalAmount = data.debts.reduce((sum: number, d: any) => sum + d.amount, 0)
//         const paidAmount = data.debts.reduce((sum: number, d: any) => sum + d.paid_amount, 0)
        
//         setStats({
//           totalDebts: data.debts.length,
//           totalAmount,
//           paidAmount,
//           pendingAmount: totalAmount - paidAmount,
//           overdueCount: data.debts.filter((d: any) => 
//             d.due_date && new Date(d.due_date) < new Date() && d.status === 'pending'
//           ).length,
//         })
//       }
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 pb-20 lg:pb-6">
//       {/* Onboarding for first-time users */}
//       <OnboardingTooltip />

//       {/* Header */}
//       <div className="bg-white border-b lg:hidden">
//         <div className="container mx-auto px-4 py-4">
//           <h1 className="text-2xl font-bold">Dashboard</h1>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-6 space-y-6 lg:pl-72">
//         {/* Subscription Status Banner */}
//         <SubscriptionBanner />

//         {/* Stats */}
//         <CompactStats stats={stats} />

//         {/* Quick Actions - Only Mobile */}
//         <div className="grid grid-cols-3 gap-3 lg:hidden">
//           <Link href="/analytics" data-tour="analytics-link">
//             <Card className="p-4 text-center hover:bg-slate-50 transition">
//               <BarChart3 className="w-6 h-6 mx-auto text-blue-600 mb-2" />
//               <p className="text-xs font-medium">Analytics</p>
//             </Card>
//           </Link>
          
//           <Link href="/sms-credits" data-tour="sms-link">
//             <Card className="p-4 text-center hover:bg-slate-50 transition">
//               <MessageSquare className="w-6 h-6 mx-auto text-green-600 mb-2" />
//               <p className="text-xs font-medium">SMS</p>
//             </Card>
//           </Link>
          
//           <Link href="/pricing">
//             <Card className="p-4 text-center hover:bg-slate-50 transition">
//               <Crown className="w-6 h-6 mx-auto text-orange-600 mb-2" />
//               <p className="text-xs font-medium">Tarif</p>
//             </Card>
//           </Link>
//         </div>

//         {/* Feature Cards - Desktop */}
//         <div className="hidden lg:grid lg:grid-cols-3 gap-6">
//           <Link href="/analytics">
//             <Card className="hover:shadow-lg transition cursor-pointer">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <BarChart3 className="w-5 h-5 text-blue-600" />
//                   Analytics
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-slate-600 mb-3">
//                   Biznesingiz statistikasini ko&apos;ring
//                 </p>
//                 <div className="flex items-center text-blue-600 text-sm font-medium">
//                   Ko&apos;rish <ArrowRight className="w-4 h-4 ml-1" />
//                 </div>
//               </CardContent>
//             </Card>
//           </Link>

//           <Link href="/sms-credits">
//             <Card className="hover:shadow-lg transition cursor-pointer">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MessageSquare className="w-5 h-5 text-green-600" />
//                   SMS Kredits
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-slate-600 mb-3">
//                   Eslatma yuborish uchun kredit sotib oling
//                 </p>
//                 <div className="flex items-center text-green-600 text-sm font-medium">
//                   Sotib olish <ArrowRight className="w-4 h-4 ml-1" />
//                 </div>
//               </CardContent>
//             </Card>
//           </Link>

//           <Link href="/pricing">
//             <Card className="hover:shadow-lg transition cursor-pointer border-orange-200">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Crown className="w-5 h-5 text-orange-600" />
//                   Premium
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-slate-600 mb-3">
//                   Pro funksiyalardan foydalaning
//                 </p>
//                 <div className="flex items-center text-orange-600 text-sm font-medium">
//                   Tariflar <ArrowRight className="w-4 h-4 ml-1" />
//                 </div>
//               </CardContent>
//             </Card>
//           </Link>
//         </div>

//         {/* Debts List */}
//         <div>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-lg font-semibold">Qarzlar</h2>
//             <Button size="sm" data-tour="add-debt-button">
//               <Plus className="w-4 h-4 mr-1" />
//               Qarz qo&apos;shish
//             </Button>
//           </div>
          
//           {loading ? (
//             <Card className="p-8 text-center">
//               <p className="text-slate-600">Yuklanmoqda...</p>
//             </Card>
//           ) : (
//             <DebtsList debts={debts} />
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }