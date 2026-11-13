// src/app/register/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OTPInput } from '@/components/auth/otp-input'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { ArrowLeft } from 'lucide-react'
import { formatFullPhoneInput } from '@/lib/utils/phone'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone')

  // Email form
  const [emailForm, setEmailForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    username: '',
    store_name: '',
    password: '',
    confirmPassword: '',
  })

  // Phone form
  const [phoneForm, setPhoneForm] = useState({
    full_name: '',
    phone: '',
    store_name: '',
    otp: '',
    email: '', // optional
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [displayCode, setDisplayCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Staggered bottom-up animation to fill OTP digit by digit like mobile apps
  const animateFillOTP = (code: string) => {
    setPhoneForm((prev) => ({ ...prev, otp: '' }))
    const chars = code.split('')
    chars.forEach((_, i) => {
      setTimeout(() => {
        setPhoneForm((prev) => ({
          ...prev,
          otp: code.slice(0, i + 1),
        }))
      }, (i + 1) * 85)
    })
  }

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Email registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (emailForm.password !== emailForm.confirmPassword) {
      setError('Parollar mos kelmaydi')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_method: 'email',
          full_name: emailForm.full_name,
          email: emailForm.email,
          phone: emailForm.phone || undefined,
          username: emailForm.username,
          store_name: emailForm.store_name,
          password: emailForm.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato')
        return
      }

      router.push('/login?registered=true')
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  // Send OTP
  const handleSendOTP = async () => {
    if (!phoneForm.phone || !/^\+998\d{9}$/.test(phoneForm.phone)) {
      setError('Telefon raqam noto\'g\'ri')
      return
    }

    setLoading(true)
    setError('')
    setDisplayCode(null)

    const rawDigits = phoneForm.phone.replace(/\D/g, '')
    const fullPhone = rawDigits.startsWith('998') ? `+${rawDigits}` : `+998${rawDigits}`

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          type: 'registration',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'SMS yuborishda xato')
        return
      }

      setOtpSent(true)
      setCountdown(60)

      if (data.code) {
        setDisplayCode(data.code)
        console.log('🔑 OTP Code:', data.code)
        animateFillOTP(data.code)
      }
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (phoneForm.otp.length !== 6) {
      setError('6 ta raqam kiriting')
      return
    }

    setLoading(true)
    setError('')

    try {
      const rawDigits = phoneForm.phone.replace(/\D/g, '')
      const fullPhone = rawDigits.startsWith('998') ? `+${rawDigits}` : `+998${rawDigits}`

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          code: phoneForm.otp,
          type: 'registration',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Kod noto\'g\'ri')
        return
      }

      setOtpVerified(true)
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  // Phone registration submit handler (handles multi-step Enter presses smoothly)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpSent) {
      await handleSendOTP()
      return
    }

    if (!otpVerified) {
      if (phoneForm.otp.length === 6) {
        await handleVerifyOTP()
      } else {
        setError('6 ta raqamli tasdiqlash kodini kiriting')
      }
      return
    }

    await handlePhoneRegister(e)
  }

  // Phone registration (final step after OTP is verified)
  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpVerified) {
      setError('Avval telefon raqamni tasdiqlang')
      return
    }

    setLoading(true)
    setError('')

    console.log('📤 Sending data:', {
      auth_method: 'phone',
      full_name: phoneForm.full_name,
      phone: phoneForm.phone,
      store_name: phoneForm.store_name,
      email: phoneForm.email || undefined,
      otp_verified: true,
    })

    try {
      const rawDigits = phoneForm.phone.replace(/\D/g, '')
      const fullPhone = rawDigits.startsWith('998') ? `+${rawDigits}` : `+998${rawDigits}`

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_method: 'phone',
          full_name: phoneForm.full_name,
          phone: fullPhone,
          store_name: phoneForm.store_name,
          email: phoneForm.email || undefined,
          otp_verified: true,
        }),
      })

      const data = await response.json()

      console.log('📥 Response:', data)
      console.log('📊 Status:', response.status)

      if (!response.ok) {
        setError(data.error || 'Xato')
        return
      }

      if (data.user?.id && typeof window !== 'undefined') {
        localStorage.setItem('phone_user_session', data.user.id)
      }

      // Automatically navigate to dashboard after successful phone registration
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('❌ Catch error:', error)
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (value: string, formType: 'email' | 'phone') => {
    const formatted = formatFullPhoneInput(value)

    if (formType === 'email') {
      setEmailForm({ ...emailForm, phone: formatted })
    } else {
      setPhoneForm({ ...phoneForm, phone: formatted })
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center pt-6 sm:pt-10 pb-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4">
      {/* Top Bar with Home Link & Theme Toggle */}
      <div className="w-full max-w-lg flex items-center justify-between mb-3 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Asosiy sahifa</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg transition-all duration-300 ease-in-out">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Qarz Daftari</h1>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">Bepul account yarating</p>
        </div>

        <Card className="shadow-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 ease-in-out">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100">Ro&apos;yxatdan o&apos;tish</CardTitle>
            <CardDescription className="text-center text-slate-500 dark:text-slate-400">
              Email yoki telefon bilan ro&apos;yxatdan o&apos;ting
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="space-y-2">
                  <div>{error}</div>
                  {error.includes("allaqachon") && (
                    <div className="pt-1">
                      <Link href="/login">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-blue-300 dark:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          Mavjud hisobga kirish (Login) →
                        </Button>
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100/90 dark:bg-slate-800/80">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Telefon ⚡</TabsTrigger>
              </TabsList>

              {/* Email Tab */}
              <TabsContent value="email" className="mt-4">
                <form onSubmit={handleEmailRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email_full_name">To&apos;liq ism</Label>
                      <Input
                        id="email_full_name"
                        placeholder="Ali Valiyev"
                        required
                        value={emailForm.full_name}
                        onChange={(e) => setEmailForm({ ...emailForm, full_name: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="store_name">Do&apos;kon nomi</Label>
                      <Input
                        id="store_name"
                        placeholder="Ali Do&apos;koni"
                        required
                        value={emailForm.store_name}
                        onChange={(e) => setEmailForm({ ...emailForm, store_name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="alijon"
                        required
                        value={emailForm.username}
                        onChange={(e) => setEmailForm({ ...emailForm, username: e.target.value.toLowerCase() })}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email_phone">Telefon</Label>
                      <Input
                        id="email_phone"
                        type="tel"
                        placeholder="+998 (90) 123-45-67"
                        required
                        value={emailForm.phone}
                        onChange={(e) => handlePhoneChange(e.target.value, 'email')}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ali@example.com"
                      required
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Parol</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        value={emailForm.password}
                        onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        value={emailForm.confirmPassword}
                        onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Tab */}
              <TabsContent value="phone" className="mt-4">
                {/* Step Indicator */}
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 pb-3.5 px-2">
                  <span
                    className={`flex items-center gap-1.5 ${
                      !otpSent ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        !otpSent ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      1
                    </span>
                    Telefon
                  </span>
                  <span className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                  <span
                    className={`flex items-center gap-1.5 ${
                      otpSent && !otpVerified ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        otpSent && !otpVerified ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      2
                    </span>
                    SMS Kod
                  </span>
                  <span className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                  <span
                    className={`flex items-center gap-1.5 ${
                      otpVerified ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        otpVerified ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      3
                    </span>
                    Profil
                  </span>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  {!otpVerified ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon raqam</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+998 (90) 123-45-67"
                          required
                          value={phoneForm.phone}
                          onChange={(e) => handlePhoneChange(e.target.value, 'phone')}
                          disabled={loading || otpSent}
                        />
                      </div>

                      {!otpSent ? (
                        <>
                          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                            <div className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                              ⚡ Tezkor ro&apos;yxatdan o&apos;tish afzalliklari:
                            </div>
                            <ul className="space-y-1 text-blue-700/90 dark:text-blue-300/80 list-disc list-inside text-[11px] leading-relaxed">
                              <li>Parol o&apos;ylab topish yoki eslab qolish shart emas</li>
                              <li>SMS kod bilan 30 soniyada hisobingiz faollashadi</li>
                              <li>Do&apos;koningiz uchun barcha asosiy imkoniyatlar ochiladi</li>
                            </ul>
                          </div>

                          <Button
                            type="submit"
                            className="w-full mt-2"
                            disabled={loading || countdown > 0}
                          >
                            {countdown > 0 ? `${countdown}s` : 'SMS Kod Olish'}
                          </Button>
                        </>
                      ) : (
                        <>
                          {displayCode && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-blue-900 dark:text-blue-200 text-sm space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 text-xs sm:text-sm">
                                  ℹ️ Sinov kodi (Eskiz to&apos;lovisiz):
                                </span>
                                <span className="font-mono text-base font-semibold bg-white dark:bg-slate-850 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 tracking-wider shadow-2xs">
                                  {displayCode}
                                </span>
                              </div>
                              <p className="text-xs text-blue-700 dark:text-blue-300/90">
                                Eskiz.uz SMS to&apos;lovisiz sinash uchun kod ekranga chiqarildi va avtomatik kiritildi.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Tasdiqlash kodi</Label>
                            <OTPInput
                              value={phoneForm.otp}
                              onChange={(otp) => setPhoneForm({ ...phoneForm, otp })}
                              disabled={loading}
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || phoneForm.otp.length !== 6}
                          >
                            {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                          </Button>

                          {countdown === 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setOtpSent(false)
                                setDisplayCode(null)
                                setPhoneForm({ ...phoneForm, otp: '' })
                              }}
                              className="w-full"
                            >
                              Qayta yuborish
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Alert className="border-green-200 dark:border-emerald-800 bg-green-50 dark:bg-emerald-950/40">
                        <AlertDescription className="text-green-800 dark:text-emerald-300">
                          ✅ Telefon tasdiqlandi!
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="phone_full_name">To&apos;liq ism</Label>
                          <Input
                            id="phone_full_name"
                            placeholder="Ali Valiyev"
                            required
                            value={phoneForm.full_name}
                            onChange={(e) => setPhoneForm({ ...phoneForm, full_name: e.target.value })}
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="phone_store_name">Do&apos;kon nomi</Label>
                          <Input
                            id="phone_store_name"
                            placeholder="Ali Do&apos;koni"
                            required
                            value={phoneForm.store_name}
                            onChange={(e) => setPhoneForm({ ...phoneForm, store_name: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone_email">Email (ixtiyoriy)</Label>
                        <Input
                          id="phone_email"
                          type="email"
                          placeholder="ali@example.com"
                          value={phoneForm.email}
                          onChange={(e) => setPhoneForm({ ...phoneForm, email: e.target.value })}
                          disabled={loading}
                        />
                      </div>

                      <Button type="submit" className="w-full mt-2" disabled={loading}>
                        {loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">yoki</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hisobingiz bormi?{' '}
                <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Kirish
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline">
                ← Bosh sahifaga
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>Ro&apos;yxatdan o&apos;tish orqali siz shartlarga rozilik bildirasiz:</p>
              <div className="flex flex-wrap justify-center gap-2 text-slate-600 dark:text-slate-400">
                <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
                  Ommaviy oferta (Оферта)
                </Link>
                <span>•</span>
                <Link href="/security" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
                  Xavfsizlik & Antifraud
                </Link>
                <span>•</span>
                <Link href="/payment-terms" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
                  To&apos;lov va qaytarish
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 underline">
                  Maxfiylik
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
