# 🗺️ Qarz Daftari — Production Launch & Development Roadmap

Loyihaning kelgusi rejalari, ishlab chiqarishga (Production) tayyorgarlik va barcha takomillashtirish vazifalari ro'yxati.

---

## 🚀 1. Production Launch Checklist (Serverga chiqishga to'liq tayyor)

Ushbu vazifalar platformaning `https://debtbook.uz` manzilida to'liq va uzluksiz ishlashini ta'minlash uchun ishlab chiqildi va `DEPLOYMENT.md` faylida to'liq hujjatlashtirildi:

- [x] **1. Uzum Bank, Payme & Click Webhook & Kalitlar**:
  - Click, Payme va Uzum Bank integratsiyalari tayyorlandi. Dual-mode xavfsiz arxitektura o'rnatildi: test kalitlari bilan ishlaydi, rasmiy moderatsiya tasdiqlangach production kalitlarga 1 daqiqada almashtiriladi.
  - Webhook manzillari belgilandi:
    - Click: `https://debtbook.uz/api/payments/click/webhook`
    - Payme: `https://debtbook.uz/api/payments/payme/webhook`
    - Uzum: `https://debtbook.uz/api/payments/uzum/webhook`
  - To'lovdan so'ng qaytish manzili: `https://debtbook.uz/dashboard?payment=success`.

- [x] **2. Atrof-muhit o'zgaruvchilari (Environment Variables)**:
  - Vercel uchun to'liq `.env.production.example` shabloni va `DEPLOYMENT.md` qo'llanmasi yaratildi:
    - `NEXT_PUBLIC_APP_URL=https://debtbook.uz`
    - Supabase, Eskiz, Click, Payme, Uzum va Cron sozlamalari to'liq jamlandi.

- [x] **3. Eskiz SMS Integratsiyasi (Real SMS yuborish)**:
  - Eskiz.uz avtomatik token olish, refresh va SMS yuborish mexanizmi sinovdan o'tkazildi. `ESKIZ_TEST_MODE=false` qilinishi bilan balansdan jonli SMS jo'natiladi.

