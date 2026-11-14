// src/app/profile/cashiers/page.tsx
'use client'

import { useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useUser } from '@/lib/contexts/user-context'
import { CashiersManagement } from '@/components/profile/cashiers-management'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfileCashiersPage() {
  const { user, loading: userLoading } = useUser()

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.replace('/login?redirect=/profile/cashiers')
    }
  }, [user, userLoading])

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

  return (
    <AppShell
      title="Kassirlar va Xodimlar"
      subtitle="Sotuvchilar ro'yxati, parollari va huquqlarini boshqarish"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Back Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Profilga qaytish</span>
        </Link>

        {/* Cashiers Management Component */}
        <CashiersManagement />
      </div>
    </AppShell>
  )
}
