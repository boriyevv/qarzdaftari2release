// src/app/payment-terms/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Building,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import {
  UzumBankLogo,
  ClickLogo,
  PaymeLogo,
  PaymentMethodsRow,
} from '@/components/payments/payment-logos'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function PaymentTermsPage() {
  const [lang, setLang] = useState<'uz' | 'ru'>('ru') // Default to Russian for Uzum Bank audit

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
          <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {lang === 'ru'
              ? 'Способы оплаты и правила возврата денежных средств'
              : 'To\'lov usullari va mablag\'larni qaytarish tartibi'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {lang === 'ru'
              ? 'Подробная информация о платежах, тарифах и процедуре возврата на сервисе «Qarz Daftari»'
              : '«Qarz Daftari» xizmatida to\'lovlar, tariflar va qaytarish qoidalari haqida to\'liq ma\'lumot'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ru'
              ? 'Официальный партнер: АО «UZUM BANK»'
              : 'Rasmiy hamkor: AO «UZUM BANK»'}
          </p>
        </div>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6 md:p-10 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            {lang === 'ru' ? (
              <>
                {/* 1. PAYMENT METHODS */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">1. Доступные способы оплаты</h2>
                  </div>
                  <p>
                    Оплата услуг сервиса «Qarz Daftari» (подписки Plus, Pro и пакеты СМС-кредитов) осуществляется
                    безналичным путем в национальной валюте Республики Узбекистан — <strong>сум (UZS)</strong>.
                    Комиссия с покупателя при оплате не взимается (0%).
                  </p>
                  <p>На сайте поддерживаются следующие платежные системы и методы:</p>

                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    {/* Uzum Bank */}
                    <div className="border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <UzumBankLogo className="h-10 w-auto rounded-lg shadow-xs" />
                          <span className="text-[10px] font-semibold bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            Рекомендуем
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          Интернет-эквайринг АО «UZUM BANK» и Uzum Pay.
                        </p>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-purple-100 dark:border-purple-900/50">
                        Uzcard, Humo
                      </div>
                    </div>

                    {/* Click */}
                    <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <ClickLogo className="h-8 w-auto rounded-lg shadow-xs" />
                          <span className="text-[10px] font-semibold bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            Online
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          Click Up, Click Pass и оплата через веб-шлюз.
                        </p>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-blue-100 dark:border-blue-900/50">
                        Uzcard, Humo
                      </div>
                    </div>

                    {/* Payme */}
                    <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <PaymeLogo className="h-8 w-auto rounded-lg shadow-xs" />
                          <span className="text-[10px] font-semibold bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            Online
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          Шлюз Payme и мобильное приложение.
                        </p>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-100 dark:border-emerald-900/50">
                        Uzcard, Humo
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider text-center">
                      Принимаемые банковские карты и сервисы:
                    </p>
                    <PaymentMethodsRow />
                  </div>
                </section>

                {/* 2. PAYMENT PROCEDURE */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">2. Порядок проведения оплаты</h2>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong>Выбор услуги:</strong> Пользователь выбирает подходящий тарифный план (Plus или Pro) в
                      разделе «Тарифы» либо требуемый пакет СМС-кредитов в разделе «СМС-кредиты».
                    </li>
                    <li>
                      <strong>Выбор платежной системы:</strong> В открывшемся окне выбирается удобный провайдер (Uzum
                      Bank, Click, Payme).
                    </li>
                    <li>
                      <strong>Перенаправление на защищенный шлюз:</strong> Пользователь автоматически перенаправляется
                      на защищенную платежную страницу выбранного банка (для Uzum Bank — шлюз АО «UZUM BANK»).
                    </li>
                    <li>
                      <strong>Подтверждение 3D-Secure:</strong> Держатель карты вводит реквизиты и подтверждает списание
                      одноразовым кодом из СМС от банка-эмитента карты.
                    </li>
                    <li>
                      <strong>Мгновенная активация:</strong> После успешного списания Пользователь возвращается в сервис
                      debtbook.uz, где тариф или баланс СМС активируется мгновенно в автоматическом режиме.
                    </li>
                  </ol>
                </section>

                {/* 3. REFUND POLICY */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <RotateCcw className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      3. Правила и порядок возврата денежных средств
                    </h2>
                  </div>
                  <p>
                    В соответствии с законодательством Республики Узбекистан «О защите прав потребителей» и условиями
                    Договора интернет-эквайринга:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-4">
                      <strong className="block text-rose-950 dark:text-rose-200 font-bold mb-1">
                        Обязательное банковское условие возврата:
                      </strong>
                      <p className="text-xs md:text-sm text-rose-900 dark:text-rose-300">
                        Возврат денежных средств осуществляется <strong>исключительно на ту же банковскую карту</strong>,
                        с которой была произведена первоначальная оплата. Выплата наличными денежными средствами либо
                        перевод на иные счета и карты третьих лиц не допускается правилами банковской безопасности и
                        эквайринга.
                      </p>
                    </div>

                    <p>
                      <strong>Основания для возврата денежных средств:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ошибочное двойное списание средств за один и тот же период подписки.</li>
                      <li>
                        Технический сбой в сервисе, приведший к невозможности предоставления оплаченных услуг более 48
                        часов подряд.
                      </li>
                      <li>
                        Обращение Пользователя об отмене подписки в течение 14 (четырнадцати) календарных дней с момента
                        первичной оплаты, если функционал сервиса фактически не использовался.
                      </li>
                    </ul>

                    <p>
                      <strong>Сроки обработки и перечисления возврата:</strong>
                    </p>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>
                        Заявка на возврат обрабатывается Оператором в течение <strong>1–2 рабочих дней</strong>. Зачисление
                        средств на карту Пользователя банком-эмитентом занимает от <strong>3 до 10 банковских дней</strong>{' '}
                        в зависимости от платежной системы.
                      </span>
                    </div>

                    <p>
                      <strong>Порядок подачи заявления на возврат:</strong>
                    </p>
                    <p className="text-sm">
                      Для оформления возврата отправьте запрос на адрес электронной почты{' '}
                      <a href="mailto:boriyevdev08@gmail.com" className="text-blue-600 underline font-semibold">
                        boriyevdev08@gmail.com
                      </a>{' '}
                      либо обратитесь в службу поддержки с указанием:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-sm">
                      <li>Номер телефона и имя учетной записи в сервисе Qarz Daftari.</li>
                      <li>Дата и точное время совершения транзакции.</li>
                      <li>Сумма платежа и скриншот электронного чека/выписки.</li>
                      <li>Причина запроса на возврат.</li>
                    </ol>
                  </div>
                </section>

                {/* 4. SUBSCRIPTION CANCELLATION */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">4. Отмена подписки</h2>
                  </div>
                  <p>
                    Пользователь вправе отказаться от продления платного тарифа в любой момент в личном кабинете в разделе
                    «Профиль» или обратившись в службу технической поддержки. При отмене подписки доступ к оплаченным
                    функциям сохраняется до окончания оплаченного периода, после чего учетная запись переводится на
                    бесплатный тариф «Free» без списания дополнительных средств.
                  </p>
                </section>

                {/* 5. CONTACTS */}
                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">5. Реквизиты и контакты поддержки</h2>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <strong>Предприятие:</strong> «ASADBEK BURIYEV WS» NTM (Сервис «Qarz Daftari»)
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <strong>Email:</strong> boriyevdev08@gmail.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <strong>Служба поддержки:</strong> +998 (90) 443-55-67 (пн-пт, с 9:00 до 18:00)
                    </p>
                    <p>
                      <strong>Telegram поддержки:</strong> @qarzdaftari_support_bot
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* UZBEK VERSION */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">1. To'lov usullari</h2>
                  </div>
                  <p>
                    «Qarz Daftari» platformasida pullik xizmatlar (Plus, Pro tariflari hamda SMS paketlar) uchun to'lovlar
                    O'zbekiston Respublikasi milliy valyutasi — <strong>so'm (UZS)</strong>da amalga oshiriladi.
                    Xaridordan qo'shimcha komissiya olinmaydi (0%).
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <div className="border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <UzumBankLogo className="h-10 w-auto rounded-lg shadow-xs mb-2" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">AO «UZUM BANK» ekvayring va Uzum Pay.</p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-purple-100 dark:border-purple-900/50">Uzcard, Humo</span>
                    </div>
                    <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <ClickLogo className="h-8 w-auto rounded-lg shadow-xs mb-2" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Click Up va veb-shlyuz.</p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-blue-100 dark:border-blue-900/50">Uzcard, Humo</span>
                    </div>
                    <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <PaymeLogo className="h-8 w-auto rounded-lg shadow-xs mb-2" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Payme to'lov tizimi.</p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-emerald-100 dark:border-emerald-900/50">Uzcard, Humo</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider text-center">
                      Qabul qilinadigan bank kartalari va to'lov tizimlari:
                    </p>
                    <PaymentMethodsRow />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <RotateCcw className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">2. Mablag'larni qaytarish qoidalari</h2>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-4">
                    <strong className="block text-rose-950 dark:text-rose-200 font-bold mb-1">Majburiy bank qoidasi:</strong>
                    <p className="text-xs md:text-sm text-rose-900 dark:text-rose-300">
                      Bank xavfsizligi qoidalariga ko'ra, mablag'lar <strong>faqat to'lov amalga oshirilgan bank kartasining o'ziga</strong> qaytariladi.
                      Naqd pul berish yoki begona kartalarga o'tkazish qat'iyan taqiqlanadi.
                    </p>
                  </div>
                  <p>
                    <strong>Qaytarish muddatlari:</strong> Ariza qabul qilingandan so'ng Ijrochi tomonidan 1-2 ish kunida ko'rib chiqiladi va bank tizimi orqali 3 dan 10 bank ish kunigacha bo'lgan muddatda kartaga qaytariladi.
                  </p>
                  <p>
                    <strong>Qaytarish uchun murojaat:</strong> boriyevdev08@gmail.com yoki +998 (90) 443-55-67 raqamiga to'lov cheki va akkaunt ma'lumotlarini taqdim etgan holda murojaat qilinadi.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">3. Bog'lanish va rekvizitlar</h2>
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-2 text-xs md:text-sm">
                    <p><strong>Tashkilot:</strong> «ASADBEK BURIYEV WS» NTM</p>
                    <p><strong>Email:</strong> boriyevdev08@gmail.com</p>
                    <p><strong>Telefon:</strong> +998 (90) 443-55-67</p>
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