- [x] **4. Server Hududi & Avtopilot Cron Jobs**:
  - `vercel.json` orqali server hududi Frankfurt (`fra1`) ga ulandi (O'zbekiston foydalanuvchilari uchun minimal kechikish).
  - Vercel Cron orqali har kuni ertalab soat 09:00 da (Toshkent vaqti) avtomatik fonda qarz eslatmalarini yuboruvchi `/api/cron/reminders` xizmati ulandi.

- [x] **5. Domen va SSL Sertifikati (debtbook.uz)**:
  - `debtbook.uz` DNS rekvizitlari belgilandi: `A` yozuvi $\rightarrow$ `76.76.21.21`, `CNAME` $\rightarrow$ `cname.vercel-dns.com`. Vercel orqali avtomatik bepul SSL ta'minlanadi.

---

## 💡 2. Kelajakdagi Yangi Imkoniyatlar (Feature Backlog)

Kelgusi versiyalarda amalga oshirish rejalashtirilgan takomillashtirishlar:

### 📱 Telegram Bot & Integratsiya

- [ ] Do'kon egasi uchun rasmiy `@QarzDaftariBot`:
  - Yangi qarz qo'shish (tezkor Telegram komandasi orqali).
  - Har kuni ertalab 09:00 da kunlik umumiy qarzlar va to'lovlar hisobotini Telegramga avtomatik yuborish.
  - Telegram Mini App (TMA): Qarz Daftari'ni to'g'ridan-to'g'ri Telegram ichida 1-bosishda ochish.
- [ ] Qarzdor mijozlar uchun bepul Telegram eslatmalari:
  - Eskiz SMS xarajatlarini tejash maqsadida mijozga Telegram orqali qarz eslatmasi va to'lov havolasini yuborish.

### 🔒 Mobil Xavfsizlik & Biometrika (Mobile Biometrics)

- [ ] Barmoq izi (Fingerprint) va Face ID bilan ilovani qulflash:
  - Do'kon egasi yoki kassir ilovani fondan qayta ochganda biometrik tekshiruv yoki 4 xonali PIN kod so'rash.
  - `@capacitor-community/biometric-auth` orqali native xavfsizlik ta'minlash.

### 🎨 Mobil Ilova Brendingi & Google Play / App Store Nashri

- [ ] Rasmiy ikonka va Splash screen generatsiyasi:
  - `@capacitor/assets` yordamida Qarz Daftari rasmiy logotipidan barcha Android adaptive ikonkalari (`hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) va iOS AppIcon'larini avtomatik yaratish.
- [ ] Google Play Store uchun imzolangan Release to'plami (`.aab`):
  - Keystore kaliti bilan imzolangan Android App Bundle (`.aab`) yig'ish va Google Play Console'ga yuklashga tayyorlash.

### 📊 Eksport va Buxgalteriya integratsiyasi

- [x] Qarzlar ro'yxatini Excel (.xlsx) va chiroyli PDF hisobot/chek formatida yuklab olish: Dashboard va Qarzlar ro'yxatida filtrga moslashuvchi tezkor Excel/PDF eksport tugmalari hamda har bir qarz uchun A5 rasmiy kvitansiya generatsiyasi joriy qilindi.
- [ ] 1C va tashqi savdo tizimlari (Poster, Billz, Jowi) bilan API integratsiyasi:
  - `/profile`da xavfsiz API kalit (Secret Token) generatsiyasi orqali tashqi kassa dasturlaridan qarzlar avtomatik sinxronlanishi.

### 💳 To'lov Tizimlarini Jonli Rejimga (Live Production) O'tkazish

- [ ] Click, Payme va Uzum Bank rasmiy shartnomalari tasdiqlangach, `.env.production` faylidagi test kalitlarini rasmiy jonli kalitlarga almashtirish va real to'lovlarni qabul qilish.

### 🔔 Aqlli Bildirishnomalar (Smart Reminders)

- [x] Qarz to'lov muddati tugashiga 3 kun qolganda avtomatik SMS yuborish (avtopilot rejim): Do'kon egasi uchun yagona Avto Eslatma boshqaruv modali (`AutoRemindersModal`) yaratildi (muddatiga 3 kun qolgan va kechikkan qarzdorlarni avtomatik saralash, 24 soatlik anti-spam filtri, jonli xabar tahriri, 1-klikda ommaviy yuborish) hamda `/api/cron/reminders` orqali to'liq avtomatik serverless cron avtopilot ta'minlandi.
- [x] Qarz to'langanda mijozga "Rahmat, to'lovingiz qabul qilindi" deb xushmuomala tasdiqnoma SMS yuborish: `AddPaymentModal`da SMS tasdiqnoma yuborish tanlovi qo'shildi, `/api/payments` endpointida xaridordan to'lov qabul qilinishi bilanoq avtomatik xushmuomala chek SMS xabari yuborilishi va kredit sarfi xavfsiz hisoblanishi joriy qilindi.

---

## 🎨 3. UI/UX Takomillashtirishlari

- [x] Dark / Light mode: `next-themes` orqali SSR miltillashsiz Light / Dark / System rejimlari, Topbar va Profil sozlamalaridagi ThemeToggle, hamda Slate Premium Dark to'liq ranglar uyg'unligi joriy qilindi.
- [x] Mobil PWA (Progressive Web App): Manifest (standalone, theme-color, icons), Service Worker, offline fallback (/offline va jonli OfflineIndicator), o'rnatish bannerlari (floating prompt, iOS Safari qo'llanma modali) hamda Sidebar va mobil Topbar'da o'rnatish tugmalari to'liq joriy qilindi.
- [x] Native Mobil Ilovalar (Android & iOS): Capacitor 8 orqali to'liq Android Studio va Xcode loyihalari yaratildi. Native status-bar, taktil haptics vibratsiyasi, apparat "orqaga" tugmasi, va yangi qarz kiritishda telefon kontaktlaridan tanlash (`@capacitor-community/contacts`) integratsiya qilindi. `MOBILE.md` qo'llanmasi yaratildi.
- [x] Mikro-tovushlar: Web Audio API orqali sintez qilingan yengil va zamonaviy kristallik chime ovozlari (to'lov qabul qilinganda, yangi qarz kiritilganda), sozlamalarda sinov va o'chirish/yoqish imkoni.

---

_Eslatma: Har qanday yangi g'oyani ushbu faylga qo'shib borishingiz mumkin. Antigravity bilan ishlashda unga "ROADMAP.md faylidagi keyingi vazifani qilaylik" deb buyruq berishingiz mumkin!_

## MY NOTES

- [x] **(1) Check the navigation from dashboard to others**: Yagona `AppShell` tizimi yaratildi, layout sakrashlari bartaraf etildi, breadcrumbs va barqaror navigatsiya barcha sahifalarga bog'landi. ----- (4)
- [x] **(2) Work on other payment provider, such as Payme and Click**: Payme Subscribe API (`cards.create`, `cards.verify`, `receipts.create`, `receipts.pay`) va On-site `PaymeOnSiteModal` ishlab chiqildi. Payme webhookidagi muhim xatolik (`createAdminClient`, `PerformTransaction` account/order resolution) bartaraf etildi. Click Shop API va On-site Card/Invoice tizimi to'liq testlandi va yagona sinov skripti (`npm run test:payments`) yaratildi. ----- (2)
- [x] **(3) AGAIN the UI design still kinda lacks**: Dashboard va Qarzlar ro'yxati (DebtsListDraggable) tubdan zamonaviy CRM uslubida qayta yaratildi: jonli qidiruv, 4 ta status filtri chiplari (Barchasi, Qarzdorlar, Muddati o'tgan, To'langan), saralash, bosh harfli gradient avatarlar, to'lov progress-bari, aqlli muddat nishonlari (pulsatsiyali kechikish ko'rsatkichi) va to'g'ridan-to'g'ri qatorda ko'rinadigan "+ To'lov", "SMS", "Qo'ng'iroq" tezkor tugmalari qo'shildi. Shimmer skeleton yuklanish holatlari integratsiya qilindi. ----- (3)
- [x] **(4) Work immediately on sidebar on all the routes**: Barcha marshrutlarda (`/dashboard`, `/analytics`, `/sms-credits`, `/pricing`, `/profile`, `/debtor/[phone]`) zamonaviy Collapsible Sidebar va mobil Drawer integratsiya qilindi. Dashboarddagi 288px'lik og'ir ikkinchi sidebar zamonaviy gorizontal `FolderFilterBar` chiplari bilan almashtirildi. ----- (1)
