// src/app/contact/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Simulate API call
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-blue-600">Qarz Daftari</h1>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Kirish</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Ro'yxatdan o'tish</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Yordam Markazi</h1>
            <p className="text-xl text-slate-600">
              Sizga qanday yordam berishimiz mumkin?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Email Support */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  Bizga email yuboring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:boriyevdev08@gmail.com"
                  className="text-blue-600 hover:underline font-medium"
                >
                  boriyevdev08@gmail.com
                </a>
                <p className="text-sm text-slate-600 mt-2">
                  24 soat ichida javob beramiz
                </p>
              </CardContent>
            </Card>

            {/* Phone Support */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <CardTitle>Telefon</CardTitle>
                <CardDescription>
                  Qo'ng'iroq qiling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="tel:+998904435567"
                  className="text-blue-600 hover:underline font-medium"
                >
                  +998 (90) 443-55-67
                </a>
                <p className="text-sm text-slate-600 mt-2">
                  Ish kunlari 9:00 - 18:00
                </p>
              </CardContent>
            </Card>

            {/* Telegram Support */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-sky-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                </div>
                <CardTitle>Telegram</CardTitle>
                <CardDescription>
                  Telegram orqali yozing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://t.me/qarzdaftari_support_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  @qarzdaftari_support_bot
                </a>
                <p className="text-sm text-slate-600 mt-2">
                  Tez javob olish uchun
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Ko'p So'raladigan Savollar</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Qarz Daftari nima?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Qarz Daftari - bu do'kon egalari va tadbirkorlar uchun zamonaviy qarz boshqaruv platformasi. 
                    Siz qarzlaringizni oson nazorat qilishingiz, SMS eslatmalar yuborishingiz va to'liq hisobotlarni olishingiz mumkin.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Qanday narx? Bepulmi?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Ha! Biz FREE tarif taklif qilamiz - 50 tagacha qarz va asosiy funksiyalar bepul. 
                    Ko'proq funksiyalar uchun PLUS (49,900 so'm/oy) va PRO (99,900 so'm/oy) tariflar mavjud.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SMS eslatmalar qanday ishlaydi?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    SMS kreditleri alohida sotib olinadi. Siz kerakli miqdorda SMS paket xarid qilasiz va 
                    qarzdorlaringizga avtomatik eslatmalar yuboriladi. PRO userlarga chegirmalar va bonuslar mavjud.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ma'lumotlarim xavfsizmi?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Ha! Barcha ma'lumotlar shifrlangan va xavfsiz serverda saqlanadi. Faqat siz o'z ma'lumotlaringizni 
                    ko'ra olasiz. Biz hech qachon ma'lumotlaringizni uchinchi shaxslarga sotmaymiz.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mobil app bormi?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Hozircha bizning platformamiz PWA (Progressive Web App) sifatida ishlaydi - ya'ni brauzerdan 
                    to'g'ridan-to'g'ri telefoningizga o'rnatishingiz mumkin va u mobil app kabi ishlaydi.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Bizga Murojaat Qiling</CardTitle>
              <CardDescription>
                Savolingiz bormi? Formani to'ldiring, biz sizga tez orada javob beramiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="border-green-200 bg-green-50">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Xabaringiz yuborildi!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Tez orada sizga javob beramiz. Emailingizni tekshiring.
                    </p>
                  </div>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Ismingiz
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ali Valiyev"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ali@example.com"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Mavzu
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Savolingizning mavzusi"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Xabar
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Xabaringizni yozing..."
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Yuborilmoqda...
                      </div>
                    ) : (
                      'Xabar Yuborish'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2026 Qarz Daftari. Barcha huquqlar himoyalangan.</p>
            <div className="flex gap-4 justify-center mt-4 text-sm">
              <Link href="/" className="hover:text-blue-600">
                Bosh sahifa
              </Link>
              <Link href="/login" className="hover:text-blue-600">
                Kirish
              </Link>
              <Link href="/register" className="hover:text-blue-600">
                Ro'yxatdan o'tish
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}