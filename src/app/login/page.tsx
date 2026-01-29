// src/app/login/page.tsx
'use client'

import { Suspense } from 'react'
import { LoginPageContent } from './login-content'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Yuklanmoqda...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}