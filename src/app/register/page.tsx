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
  const [countdown, setCountdown] = useState(0)

  // Countdown timer
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

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneForm.phone,
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
        console.log('🔑 OTP Code:', data.code)
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
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneForm.phone,
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

  // Phone registration
const handlePhoneRegister = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!otpVerified) {
    setError('Avval telefon raqamni tasdiqlang')
    return
  }

  setLoading(true)
  setError('')

  // DEBUG: Ma'lumotlarni ko'rish
  console.log('📤 Sending data:', {
    auth_method: 'phone',
    full_name: phoneForm.full_name,
    phone: phoneForm.phone,
    store_name: phoneForm.store_name,
    email: phoneForm.email || undefined,
    otp_verified: true,
  })

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_method: 'phone',
        full_name: phoneForm.full_name,
        phone: phoneForm.phone,
        store_name: phoneForm.store_name,
        email: phoneForm.email || undefined,
        otp_verified: true,
      }),
    })

    const data = await response.json()

    // DEBUG: Javobni ko'rish
    console.log('📥 Response:', data)
    console.log('📊 Status:', response.status)

    if (!response.ok) {
      setError(data.error || 'Xato')
      return
    }

    router.push('/login?registered=true')
  } catch (error) {
    console.error('❌ Catch error:', error)
    setError('Tarmoq xatosi')
  } finally {
    setLoading(false)
  }
}

  const handlePhoneChange = (value: string, formType: 'email' | 'phone') => {
    let cleaned = value.replace(/\D/g, '')
    if (!cleaned.startsWith('998') && cleaned.length > 0) {
      cleaned = '998' + cleaned
    }
    const formatted = cleaned.length > 0 ? '+' + cleaned : ''

    if (formType === 'email') {
      setEmailForm({ ...emailForm, phone: formatted.slice(0, 13) })
    } else {
      setPhoneForm({ ...phoneForm, phone: formatted.slice(0, 13) })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600">Qarz Daftari</h1>
          </Link>
          <p className="text-slate-600 mt-2">Bepul account yarating</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Ro'yxatdan o'tish</CardTitle>
            <CardDescription className="text-center">
              Email yoki telefon bilan ro'yxatdan o'ting
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Telefon ⚡</TabsTrigger>
              </TabsList>

              {/* Email Tab */}
              <TabsContent value="email">
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_full_name">To'liq ism</Label>
                    <Input
                      id="email_full_name"
                      placeholder="Ali Valiyev"
                      required
                      value={emailForm.full_name}
                      onChange={(e) => setEmailForm({ ...emailForm, full_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_name">Do'kon nomi</Label>
                    <Input
                      id="store_name"
                      placeholder="Ali Do'koni"
                      required
                      value={emailForm.store_name}
                      onChange={(e) => setEmailForm({ ...emailForm, store_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="email_phone">Telefon</Label>
                    <Input
                      id="email_phone"
                      type="tel"
                      placeholder="+998901234567"
                      required
                      value={emailForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, 'email')}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
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

                  <div className="space-y-2">
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Tab */}
              <TabsContent value="phone">
                <form onSubmit={handlePhoneRegister} className="space-y-4">
                  {!otpVerified ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon raqam</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+998901234567"
                          required
                          value={phoneForm.phone}
                          onChange={(e) => handlePhoneChange(e.target.value, 'phone')}
                          disabled={loading || otpSent}
                        />
                      </div>

                      {!otpSent ? (
                        <Button
                          type="button"
                          onClick={handleSendOTP}
                          className="w-full"
                          disabled={loading || countdown > 0}
                        >
                          {countdown > 0 ? `${countdown}s` : 'SMS Kod Olish'}
                        </Button>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Tasdiqlash kodi</Label>
                            <OTPInput
                              value={phoneForm.otp}
                              onChange={(otp) => setPhoneForm({ ...phoneForm, otp })}
                              disabled={loading}
                            />
                          </div>

                          <Button
                            type="button"
                            onClick={handleVerifyOTP}
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
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">
                          ✅ Telefon tasdiqlandi!
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="phone_full_name">To'liq ism</Label>
                        <Input
                          id="phone_full_name"
                          placeholder="Ali Valiyev"
                          required
                          value={phoneForm.full_name}
                          onChange={(e) => setPhoneForm({ ...phoneForm, full_name: e.target.value })}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_store_name">Do'kon nomi</Label>
                        <Input
                          id="phone_store_name"
                          placeholder="Ali Do'koni"
                          required
                          value={phoneForm.store_name}
                          onChange={(e) => setPhoneForm({ ...phoneForm, store_name: e.target.value })}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
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

                      <Button type="submit" className="w-full" disabled={loading}>
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
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">yoki</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Hisobingiz bormi?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Kirish
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 hover:underline">
                ← Bosh sahifaga
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}