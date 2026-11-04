// src/components/profile/cashiers-management.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Power,
  Lock,
  Phone,
  User,
  KeyRound,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUser } from '@/lib/contexts/user-context'
import { playSuccessSound } from '@/lib/sounds'

interface CashierItem {
  id: string
  full_name: string
  phone: string
  username: string
  store_name: string
  is_active: boolean
  created_at: string
  permissions: string[]
}

export function CashiersManagement() {
  const { user } = useUser()
  const isCashier = user?.role === 'cashier'

  const [cashiers, setCashiers] = useState<CashierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Add Cashier Modal State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998',
    username: '',
    password: '',
    canCreateDebt: true,
    canAddPayment: true,
    canSendSMS: true,
  })

  // Delete confirmation
  const [cashierToDelete, setCashierToDelete] = useState<CashierItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isCashier) {
      fetchCashiers()
    }
  }, [isCashier])

  const fetchCashiers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cashiers')
      if (res.ok) {
        const data = await res.json()
        setCashiers(data.cashiers || [])
      } else {
        const errData = await res.json()
        setError(errData.error || 'Kassirlarni yuklashda xatolik')
      }
    } catch (err) {
      setError('Server bilan bog\'lanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleToggleActive = async (cashier: CashierItem) => {
    try {
      const nextStatus = !cashier.is_active
      const res = await fetch(`/api/cashiers/${cashier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextStatus }),
      })

      if (res.ok) {
        setCashiers((prev) =>
          prev.map((c) => (c.id === cashier.id ? { ...c, is_active: nextStatus } : c))
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Holatni o\'zgartirishda xatolik')
      }
    } catch (err) {
      alert('Tarmoq xatosi')
    }
  }

  const handleDeleteCashier = async () => {
    if (!cashierToDelete) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/cashiers/${cashierToDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCashiers((prev) => prev.filter((c) => c.id !== cashierToDelete.id))
        setCashierToDelete(null)
      } else {
        const data = await res.json()
        alert(data.error || 'O\'chirishda xatolik')
      }
    } catch (err) {
      alert('Tarmoq xatosi')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Form validation
    if (!formData.full_name.trim()) {
      setFormError('Kassir ismini kiriting')
      return
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '')
    if (!/^\+998\d{9}$/.test(cleanPhone)) {
      setFormError('Telefon raqami +998901234567 formatida bo\'lishi shart')
      return
    }

    if (!formData.username.trim() || formData.username.length < 3) {
      setFormError('Foydalanuvchi nomi kamida 3 ta belgi bo\'lishi kerak')
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }

    const permissions: string[] = []
    if (formData.canCreateDebt) permissions.push('create_debt')
    if (formData.canAddPayment) permissions.push('add_payment')
    if (formData.canSendSMS) permissions.push('send_sms')

    try {
      setSubmitting(true)
      const res = await fetch('/api/cashiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: cleanPhone,
          username: formData.username.toLowerCase().trim(),
          password: formData.password,
          permissions,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        playSuccessSound()
        setFormSuccess('Kassir muvaffaqiyatli qo\'shildi!')
        setCashiers((prev) => [data.cashier, ...prev])
        setTimeout(() => {
          setIsAddOpen(false)
          setFormData({
            full_name: '',
            phone: '+998',
            username: '',
            password: '',
            canCreateDebt: true,
            canAddPayment: true,
            canSendSMS: true,
          })
          setFormSuccess(null)
        }, 1200)
      } else {
        setFormError(data.error || 'Kassir yaratishda xatolik yuz berdi')
      }
    } catch (err) {
      setFormError('Tarmoq xatosi')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── IF CURRENT USER IS A CASHIER ──────────────────────────────────────
  if (isCashier) {
    return (
      <Card className="rounded-3xl border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Kassir Maqomi
            </CardTitle>
            <Badge className="bg-purple-600 text-white font-bold text-[10px] ml-auto uppercase tracking-wider">
              Kassir Akkaunti
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
            Siz ushbu do&apos;konda vakolatli sotuvchi/kassir sifatida tizimga kirgansiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Biriktirilgan do&apos;kon:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user?.store_name || "Mening Do'konim"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Sizning vakolatlaringiz:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Qarz kiritish, To&apos;lov qabul qilish, SMS
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cheklov:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Qarzlarni o&apos;chirish taqiqlangan
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── STORE OWNER VIEW ──────────────────────────────────────────────────
  const activeCount = cashiers.filter((c) => c.is_active).length

  return (
    <>
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Do&apos;kon xodimlari va Kassirlar
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sotuvchi va kassirlar uchun cheklangan huquqli alohida kirish hisoblari
              </CardDescription>
            </div>

            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Yangi kassir qo&apos;shish</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick stats & explanation banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {cashiers.length}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Jami kassirlar</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cashiers.length} ta xodim
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                {activeCount}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Faol holatda</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {activeCount} ta akkaunt
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">Xavfsizlik</p>
                <p className="text-[10px] text-amber-800/80 dark:text-amber-300">
                  Kassir qarzni o&apos;chira olmaydi
                </p>
              </div>
            </div>
          </div>

          {/* List of cashiers */}
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              Kassirlar ro&apos;yxati yuklanmoqda...
            </div>
          ) : cashiers.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hozircha birorta kassir qo&apos;shilmagan
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                Do&apos;koningiz sotuvchilariga alohida akkaunt berib, ularga faqat qarz kiritish va to&apos;lov olish huquqini bering.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="rounded-xl text-xs font-bold"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Birinchi kassirni qo&apos;shish
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
              {cashiers.map((cashier) => (
                <div
                  key={cashier.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                      {cashier.full_name?.[0]?.toUpperCase() || 'K'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {cashier.full_name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0 ${
                            cashier.is_active
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {cashier.is_active ? 'Faol' : 'To\'xtatilgan'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cashier.phone}
                          <button
                            type="button"
                            onClick={() => handleCopy(cashier.phone, cashier.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5 cursor-pointer transition-colors"
                            title="Nusxalash"
                          >
                            {copiedId === cashier.id ? (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>
                        <span>•</span>
                        <span>login: <strong className="font-mono text-slate-700 dark:text-slate-300">{cashier.username}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(cashier)}
                      className={`h-8 px-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        cashier.is_active
                          ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                      }`}
                      title={cashier.is_active ? 'Kassir kirishini to\'xtatish' : 'Kassir kirishini yoqish'}
                    >
                      <Power className={`w-3 h-3 mr-1 ${cashier.is_active ? 'text-amber-500' : 'text-emerald-600'}`} />
                      {cashier.is_active ? 'To\'xtatish' : 'Yoqish'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCashierToDelete(cashier)}
                      className="h-8 px-2.5 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 border-rose-200 dark:border-rose-900/50 transition-colors"
                      title="Kassirni butunlay o'chirish"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── ADD CASHIER MODAL ────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Yangi Kassir Qo&apos;shish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Sotuvchi/kassirga alohida kirish ma&apos;lumotlari va parolini belgilang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCashier} className="space-y-3.5 pt-1">
            {formError && (
              <Alert variant="destructive" className="py-2.5 rounded-xl">
                <AlertDescription className="text-xs">{formError}</AlertDescription>
              </Alert>
            )}

            {formSuccess && (
              <Alert className="py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                <AlertDescription className="text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {formSuccess}
                </AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kassir F.I.Sh
              </Label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  placeholder="Masalan: Sardor Aliyev"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-9 h-10 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Telefon raqami (Kirish uchun)
              </Label>
              <div className="relative mt-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  placeholder="+998901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-9 h-10 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Foydalanuvchi nomi
                </Label>
                <Input
                  required
                  placeholder="sardor_kassir"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                  }
                  className="mt-1 h-10 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kirish paroli
                </Label>
                <div className="relative mt-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    type="password"
                    placeholder="kamida 6 ta belgi"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-8 h-10 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Kassir vakolatlari:
              </Label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canCreateDebt}
                    onChange={(e) => setFormData({ ...formData, canCreateDebt: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span>Yangi qarz kiritish huquqi</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canAddPayment}
                    onChange={(e) => setFormData({ ...formData, canAddPayment: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span>Qarzga to&apos;lov qabul qilish huquqi</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canSendSMS}
                    onChange={(e) => setFormData({ ...formData, canSendSMS: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span>Mijozga SMS eslatma/chek yuborish</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 h-10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? 'Saqlanmoqda...' : 'Kassirni Saqlash'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      <Dialog
        open={!!cashierToDelete}
        onOpenChange={(open) => !open && setCashierToDelete(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Kassirni o&apos;chirish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Haqiqatan ham <strong>{cashierToDelete?.full_name}</strong> hisobini o&apos;chirmoqchimisiz? Ushbu kassir endi do&apos;kon hisobiga kira olmaydi.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCashierToDelete(null)}
              className="flex-1 h-10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCashier}
              disabled={deleting}
              className="flex-1 h-10 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer transition-colors disabled:cursor-not-allowed"
            >
              {deleting ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
