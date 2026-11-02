// src/components/layout/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  BarChart3,
  MessageSquare,
  User,
  Crown,
  BookOpen,
  LogOut,
  Sparkles,
  ChevronRight,
  Compass,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/contexts/user-context'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  tourId?: string
}

export function MainNav({ userPlan }: { userPlan?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  const currentPlan = (user?.plan_type || userPlan || 'FREE').toUpperCase()

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      tourId: 'tour-nav-dashboard',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      badge: currentPlan === 'FREE' ? 'Pro' : undefined,
      tourId: 'tour-nav-analytics',
    },
    {
      label: 'SMS Kredits',
      href: '/sms-credits',
      icon: MessageSquare,
      tourId: 'tour-nav-sms',
    },
    {
      label: 'Tariflar',
      href: '/pricing',
      icon: Crown,
      tourId: 'tour-nav-pricing',
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: User,
      tourId: 'tour-nav-profile',
    },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    }
  }

  const handleStartTour = () => {
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('qarzdaftari:start-tour'))
    } else {
      router.push('/dashboard?tour=start')
    }
  }

  return (
    <>
      {/* Desktop Modern Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200/80 lg:bg-white/95 lg:backdrop-blur-xl z-30 shadow-[1px_0_20px_rgba(0,0,0,0.02)]">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto justify-between">
          <div>
            {/* Logo & Brand Header */}
            <div className="px-5 mb-6">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                      Qarz Daftari
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Aqlli boshqaruv tizimi
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Items */}
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    id={item.tourId}
                    href={item.href}
                    className={`
                      group relative flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/60 text-blue-600 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600" />
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                        ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100/70 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-900'
                        }
                      `}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0"
                      >
                        {item.badge}
                      </Badge>
                    ) : isActive ? (
                      <ChevronRight className="w-4 h-4 text-blue-500 opacity-60" />
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Bottom User Store Card */}
          <div className="px-3 mt-6 pt-4 border-t border-slate-100">
            {user ? (
              <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs flex-shrink-0">
                      {user.store_name?.[0] || user.full_name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {user.store_name || user.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                        {user.full_name}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={`text-[10px] font-extrabold uppercase px-1.5 py-0 flex-shrink-0 ${
                      currentPlan === 'PRO'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : currentPlan === 'PLUS'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {currentPlan}
                  </Badge>
                </div>

                {currentPlan === 'FREE' && (
                  <Link
                    href="/pricing"
                    className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      Tarifni oshirish
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {/* Tizim qo'llanmasi (Onboarding Walkthrough) Button */}
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-blue-200/60 bg-white shadow-2xs active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tizim qo&apos;llanmasi</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Hisobdan chiqish</span>
                </button>
              </div>
            ) : (
              <div className="p-3 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Kirish / Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Glass Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 z-50 shadow-lg">
        <div className="grid grid-cols-5 gap-1 py-1.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                id={item.tourId ? `${item.tourId}-mobile` : undefined}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-colors
                  ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/60 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }
                `}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </div>
                <span className="mt-1 truncate max-w-full">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export { AppShell } from '@/components/layout/app-shell'
