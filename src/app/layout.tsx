// src/app/layout.tsx
// CLEAN LAYOUT - NO PROVIDERS
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/lib/contexts/user-context'
const inter = Inter({ subsets: ['latin'] })

// app/layout.tsx
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/appleicon.png',
  },

  title: {
    default:  'Qarz Daftari — Do\'kon Qarzlarini Onlayn Boshqaring',
    template: '%s | Qarz Daftari',
  },
  description: '✅ Qarzdorlar ro\'yxati • 📱 SMS eslatmalar • 📊 Hisobotlar | Uzbekiston do\'kon egalari uchun #1 qarz boshqaruv tizimi. Bepul boshlang!',
  keywords: ['qarz daftari', 'qarz hisobi', 'qarzlar daftari', 'qarz daftar', 'p daftar', 'debtbook', 'debt book', 'do\'kon uchun', 'uzbekistan', 'qarz kuzatish', 'qarz'],
  openGraph: {
    title: 'Qarz Daftari',
    description: 'Do\'kon qarzlarini onlayn boshqaring',
    url: 'https://debtbook.uz',
    siteName: 'Qarz Daftari',
    locale: 'uz_UZ',
    type: 'website',
    images: [{
      url: 'https://debtbook.uz/og-image.jpg',
      width: 1200,
      height: 630
    }]
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