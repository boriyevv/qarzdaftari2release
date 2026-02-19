// src/app/login/login-content.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

export function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Email login form
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  })

  // Phone login form
  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    otp: '',
  })

  // Check for reset password success message
  useState(() => {
    const message = searchParams.get('message')
    if (message === 'password_updated') {
      setSuccess('Parol muvaffaqiyatli yangilandi! Login qiling.')
    }
  })

const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email: emailForm.email,
    password: emailForm.password,
  })

  if (error) {
    setError('Email yoki parol noto\'g\'ri')
    setLoading(false)
    return
  }

  window.location.href = '/dashboard'
}

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '')
    if (!cleaned.startsWith('998') && cleaned.length > 0) {
      cleaned = '998' + cleaned
    }
    const formatted = cleaned.length > 0 ? '+' + cleaned : ''
    setPhoneForm({ ...phoneForm, phone: formatted.slice(0, 13) })
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

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
        setError(data.error || 'OTP yuborishda xato')
        return
      }

      setOtpSent(true)
      setSuccess('SMS kod yuborildi!')
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async () => {
    if (phoneForm.otp.length !== 6) {
      setError('6 ta raqam kiriting')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Verify OTP
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

      // Login
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

      setSuccess('Muvaffaqiyatli! Yo\'naltirilmoqda...')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 300)
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Qarz Daftari
          </CardTitle>
          <CardDescription className="text-center">
            Hisobingizga kirish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Telefon</TabsTrigger>
            </TabsList>

            {/* Alerts */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mt-4 bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Email Login Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={emailForm.email}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, email: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Parol</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Parolni unutdingizmi?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={emailForm.password}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, password: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Kirish...' : 'Kirish'}
                </Button>
              </form>
            </TabsContent>

            {/* Phone Login Tab */}
            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqam</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+998901234567"
                      required
                      value={phoneForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Yuborilmoqda...' : 'SMS Kod Yuborish'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">SMS Kod</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={phoneForm.otp}
                      onChange={(e) =>
                        setPhoneForm({ ...phoneForm, otp: e.target.value.replace(/\D/g, '') })
                      }
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500">
                      {phoneForm.phone} raqamiga yuborilgan 6 raqamli kodni kiriting
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setOtpSent(false)
                        setPhoneForm({ ...phoneForm, otp: '' })
                      }}
                      disabled={loading}
                    >
                      Orqaga
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handlePhoneLogin}
                      disabled={loading || phoneForm.otp.length !== 6}
                    >
                      {loading ? 'Tekshirilmoqda...' : 'Kirish'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Hisobingiz yo&apos;qmi? </span>
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}