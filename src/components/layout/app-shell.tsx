// src/components/layout/app-shell.tsx
'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  BarChart3,
  MessageSquare,
  Crown,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Menu,
  Plus,
  ArrowLeft,
  X,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Smartphone,
  Download,
} from 'lucide-react'
import { useUser } from '@/lib/contexts/user-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddDebtModal } from '@/components/debts/add-debt-modal'
import { triggerPwaInstallPrompt } from '@/components/pwa/pwa-install-banner'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive'
  tourId?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  showAddDebtButton?: boolean
  onAddDebtSuccess?: () => void
  showBack?: boolean
  onBack?: () => void
}

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  openAddDebt: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useAppSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useAppSidebar must be used within AppShell')
  }
  return context
}

export function AppShell({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  showAddDebtButton = true,
  onAddDebtSuccess,
  showBack = false,
  onBack,
}: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [isAddDebtOpen, setIsAddDebtOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('qd_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // Persist sidebar collapsed state
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('qd_sidebar_collapsed', String(next))
      } catch (e) {}
      return next
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const handleStartTour = () => {
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('qarzdaftari:start-tour'))
    } else {
      router.push('/dashboard?tour=start')
    }
  }

  const currentPlan = (user?.plan_type || 'FREE').toUpperCase()

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

  const openAddDebt = () => setIsAddDebtOpen(true)

  // Render navigation links
  const renderNavLinks = (compact: boolean = false, onItemClick?: () => void) => {
    return (
      <nav className="px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              id={item.tourId}
              href={item.href}
              onClick={onItemClick}
              title={compact ? item.label : undefined}
              className={`
                group relative flex items-center ${compact ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'} 
                text-sm font-medium rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600" />
              )}
              <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3 min-w-0'}`}>
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!compact && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!compact && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-500 opacity-60" />
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        mobileOpen,
        setMobileOpen,
        openAddDebt,
      }}
    >
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
        {/* =========================================================
            DESKTOP SIDEBAR (lg:flex)
            ========================================================= */}
        <aside
          className={`
            hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30
            border-r border-slate-200/80 bg-white/95 backdrop-blur-xl
            transition-all duration-300 ease-in-out shadow-[1px_0_20px_rgba(0,0,0,0.02)]
            ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          `}
        >
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto justify-between">
            <div>
              {/* Brand Header */}
              <div className={`px-4 mb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 group min-w-0"
                  title="Qarz Daftari"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <span className="font-bold text-lg text-slate-900 tracking-tight leading-none block truncate">
                        Qarz Daftari
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aqlli boshqaruv
                      </span>
                    </div>
                  )}
                </Link>

                {/* Desktop Collapse Toggle */}
                {!isCollapsed && (
                  <button
                    onClick={handleToggleCollapse}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Menyuni yig'ish"
                    aria-label="Menyuni yig'ish"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* If collapsed, show expand button at top */}
              {isCollapsed && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleToggleCollapse}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Menyuni kengaytirish"
                    aria-label="Menyuni kengaytirish"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Navigation Items */}
              {renderNavLinks(isCollapsed)}
            </div>

            {/* Bottom User Profile & Status */}
            <div className={`px-3 mt-6 pt-4 border-t border-slate-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
              {user ? (
                isCollapsed ? (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs"
                      title={user.store_name || user.full_name || 'Foydalanuvchi'}
                    >
                      {user.store_name?.[0] || user.full_name?.[0] || 'U'}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartTour}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Tizim qo'llanmasi (Tur)"
                      aria-label="Tizim qo'llanmasi"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={triggerPwaInstallPrompt}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ilovani o'rnatish"
                      aria-label="Ilovani o'rnatish"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hisobdan chiqish"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
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

                    {/* PWA Install Button */}
                    <button
                      type="button"
                      onClick={triggerPwaInstallPrompt}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all border border-slate-200/80 bg-white shadow-2xs active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ilovani o&apos;rnatish</span>
                    </button>

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
                )
              ) : (
                <div className="text-center py-2">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Kirish
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* =========================================================
            MAIN APP AREA WITH UNIFIED TOPBAR
            ========================================================= */}
        <div
          className={`
            flex-1 flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out pb-20 lg:pb-8
            ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
          `}
        >
          {/* Unified Sticky Header */}
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
              {/* Left Side: Mobile Avatar / Back button + Title */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Back button (if on subpage like debtor/[phone]) */}
                {showBack ? (
                  <button
                    onClick={onBack ? onBack : () => router.back()}
                    className="p-1.5 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Orqaga"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                    <span className="hidden sm:inline">Orqaga</span>
                  </button>
                ) : (
                  /* Mobile Store Avatar (taps to /profile) */
                  <Link
                    href="/profile"
                    className="lg:hidden flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs active:scale-95 transition-transform"
                    title="Profilga o'tish"
                  >
                    {user?.store_name?.[0] || user?.full_name?.[0] || 'Q'}
                  </Link>
                )}

                {/* Breadcrumbs or Page Title */}
                <div className="min-w-0">
                  {breadcrumbs && breadcrumbs.length > 0 ? (
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1
                        return (
                          <div key={idx} className="flex items-center gap-1.5 min-w-0">
                            {idx > 0 && <span className="text-slate-300">/</span>}
                            {crumb.href && !isLast ? (
                              <Link
                                href={crumb.href}
                                className="hover:text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                              >
                                {crumb.label}
                              </Link>
                            ) : (
                              <span
                                className={`truncate max-w-[150px] sm:max-w-[250px] ${
                                  isLast ? 'text-slate-900 font-bold' : ''
                                }`}
                              >
                                {crumb.label}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </nav>
                  ) : title ? (
                    <div className="min-w-0">
                      <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate leading-tight">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="text-[11px] sm:text-xs text-slate-500 truncate leading-none mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right Side: Actions + Add Debt Button */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={triggerPwaInstallPrompt}
                  className="lg:hidden p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Ilovani o'rnatish (PWA)"
                  aria-label="Ilovani o'rnatish"
                >
                  <Download className="w-4 h-4" />
                </button>

                {actions}

                {showAddDebtButton && (
                  <Button
                    id="tour-add-debt"
                    onClick={() => setIsAddDebtOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 sm:mr-1.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Yangi Qarz</span>
                    <span className="sm:hidden">Qarz</span>
                  </Button>
                )}

                {user?.store_name && (
                  <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
                        {user.store_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {currentPlan} tarif
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>

        {/* =========================================================
            MOBILE BOTTOM NAVIGATION BAR
            ========================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 z-40 shadow-lg">
          <div className="grid grid-cols-5 gap-1 py-1.5 px-2 max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  id={item.tourId ? `${item.tourId}-mobile` : undefined}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors
                    ${
                      isActive
                        ? 'text-blue-600 bg-blue-50/70 font-bold'
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
                  <span className="mt-1 truncate max-w-full text-[10px]">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Global Add Debt Modal */}
        <AddDebtModal
          open={isAddDebtOpen}
          onOpenChange={setIsAddDebtOpen}
          onSuccess={() => {
            setIsAddDebtOpen(false)
            onAddDebtSuccess?.()
          }}
        />
      </div>
    </SidebarContext.Provider>
  )
}
