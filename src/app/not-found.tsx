// src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            404
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Sahifa topilmadi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Siz qidirayotgan sahifa mavjud emas, ko&apos;chirilgan yoki manzili noto&apos;g&apos;ri kiritilgan.
          </p>
        </div>

        <div className="pt-2">
          <Button
            asChild
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Bosh sahifaga qaytish
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
