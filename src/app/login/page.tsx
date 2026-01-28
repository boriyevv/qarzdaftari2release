// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { OTPInput } from '@/src/components/auth/otp-input'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')

  // Email state
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  })

  // Phone state
  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    otp: '',
  })
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Ro\'yxatdan o\'tish muvaffaqiyatli! Endi kirish mumkin.')
    }
  }, [searchParams])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_method: 'email',
          ...emailForm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login xatosi')
        return
      }

      router.push('/dashboard')
      router.refresh()
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
          type: 'login',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'SMS yuborishda xato')
        return
      }

      setOtpSent(true)
      setCountdown(60)
      setSuccess('SMS kod yuborildi!')

      // Development: show code in console
      if (data.code) {
        console.log('🔑 OTP Code:', data.code)
      }
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and login
  const handlePhoneLogin = async () => {
    if (phoneForm.otp.length !== 6) {
      setError('6 ta raqam kiriting')
      return
    }

    setLoading(true)
    setError('')

    try {
      // First verify OTP
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneForm.phone,
          code: phoneForm.otp,
          type: 'login',
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Kod noto\'g\'ri')
        return
      }

      // Then login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_method: 'phone',
          phone: phoneForm.phone,
          otp_verified: true,
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        setError(loginData.error || 'Login xatosi')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '')
    if (!cleaned.startsWith('998') && cleaned.length > 0) {
      cleaned = '998' + cleaned
    }
    const formatted = cleaned.length > 0 ? '+' + cleaned : ''
    setPhoneForm({ ...phoneForm, phone: formatted.slice(0, 13) })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600">Qarz Daftari</h1>
          </Link>
          <p className="text-slate-600 mt-2">Hisobingizga kiring</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Kirish</CardTitle>
            <CardDescription className="text-center">
              Email yoki telefon bilan kiring
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Success/Error Alerts */}
            {success && (
              <Alert className="border-green-200 bg-green-50 mb-4">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tabs */}
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Telefon</TabsTrigger>
              </TabsList>

              {/* Email Tab */}
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      required
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Parol</Label>
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Unutdingizmi?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Yuklanmoqda...' : 'Kirish'}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Tab */}
              <TabsContent value="phone">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqam</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+998901234567"
                      required
                      value={phoneForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
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
                        <p className="text-xs text-center text-slate-500 mt-2">
                          SMS kod {phoneForm.phone} raqamiga yuborildi
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handlePhoneLogin}
                        className="w-full"
                        disabled={loading || phoneForm.otp.length !== 6}
                      >
                        {loading ? 'Tekshirilmoqda...' : 'Kirish'}
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
                </div>
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
                Hisobingiz yo'qmi?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                  Ro'yxatdan o'tish
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