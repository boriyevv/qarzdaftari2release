// src/lib/contexts/user-context.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    username: string
    store_name: string
    auth_method: 'email' | 'phone'
    plan_type: string
    sms_credits?: {
        balance: number
        total_purchased: number
        total_used: number
    }
}

interface UserContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
})

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = async () => {
        try {
            console.log('🔍 Fetching user...')
            const response = await fetch('/api/auth/me')
             console.log('📡 Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                 console.log('✅ User found:', data.profile?.full_name)
                setUser(data.profile)
            } else {
                console.log('❌ Not authenticated')
                setUser(null)
            }
        } catch (error) {
            console.error('❌ User fetch error:', error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    const refreshUser = async () => {
        setLoading(true)
        await fetchUser()
    }

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}