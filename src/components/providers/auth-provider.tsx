// src/components/providers/auth-provider.tsx
// SESSION STATE MANAGEMENT
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ✅ Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          console.log('✅ Session restored:', session.user.email)
        } else {
          setUser(null)
          console.log('❌ No session found')
        }
      } catch (error) {
        console.error('Session check error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // ✅ Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event)
        
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }

        // Handle redirects
        if (event === 'SIGNED_IN') {
          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  // ✅ Show loading only on initial check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}