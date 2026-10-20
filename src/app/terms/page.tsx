// src/app/terms/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Shield, CheckCircle2, Building, Mail, Phone } from 'lucide-react'

export default function TermsPage() {
  const [lang, setLang] = useState<'uz' | 'ru'>('uz')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {lang === 'uz' ? 'Ommaviy Oferta' : 'Публичная оферта'}
          </h1>
          <p className="text-slate-600">
            {lang === 'uz'
              ? 'Qarz Daftari platformasidan foydalanish shartlari va xizmat ko\'rsatish shartnomasi'
              : 'Договор публичной оферты на оказание услуг сервиса «Qarz Daftari»'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'uz' ? 'Oxirgi yangilanish: 2026-yil 1-fevral' : 'Редакция действует с 1 февраля 2026 г.'}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-10 space-y-8 text-slate-700 leading-relaxed text-sm md:text-base">
            {lang === 'uz' ? (
              <>
                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">1. Umumiy qoidalar</h2>
                  <p>
                    1.1. Mazkur hujjat O'zbekiston Respublikasi Fuqarolik kodeksining 367 va 369-moddalariga muvofiq
                    rasmiy ommaviy oferta (keyingi o'rinlarda — «Oferta») hisoblanadi va «Qarz Daftari» dasturiy
                    ta'minoti operatori (keyingi o'rinlarda — «Ijrochi») tomonidan jismoniy va yuridik shaxslarga
                    (keyingi o'rinlarda — «Buyurtmachi» yoki «Foydalanuvchi») xizmatlar ko'rsatish shartlarini belgilaydi.
                  </p>
                  <p>
                    1.2. Saytda (<strong>https://debtbook.uz</strong>) ro'yxatdan o'tish, shaxsiy hisob yaratish yoki
                    har qanday tarif rejasiga to'lov qilish mazkur Oferta shartlarini to'liq va so'zsiz qabul qilish
                    (aksept) hisoblanadi (O'zR FK 370-moddasi).
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">2. Asosiy atamalar va ta'riflar</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Platforma (Xizmat)</strong> — qarzlar hisobini yuritish, do'kon va mijozlar o'rtasidagi
                      moliyaviy munosabatlarni tartibga solish, SMS-eslatmalar yuborish va hisobotlar shakllantirish
                      imkonini beruvchi «Qarz Daftari» dasturiy-apparat majmuasi (sayt: https://debtbook.uz).
                    </li>
                    <li>
                      <strong>Foydalanuvchi</strong> — mazkur Oferta shartlarini qabul qilgan va Platformadan
                      foydalanayotgan muomalaga layoqatli jismoniy shaxs, yakka tartibdagi tadbirkor yoki yuridik shaxs.
                    </li>
                    <li>
                      <strong>Obuna (Tarif)</strong> — Platformaning qo'shimcha imkoniyatlaridan (Plus, Pro) belgilangan
                      muddat davomida foydalanish huquqi.
                    </li>
                    <li>
                      <strong>SMS Paketlar</strong> — qarzdorlarga bildirishnoma va eslatmalar yuborish uchun sotib
                      olinadigan xabarlar miqdori.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">3. Shartnoma predmeti</h2>
                  <p>
                    3.1. Ijrochi Buyurtmachiga Platformaning funksional imkoniyatlaridan (bepul yoki pullik tariflar
                    asosida) masofadan foydalanish bo'yicha noeksklyuziv litsenziya taqdim etadi, shuningdek,
                    SMS-xabarnomalar yuborish xizmatlarini ko'rsatadi.
                  </p>
                  <p>
                    3.2. Platforma moliyaviy muassasa, bank yoki kredit tashkiloti hisoblanmaydi, to'g'ridan-to'g'ri qarz
                    berish yoki qarz undirish xizmatlarini ko'rsatmaydi, balki faqatgina buxgalteriya va hisob-kitob
                    yordamchi vositasi vazifasini bajaradi.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">4. Xizmatlar qiymati va to'lov tartibi</h2>
                  <p>
                    4.1. Pullik xizmatlar (Plus, Pro tariflari va SMS kreditlar) narxi Platformaning «Tariflar» bo'limida
                    ko'rsatilgan va O'zbekiston so'mida (UZS) belgilanadi.
                  </p>
                  <p>
                    4.2. To'lovlar O'zbekiston Respublikasi hududida litsenziyalangan to'lov tizimlari (Uzum Bank, Click,
                    Payme, Uzcard, Humo, Visa, MasterCard) orqali onlayn amalga oshiriladi.
                  </p>
                  <p>
                    4.3. To'lov to'liq avans (100% oldindan to'lov) shaklida qabul qilinadi. To'lov muvaffaqiyatli
                    amalga oshirilgan zahoti tanlangan tarif yoki SMS paketi Foydalanuvchi hisobida avtomatik faollashadi.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">5. Tomonlarning huquq va majburiyatlari</h2>
                  <p>
                    5.1. <strong>Ijrochi majburiyatlari:</strong> Platformaning uzluksiz ishlashini ta'minlash,
                    Foydalanuvchi ma'lumotlarining xavfsizligini saqlash, to'lov qilingan xizmatlarni o'z vaqtida taqdim etish.
                  </p>
                  <p>
                    5.2. <strong>Foydalanuvchi majburiyatlari:</strong> Haqiqiy ma'lumotlarni kiritish, o'z hisob
                    ma'lumotlari (parol va SMS-kodlar) maxfiyligini ta'minlash, Platformadan qonunga zid maqsadlarda
                    foydalanmaslik.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">6. Shartnomani bekor qilish va to'lovni qaytarish</h2>
                  <p>
                    6.1. Foydalanuvchi istalgan vaqtda obunani bekor qilish huquqiga ega.
                  </p>
                  <p>
                    6.2. Mablag'larni qaytarish va nizolarni ko'rib chiqish Platformaning «To'lov va qaytarish qoidalari»
                    hamda O'zbekiston Respublikasi iste'molchilar huquqlarini himoya qilish to'g'risidagi qonunchilik
                    hujjatlariga asosan amalga oshiriladi.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">7. Korxona rekvizitlari va aloqa</h2>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <strong>Korxona nomi:</strong> «ASADBEK BURIYEV WS» NTM / «Qarz Daftari»
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <strong>Email:</strong> boriyevdev08@gmail.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <strong>Telefon:</strong> +998 (90) 443-55-67
                    </p>
                    <p>
                      <strong>Veb-sayt:</strong> https://debtbook.uz
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">1. Общие положения</h2>
                  <p>
                    1.1. Настоящий документ является официальным предложением (публичной офертой в соответствии со
                    статьями 367, 369 Гражданского кодекса Республики Узбекистан) Оператора сервиса «Qarz Daftari»
                    (далее — «Исполнитель») и определяет условия предоставления программного сервиса физическим и
                    юридическим лицам (далее — «Пользователь»).
                  </p>
                  <p>
                    1.2. Регистрация на сайте <strong>https://debtbook.uz</strong>, создание личного кабинета либо
                    совершение оплаты услуг признается полным и безоговорочным акцептом настоящей Оферты (ст. 370 ГК РУз).
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">2. Предмет оферты</h2>
                  <p>
                    2.1. Исполнитель предоставляет Пользователю право удаленного доступа (простую неисключительную
                    лицензию SaaS) к сервису «Qarz Daftari» для автоматизации учета взаиморасчетов, долговых записей,
                    ведения аналитики и отправки СМС-уведомлений контрагентам.
                  </p>
                  <p>
                    2.2. Сервис не является кредитной организацией или банком, не осуществляет коллекторскую
                    деятельность и выполняет исключительно расчетно-учетную функцию.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">3. Стоимость услуг и порядок оплаты</h2>
                  <p>
                    3.1. Стоимость тарифов подписки (Plus, Pro) и пакетов СМС-кредитов указана на Сайте в разделе
                    «Тарифы» и выражается в узбекских сумах (UZS).
                  </p>
                  <p>
                    3.2. Оплата производится безналичным способом через авторизованные платежные шлюзы (АО «UZUM BANK»,
                    Click, Payme, банковские карты Uzcard, Humo, Visa, MasterCard).
                  </p>
                  <p>
                    3.3. Услуги предоставляются на условиях 100% предоплаты. Активация выбранного тарифного плана
                    осуществляется моментально после получения подтверждения платежа от банка-эквайера.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">4. Безопасность и защита данных</h2>
                  <p>
                    4.1. Исполнитель обеспечивает конфиденциальность учетных данных и безопасность транзакций в
                    соответствии с требованиями стандартов PCI-DSS и законодательства Республики Узбекистан.
                  </p>
                  <p>
                    4.2. Исполнитель не собирает и не хранит полные реквизиты банковских карт Пользователей. Все
                    платежи обрабатываются защищенными шлюзами эквайринга.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2">5. Реквизиты исполнителя</h2>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <strong>Организация:</strong> «ASADBEK BURIYEV WS» NTM / «Qarz Daftari»
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <strong>Email:</strong> boriyevdev08@gmail.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <strong>Телефон:</strong> +998 (90) 443-55-67
                    </p>
                    <p>
                      <strong>Веб-сайт:</strong> https://debtbook.uz
                    </p>
                  </div>
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
