import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/src/lib/contexts/user-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Qarz Daftari - Qarzlarni Boshqarish Tizimi',
  description: 'Professional qarzlar boshqarish platformasi',
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