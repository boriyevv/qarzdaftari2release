// src/app/contact/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useUser } from '@/lib/contexts/user-context'
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Smartphone,
  CreditCard,
  MessageSquare
} from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  // Tizimga kirgan foydalanuvchi ma'lumotlarini formaga avtomatik to'ldirish
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.full_name || user.store_name || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Simulate API call
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
      setFormData({
        name: user?.full_name || user?.store_name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Chap tomon: Ortga qaytish + Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Ortga qaytish"
                aria-label="Ortga qaytish"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  Qarz Daftari
                </h1>
              </Link>
            </div>

            {/* O'ng tomon: ThemeToggle + Auth / Dashboard tugmalari */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {!userLoading && (
                user ? (
                  <Button
                    size="sm"
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-9 px-3.5 shadow-2xs transition-all active:scale-95"
                  >
                    <Link href="/dashboard" className="flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden xs:inline sm:inline">Dashboard</span>
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 sm:px-3.5 font-semibold text-xs"
                    >
                      <Link href="/login">Kirish</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-9 px-3.5 shadow-2xs transition-all active:scale-95 text-xs"
                    >
                      <Link href="/register">Ro&apos;yxatdan o&apos;tish</Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full">
        {/* Ortga qaytish / Navigatsiya tugmasi */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ortga qaytish</span>
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Link href="/dashboard" className="flex items-center gap-1">
                <span>Dashboardga o&apos;tish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {/* Hero sarlavha */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Yordam Markazi
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Savollaringiz bormi yoki yordam kerakmi? Biz sizga mamnuniyat bilan ko&apos;maklashamiz!
          </p>
        </div>

        {/* Aloqa Kartalari (Email, Telefon, Telegram) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* Email Support */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Mail className="w-6 h-6" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Email
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Bizga email orqali yozing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:boriyevdev08@gmail.com"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-bold break-all"
              >
                boriyevdev08@gmail.com
              </a>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                24 soat ichida javob beramiz
              </p>
            </CardContent>
          </Card>

          {/* Phone Support */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Phone className="w-6 h-6" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Telefon
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                To&apos;g&apos;ridan-to&apos;g&apos;ri qo&apos;ng&apos;iroq qiling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="tel:+998904435567"
                className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
              >
                +998 (90) 443-55-67
              </a>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ish kunlari 9:00 dan 18:00 gacha
              </p>
            </CardContent>
          </Card>

          {/* Telegram Support */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-all">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-sky-100/90 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Send className="w-6 h-6" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Telegram
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Telegram qo&apos;llab-quvvatlash
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="https://t.me/qarzdaftari_support_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                @qarzdaftari_support_bot
              </a>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tezkor javob olish uchun
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tez-tez so'raladigan savollar (FAQ) */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Ko&apos;p So&apos;raladigan Savollar
            </h2>
          </div>

          <div className="space-y-3">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Qarz Daftari nima?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Qarz Daftari — bu do&apos;kon egalari, savdogarlar va tadbirkorlar uchun zamonaviy qarz boshqaruv platformasi. Siz berilgan nasiyalaringizni osongina nazorat qilishingiz, to&apos;lov muddatlarini kuzatishingiz va hisobotlarni eksport qilishingiz mumkin.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Qanday narx? Bepul sinov bormi?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ha! Har bir yangi ro&apos;yxatdan o&apos;tgan foydalanuvchiga 30 kunlik to&apos;liq funksiyalarga ega bepul sinov (Trial) beriladi. Keyinchalik o&apos;z biznesingizga mos PLUS yoki PRO tarifini tanlashingiz mumkin.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  SMS eslatmalar qanday ishlaydi?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  SMS xabarlar mijozning telefon raqamiga to&apos;g&apos;ridan-to&apos;g&apos;ri eslatma yuborish uchun xizmat qiladi. Tizimda qulay tayyor shablonlar va avtomatik eslatma mexanizmi mavjud.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Ma&apos;lumotlarim xavfsizligi qanday ta&apos;minlanadi?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Barcha ma&apos;lumotlar shifrlangan holatda xavfsiz ma&apos;lumotlar bazasida saqlanadi. Ma&apos;lumotlarga faqat do&apos;kon egasi va uning ruxsat bergan kassirlari kira oladi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Murojaat formasi */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Bizga Murojaat Qiling</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Savolingiz yoki taklifingiz bormi? Formani to&apos;ldiring, tez orada javob beramiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Xabaringiz muvaffaqiyatli yuborildi!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Tez orada siz bilan bog&apos;lanamiz. Emailingizni tekshirib turing.
                  </p>
                </div>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <p className="text-xs">{error}</p>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ismingiz <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ismingizni kiriting"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@mail.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mavzu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Murojaatingiz mavzusi"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    disabled={loading}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Xabar matni <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Savolingiz yoki taklifingizni yozing..."
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    disabled={loading}
                    className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm p-3 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Yuborilmoqda...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>Xabar Yuborish</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 text-slate-600 dark:text-slate-400 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Qarz Daftari. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex gap-4 justify-center text-xs font-semibold">
            <Link
              href={user ? '/dashboard' : '/'}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {user ? 'Dashboard' : 'Bosh sahifa'}
            </Link>
            {user ? (
              <>
                <Link
                  href="/pricing"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Tariflar
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Profil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Kirish
                </Link>
                <Link
                  href="/register"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </>
            )}
            <Link
              href="/terms"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Foydalanish shartlari
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
