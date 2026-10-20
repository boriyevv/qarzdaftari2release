// src/app/privacy/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Shield, Building, Mail, Phone } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<'uz' | 'ru'>('uz')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-lg">Qarz Daftari</span>
          </Link>
          <div className="flex items-center gap-3">
            <Tabs value={lang} onValueChange={(v) => setLang(v as 'uz' | 'ru')}>
              <TabsList className="grid grid-cols-2 w-32">
                <TabsTrigger value="uz">O'zb</TabsTrigger>
                <TabsTrigger value="ru">Рус</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" asChild variant="outline">
              <Link href="/login">Kirish</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {lang === 'uz' ? 'Maxfiylik siyosati' : 'Политика конфиденциальности'}
          </h1>
          <p className="text-slate-600">
            {lang === 'uz'
              ? 'Shaxsiy ma\'lumotlarni qayta ishlash va himoya qilish qoidalari'
              : 'Правила обработки и защиты персональных данных пользователей сервиса «Qarz Daftari»'}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-10 space-y-6 text-slate-700 leading-relaxed text-sm md:text-base">
            {lang === 'uz' ? (
              <>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">1. Qonuniy asos</h2>
                  <p>
                    Mazkur Maxfiylik siyosati O'zbekiston Respublikasining «Shaxsga doir ma'lumotlar to'g'risida»gi
                    Qonuniga muvofiq ishlab chiqilgan bo'lib, «Qarz Daftari» platformasida foydalanuvchilarning shaxsiy
                    ma'lumotlarini to'plash, saqlash va himoya qilish tartibini belgilaydi.
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">2. To'planadigan ma'lumotlar</h2>
                  <p>
                    Ro'yxatdan o'tishda foydalanuvchi ismi, telefon raqami, do'kon nomi va elektron pochta manzili
                    so'ralishi mumkin. Moliyaviy bank kartalari rekvizitlari (karta raqamlari, CVV kodlar) platforma
                    tomonidan saqlanmaydi va to'liq bank shlyuzi tomonidan qayta ishlanadi.
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">3. Ma'lumotlar xavfsizligi</h2>
                  <p>
                    Barcha ma'lumotlar xavfsiz shifrlangan ma'lumotlar bazalarida saqlanadi. Ma'lumotlar uchinchi
                    shaxslarga berilmaydi, qonunda nazarda tutilgan hollar bundan mustasno.
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">4. Aloqa</h2>
                  <p>Savollar bo'yicha email: boriyevdev08@gmail.com, tel: +998 (90) 443-55-67.</p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">1. Законодательная основа</h2>
                  <p>
                    Настоящая Политика разработана в соответствии с Законом Республики Узбекистан «О персональных
                    данных» и регулирует порядок сбора, хранения и защиты информации пользователей сервиса «Qarz Daftari».
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">2. Собираемые данные</h2>
                  <p>
                    При регистрации собираются данные: ФИО, номер телефона, название торговой точки, email. Полные
                    реквизиты банковских карт сервисом не сохраняются и не обрабатываются (передаются напрямую
                    сертифицированному банковскому шлюзу).
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">3. Безопасность</h2>
                  <p>
                    Все данные передаются по защищенному протоколу TLS/HTTPS и хранятся в защищенных СУБД. Передача
                    третьим лицам исключена.
                  </p>
                </section>
                <section className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">4. Контакты</h2>
                  <p>Email: boriyevdev08@gmail.com, тел: +998 (90) 443-55-67.</p>
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
