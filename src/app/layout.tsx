// src/app/layout.tsx
// CLEAN LAYOUT - NO PROVIDERS
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/lib/contexts/user-context'
const inter = Inter({ subsets: ['latin'] })

// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Qarz Daftari',
    template: '%s | Qarz Daftari',
  },
  description: 'Uzbekiston do\'konlari uchun online qarz hisobi. Mijozlar qarzini kuzating, SMS xabarnoma yuboring.',
  keywords: ['qarz daftari', 'qarz hisobi', 'do\'kon uchun', 'uzbekistan', 'qarz kuzatish'],
  openGraph: {
    title: 'Qarz Daftari',
    description: 'Do\'kon qarzlarini onlayn boshqaring',
    url: 'https://debtbook.uz',
    siteName: 'Qarz Daftari',
    locale: 'uz_UZ',
    type: 'website',
  },
  verification: {
    google: 'NLw2DkN8iCOm5F8yfg2f_grjITI7I7KAbU2oMeEZvok',
  },
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