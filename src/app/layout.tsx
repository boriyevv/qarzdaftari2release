// src/app/layout.tsx
// CLEAN LAYOUT - NO PROVIDERS
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/lib/contexts/user-context'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Qarz Daftari',
  description: 'Qarzlarni boshqarish platformasi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body className={inter.className}>
         <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}