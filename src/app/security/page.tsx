// src/app/security/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  AlertTriangle,
  FileCheck,
  Cpu,
  RefreshCw,
  Building,
  Mail,
  Phone,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function SecurityAntifraudPage() {
  const [lang, setLang] = useState<'uz' | 'ru'>('ru') // Default to Russian as Uzum Bank antifraud department audits in Russian

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-lg">Qarz Daftari</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Tabs value={lang} onValueChange={(v) => setLang(v as 'uz' | 'ru')}>
              <TabsList className="grid grid-cols-2 w-28 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="ru">Рус</TabsTrigger>
                <TabsTrigger value="uz">O&apos;zb</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" asChild variant="outline" className="border-slate-200 dark:border-slate-700">
              <Link href="/login">Kirish</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {lang === 'ru'
              ? 'Политика безопасности и предотвращения мошеннических операций'
              : 'Xavfsizlik va firibgarlikning oldini olish siyosati'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {lang === 'ru'
              ? 'Меры ограничения и контроля рисков мошеннических операций в рамках Договора интернет-эквайринга'
              : 'Internet-ekvayring shartnomasi doirasida xavflarni cheklash va firibgarlikni nazorat qilish choralari'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ru'
              ? 'Соответствует стандартам безопасности АО «UZUM BANK» и НПС'
              : 'AO «UZUM BANK» va Milliy to\'lov tizimi xavfsizlik talablariga muvofiq'}
          </p>
        </div>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6 md:p-10 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            {lang === 'ru' ? (
              <>
                {/* Antifraud Overview Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-emerald-900 dark:text-emerald-200 flex gap-4 items-start">
                  <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-base mb-1">
                      Контроль и минимизация рисков мошеннических операций
                    </h3>
                    <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-300">
                      Сервис «Qarz Daftari» (https://debtbook.uz) реализует комплекс мер противодействия
                      несанкционированным и мошенническим операциям, взаимодействуя с антифрод-системами банка-эквайера
                      (АО «UZUM BANK») в строгом соответствии с Договором интернет-эквайринга (ИЭ).
                    </p>
                  </div>
                </div>

                {/* Section 1 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      1. Протокол двухфакторной аутентификации 3D-Secure 2.0
                    </h2>
                  </div>
                  <p>
                    Все платежи по банковским картам (Uzcard, Humo) на сайте защищены технологией
                    строгой аутентификации держателя карты:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Обязательное подтверждение каждой операции одноразовым СМС-кодом (OTP) либо push-уведомлением в
                      банковском приложении эмитента карты.
                    </li>
                    <li>
                      Поддержка протоколов безопасности Uzcard 3DS и Humo 3DS.
                    </li>
                    <li>
                      Списание денежных средств без подтверждения держателя карты технологически исключено.
                    </li>
                  </ul>
                </section>

                {/* Section 2 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      2. Стандарт безопасности PCI-DSS и защита реквизитов карт
                    </h2>
                  </div>
                  <p>
                    В соответствии с требованиями безопасности международных платежных систем и АО «UZUM BANK»:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Сайт <strong>debtbook.uz</strong> не собирает, не обрабатывает и не сохраняет полные реквизиты
                      банковских карт (номер карты PAN, срок действия, CVV/CVC коды, ПИН-коды).
                    </li>
                    <li>
                      Ввод платежных данных осуществляется исключительно на защищенной платежной странице шлюза АО
                      «UZUM BANK», сертифицированной по наивысшему стандарту <strong>PCI-DSS Level 1</strong>.
                    </li>
                    <li>
                      Передача данных производится по зашифрованному каналу с использованием протоколов TLS 1.3 / HTTPS.
                    </li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      3. Ограничения и лимиты согласно Договору интернет-эквайринга
                    </h2>
                  </div>
                  <p>
                    В целях предотвращения мошеннических операций (включая перебор номеров карт, card-testing и несанкционированные массовые списания) на стороне предприятия и платежного шлюза установлены следующие ограничения:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg">
                      <strong className="block text-slate-900 dark:text-slate-100 text-sm mb-1">Лимит суммы одной операции:</strong>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Максимальная разовая сумма транзакции ограничена стоимостью действующих тарифных планов
                        сервиса и пакетов СМС.
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg">
                      <strong className="block text-slate-900 dark:text-slate-100 text-sm mb-1">Лимит попыток платежей:</strong>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Ограничение числа попыток оплаты с одного IP-адреса и учетной записи в единицу времени. При
                        повторных неудачных попытках транзакции блокируются.
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg">
                      <strong className="block text-slate-900 dark:text-slate-100 text-sm mb-1">Контроль сессий:</strong>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Время жизни платежной сессии строго ограничено интервалом от 10 до 20 минут (session timeout),
                        после чего ссылка на оплату аннулируется.
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-lg">
                      <strong className="block text-slate-900 dark:text-slate-100 text-sm mb-1">Геолокационный и IP-контроль:</strong>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Автоматический анализ аномальной сетевой активности, блокировка попыток несанкционированного
                        доступа через скомпрометированные прокси-сети.
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      4. Взаимодействие с антифрод-системой АО «UZUM BANK»
                    </h2>
                  </div>
                  <p>
                    Предприятие подключено к многоуровневой интеллектуальной системе антифрод-мониторинга Банка, которая
                    оценивает степень риска транзакции в режиме реального времени:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Проверка репутации карты и истории операций в экосистеме Uzum.</li>
                    <li>
                      Оценка скорости совершения операций (velocity checks) и мгновенный отказ в проведении транзакции
                      при обнаружении признаков фрода.
                    </li>
                    <li>
                      Автоматическая отправка уведомлений о подозрительных событиях через защищенные каналы API
                      эквайринга.
                    </li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      5. Порядок действий при выявлении подозрительных операций
                    </h2>
                  </div>
                  <p>
                    При поступлении сигнала о мошенничестве от Банка либо держателя карты:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Оператор незамедлительно приостанавливает предоставление услуги по спорной учетной записи.
                    </li>
                    <li>
                      Проводится внутренняя сверка идентификаторов транзакции (orderNumber, orderId, RRN) совместно со
                      службой антифрода АО «UZUM BANK».
                    </li>
                    <li>
                      При подтверждении неправомерного списания денежные средства в полном объеме возвращаются на карту
                      законного держателя через процедуру реверса/возврата (Refund).
                    </li>
                  </ol>
                </section>

                {/* Section 6 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                    6. Контакты службы безопасности и поддержки
                  </h2>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <strong>Предприятие:</strong> «ASADBEK BURIYEV WS» NTM (Сервис «Qarz Daftari»)
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <strong>Email службы безопасности:</strong> boriyevdev08@gmail.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <strong>Горячая линия:</strong> +998 (90) 443-55-67
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* Antifraud Overview Banner UZ */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-emerald-900 dark:text-emerald-200 flex gap-4 items-start">
                  <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-base mb-1">
                      Firibgarlik xavflarini cheklash va nazorat qilish
                    </h3>
                    <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-300">
                      «Qarz Daftari» platformasi (https://debtbook.uz) ekvayring banki (AO «UZUM BANK») bilan tuzilgan
                      Internet-ekvayring shartnomasi talablariga qat'iy muvofiq ravishda ruxsatsiz va firibgarlik
                      operatsiyalarining oldini olish bo'yicha to'liq xavfsizlik choralarini qo'llaydi.
                    </p>
                  </div>
                </div>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      1. 3D-Secure 2.0 ikki bosqichli autentifikatsiya
                    </h2>
                  </div>
                  <p>
                    Saytdagi har qanday to'lov operatsiyasi (Uzcard, Humo) 3D-Secure xalqaro
                    xavfsizlik protokoli orqali karta egasining shaxsiy telefoni (SMS-kod) orqali tasdiqlanadi. Karta
                    egasining ruxsatisiz mablag' yechilishi mutlaqo mumkin emas.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      2. PCI-DSS standarti va maxfiy ma'lumotlar himoyasi
                    </h2>
                  </div>
                  <p>
                    debtbook.uz sayti foydalanuvchilarning to'liq karta raqamlari (PAN), amal qilish muddati, CVV/CVC
                    kodlarini o'z serverida saqlamaydi va qayta ishlamaydi. To'lovlar xalqaro PCI-DSS Level 1
                    sertifikatiga ega AO «UZUM BANK» xavfsiz to'lov shlyuzida amalga oshiriladi.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      3. Ekvayring shartnomasi bo'yicha limitlar va cheklovlar
                    </h2>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Tranzaksiya limiti:</strong> Bitta to'lov summasi amaldagi tariflar va paketlar qiymati
                      bilan cheklangan.
                    </li>
                    <li>
                      <strong>Urinishlar soni cheklovi:</strong> Bitta IP va akkauntdan to'lov qilish urinishlari
                      cheklangan, shubhali takroriy urinishlar avtomatik bloklanadi.
                    </li>
                    <li>
                      <strong>Sessiya muddati:</strong> To'lov havolasi muddati 10-20 daqiqa bilan cheklangan.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                    4. Bog'lanish va xavfsizlik xizmati
                  </h2>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <strong>Tashkilot:</strong> «ASADBEK BURIYEV WS» NTM
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <strong>Email:</strong> boriyevdev08@gmail.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <strong>Telefon:</strong> +998 (90) 443-55-67
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
