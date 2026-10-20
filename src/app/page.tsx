// src/app/page.tsx
// Landing page (Home page)

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Lock, CreditCard, RotateCcw, FileText, Phone, Mail, Building } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Qarz Daftari
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/pricing" className="hover:text-blue-600 transition">
              Tariflar
            </Link>
            <Link href="/payment-terms" className="hover:text-blue-600 transition">
              To'lov va qaytarish
            </Link>
            <Link href="/security" className="hover:text-blue-600 transition">
              Xavfsizlik & Antifraud
            </Link>
            <Link href="/terms" className="hover:text-blue-600 transition">
              Oferta
            </Link>
            <Link href="/contact" className="hover:text-blue-600 transition">
              Bog'lanish
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/login">Kirish</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Ro'yxatdan o'tish</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Logo / Title */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Qarzlaringizni online va xavfsiz boshqaring
              </h1>
              <p className="text-xl text-slate-600">
                Do'kon egalari va tadbirkorlar uchun zamonaviy qarz daftari platformasi
              </p>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
              Mijozlar hisob-kitobini oson nazorat qiling, avtomatik SMS-eslatmalar yuboring va biznesingiz
              moliyaviy holatini to'liq hisobotlar orqali kuzating.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap pt-2">
              <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg shadow-blue-500/20">
                <Link href="/register">
                  Ro'yxatdan o'tish (Bepul)
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/pricing">
                  Tariflar bilan tanishish
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                100% Bepul boshlang
              </div>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
                <Lock className="w-4 h-4 text-blue-600" />
                PCI-DSS & 3D-Secure himoyasi
              </div>
              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Uzum Bank, Click, Payme
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border shadow-sm hover:shadow transition">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <CardTitle>Oson Boshqaruv</CardTitle>
                <CardDescription>
                  Qarzlaringizni folderlar bo'yicha guruhlang va drag & drop bilan tartiblang
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border shadow-sm hover:shadow transition">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <CardTitle>SMS Eslatmalar</CardTitle>
                <CardDescription>
                  Qarzdorlarga avtomatik SMS eslatmalar yuboring va to'lovlarni o'z vaqtida oling
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border shadow-sm hover:shadow transition">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle>Statistika & Analitika</CardTitle>
                <CardDescription>
                  To'liq hisobotlar, grafiklar va tahliliy ma'lumotlar bilan biznesingizni kuzating
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Pricing Section */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Qulay Tariflar</h2>
              <p className="text-slate-600">Har qanday hajmdagi savdo nuqtalari uchun mos yechim</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Free */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Boshlang'ich tadbirkorlar uchun</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">0</span>
                    <span className="text-slate-600"> so'm/oy</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>50 ta qarzdor yozuvi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>2 ta papka (folder)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Brauzer bildirishnomalari</span>
                  </div>
                </CardContent>
              </Card>

              {/* Plus */}
              <Card className="border-blue-500 border-2 relative shadow-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Eng ommabop
                </div>
                <CardHeader>
                  <CardTitle>Plus</CardTitle>
                  <CardDescription>Kichik va o'rta do'konlar</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">49,900</span>
                    <span className="text-slate-600"> so'm/oy</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>500 ta qarzdor yozuvi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>10 ta papka (folder)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>SMS va Push eslatmalar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Excel va PDF export</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Yirik savdo tarmoqlari</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">99,900</span>
                    <span className="text-slate-600"> so'm/oy</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Cheksiz qarzdor yozuvlari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Cheksiz papkalar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Ustuvor qo'llab-quvvatlash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Kengaytirilgan analitika</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Comprehensive Banking-Audited Footer */}
      <footer className="border-t bg-white mt-16 text-slate-600">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Column 1: About */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-lg">Qarz Daftari</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tadbirkorlar va do'kon egalari uchun zamonaviy hisob-kitob va qarz boshqaruvi platformasi.
              </p>
              <div className="text-xs text-slate-500 pt-1 space-y-1">
                <p><strong>Yuridik shaxs:</strong> «ASADBEK BURIYEV WS» NTM</p>
                <p><strong>Sayt:</strong> https://debtbook.uz</p>
              </div>
            </div>

            {/* Column 2: Legal & Compliance */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Hujjatlar / Документы</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/terms" className="hover:text-blue-600 transition flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ommaviy Oferta / Публичная оферта</span>
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-blue-600 transition flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xavfsizlik & Antifraud / Безопасность</span>
                  </Link>
                </li>
                <li>
                  <Link href="/payment-terms" className="hover:text-blue-600 transition flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>To'lov va qaytarish / Оплата и возврат</span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-blue-600 transition flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Maxfiylik siyosati / Конфиденциальность</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Services */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Xizmatlar / Сервис</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/pricing" className="hover:text-blue-600 transition">
                    Tariflar va rejalar
                  </Link>
                </li>
                <li>
                  <Link href="/sms-credits" className="hover:text-blue-600 transition">
                    SMS Eslatma xizmati
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-blue-600 transition">
                    Ro'yxatdan o'tish
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-600 transition">
                    Yordam markazi (FAQ)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contacts & Payment Systems */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Aloqa / Контакты</h4>
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>+998 (90) 443-55-67</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>boriyevdev08@gmail.com</span>
                </p>
                <p className="text-slate-500">Ish vaqti: Du-Ju, 09:00 - 18:00</p>
              </div>

              <div className="pt-3 border-t">
                <span className="block text-[11px] font-semibold text-slate-800 mb-2">Qabul qilinadigan to'lovlar:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-700">
                  <span className="bg-slate-100 border px-2 py-1 rounded">Uzum Bank</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">Uzcard</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">Humo</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">Visa</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">MasterCard</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">Click</span>
                  <span className="bg-slate-100 border px-2 py-1 rounded">Payme</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; 2026 Qarz Daftari («ASADBEK BURIYEV WS» NTM). Barcha huquqlar himoyalangan.</p>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/terms" className="hover:underline">Oferta</Link>
              <span>•</span>
              <Link href="/security" className="hover:underline">Antifraud siyosati</Link>
              <span>•</span>
              <Link href="/payment-terms" className="hover:underline">To'lov & Qaytarish</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:underline">Maxfiylik</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
