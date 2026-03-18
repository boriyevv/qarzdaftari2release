// src/app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato yuz berdi')
        return
      }

      setSuccess(true)
    } catch (error) {
      setError('Tarmoq xatosi. Qaytadan urinib ko\'ring.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600">Qarz Daftari</h1>
          </Link>
          <p className="text-slate-600 mt-2">Parolni tiklash</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Parolni unutdingizmi?</CardTitle>
            <CardDescription>
              Email manzilingizni kiriting, sizga parolni tiklash havolasi yuboramiz
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
                    Email yuborildi!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      <strong>{email}</strong> manziliga parolni tiklash havolasi yuborildi.
                    </p>
                    <p className="mt-2">
                      Emailingizni tekshiring va havolani bosing.
                    </p>
                    <p className="mt-2 text-xs">
                      Email kelmadimi? Spam papkasini tekshiring yoki bir necha daqiqadan keyin qayta urinib ko'ring.
                    </p>
                  </div>
                </div>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <AlertDescription className="ml-2">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Yuborilmoqda...
                    </div>
                  ) : (
                    'Tiklash havolasini yuborish'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Back to Login */}
            <div className="text-center w-full">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Muammo bo'ldimi?</p>
          <p className="mt-1">
            <Link href="/contact" className="text-blue-600 hover:underline">
              Yordam markazi
            </Link>
            {' '}bilan bog'laning
          </p>
        </div>
      </div>
    </div>
  )
}