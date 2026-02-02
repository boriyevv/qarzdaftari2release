// src/components/layout/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, CreditCard, MessageSquare, User, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive'
}

export function MainNav({ userPlan = 'FREE' }: { userPlan?: string }) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: userPlan === 'FREE' ? 'Pro' : undefined,
    },
    {
      label: 'SMS Kredits',
      href: '/sms-credits',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: 'Tariflar',
      href: '/pricing',
      icon: <Crown className="w-5 h-5" />,
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className=" hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <h1 className="text-2xl font-bold text-blue-600">Qarz Daftari</h1>
          </div>
          <nav className="flex-1 px-2 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'secondary'} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 text-xs
                  ${isActive ? 'text-blue-600' : 'text-slate-600'}
                `}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                      variant="destructive"
                    >
                      !
                    </Badge>
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