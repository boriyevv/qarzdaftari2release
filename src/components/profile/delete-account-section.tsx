// src/components/profile/delete-account-section.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { nativeHaptics } from '@/lib/native'

const DELETION_REASONS = [
  'Ilovadan boshqa foydalanmayman',
  'Boshqa telefon raqam bilan yangi hisob ochmoqchiman',
  'Xavfsizlik / maxfiylik sabablari',
  'Boshqa kassa yoki dasturga o\'tdim',
  'Boshqa sabab',
]

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedReason, setSelectedReason] = useState(DELETION_REASONS[0])
  const [confirmed, setConfirmed] = useState(false)

  const handleDelete = async () => {
    if (!confirmed) {
      toast.error('Iltimos, hisobni o\'chirishni tasdiqlovchi belgini belgilang')
      return
    }

    try {
      setLoading(true)
      nativeHaptics.notification('warning')

      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: selectedReason }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Hisobni o\'chirishda xatolik yuz berdi')
      }

      // Clear local storage security PIN lock and phone user session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('phone_user_session')
        localStorage.removeItem('qd_app_lock_pin_hash')
        localStorage.removeItem('qd_app_lock_enabled')
        localStorage.removeItem('qd_app_lock_biometrics_enabled')
        localStorage.removeItem('qd_app_lock_last_active')
      }

      toast.success('Hisobingiz muvaffaqiyatli o\'chirildi')
      nativeHaptics.notification('success')

      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
    } catch (err: any) {
      console.error('Delete account error:', err)
      toast.error(err?.message || 'Xatolik yuz berdi')
      nativeHaptics.notification('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-3xl border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-rose-950 dark:text-rose-200">
              Hisobni o&apos;chirish
            </CardTitle>
            <CardDescription className="text-xs text-rose-700/80 dark:text-rose-400/80">
              Qarz Daftari platformasidagi hisobingiz va ma&apos;lumotlaringizni to&apos;liq o&apos;chirish
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Agar xizmatimizdan boshqa foydalanmoqchi bo&apos;lmasangiz, shaxsiy hisobingizni o&apos;chirishingiz mumkin.
          Apple App Store va Google Play qoidalariga muvofiq, hisob o&apos;chirilganda do&apos;kon sozlamalaringiz
          va shaxsiy ma&apos;lumotlaringiz tizimdan tozalanadi.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-2xl border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hisobni o&apos;chirish
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md rounded-3xl p-6 border-slate-200 dark:border-slate-800">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-center text-lg font-bold text-slate-900 dark:text-slate-100">
                Hisobingizni o&apos;chirishni tasdiqlaysizmi?
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Bu amalni <strong>ortga qaytarib bo&apos;lmaydi</strong>. Hisobingiz o&apos;chirilgandan so&apos;ng
                quyidagi amallar bajariladi:
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Do&apos;koningiz ma&apos;lumotlari va kassa kirishlari yopiladi.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Telegram bot (@debtbookuz_bot) bilan barcha aloqalar uziladi.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Telefon raqamingiz tizimdan bo&apos;shatiladi.</span>
              </div>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                O&apos;chirish sababini ko&apos;rsating (ixtiyoriy):
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {DELETION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs text-rose-900 dark:text-rose-200 leading-snug">
                Men barcha shaxsiy ma&apos;lumotlarim o&apos;chirilishiga va bu amalni ortga qaytarib bo&apos;lmasligiga to&apos;liq roziman.
              </span>
            </label>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto rounded-xl text-xs"
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={!confirmed || loading}
                className="w-full sm:w-auto rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    O&apos;chirilmoqda...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Ha, hisobimni o&apos;chirish
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
