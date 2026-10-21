// src/app/login/page.tsx
'use client'
import { Suspense } from 'react'
import { LoginPageContent } from './login-content'

export default function LoginPage() {

  // app/login/page.tsx

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center items-start pt-12 sm:pt-[15vh] lg:pt-[18vh] pb-12 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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