// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/lib/contexts/user-context'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
import { PwaInstallBanner } from '@/components/pwa/pwa-install-banner'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TelegramWebAppInitializer } from '@/components/telegram/telegram-webapp-initializer'
import { AppLockProvider } from '@/components/security/app-lock-provider'



const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/appleicon.png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Qarz Daftari',
  },
  formatDetection: {
    telephone: false,
  },
  title: {
    default: 'Qarz Daftari — Do\'kon Qarzlarini Onlayn Boshqaring',
    template: '%s | Qarz Daftari',
  },
  description:
    '✅ Qarzdorlar ro\'yxati • 📱 SMS eslatmalar • 📊 Hisobotlar | O\'zbekiston do\'kon egalari uchun #1 qarz boshqaruv tizimi. Bepul boshlang!',
  keywords: [
    'qarz daftari',
    'qarz hisobi',
    'qarzlar daftari',
    'qarz daftar',
    'p daftar',
    'debtbook',
    'debt book',
    'do\'kon uchun',
    'uzbekistan',
    'qarz kuzatish',
    'qarz',
  ],
  openGraph: {
    title: 'Qarz Daftari',
    description: 'Do\'kon qarzlarini onlayn boshqaring',
    url: 'https://debtbook.uz',
    siteName: 'Qarz Daftari',
    locale: 'uz_UZ',
    type: 'website',
    images: [
      {
        url: 'https://debtbook.uz/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
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
    <html lang="uz" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UserProvider>
            <AppLockProvider>
              <TelegramWebAppInitializer />
              <OfflineIndicator />
              {children}
              <PwaInstallBanner />
            </AppLockProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
