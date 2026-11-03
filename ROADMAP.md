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
  - Yangi qarz qo'shish (tezkor komanda orqali).
  - Kunlik/haftalik qarzlar hisobotini Telegramga yuborish.
- [ ] Mijozlar uchun Telegram orqali qarz eslatmasi (SMS krediti tejaladi).

### 👥 Ko'p foydalanuvchilik rejim (Multi-user / Cashiers)

- [x] Katta do'konlar uchun: Sotuvchi/Kassir akkauntlarini qo'shish imkoniyati: Do'kon egasi profilida (`/profile`) "Do'kon xodimlari va Kassirlar" boshqaruv markazi (`CashiersManagement`), kassir biriktirish modali (ism, telefon, login, parol, ruxsatlar), akkauntni faolsizlantirish/yoqish va o'chirish imkoniyati, hamda login oynasida alohida "Kassir 👥 (Telefon/Login + Parol)" tezkor kirish tizimi joriy qilindi.
- [x] Kassir huquqlarini cheklash: Kassir faqat do'kon qarzlari bilan ishlaydi, yangi qarz kiritishi va to'lov qabul qilishi mumkin; lekin qarz yozuvlarini butunlay o'chirish (DELETE ruxsati serverda qat'iy 403 bilan bloklangan - faqat do'kon egasi o'chira oladi), do'kon obunasi va tariflarini o'zgartirish cheklangan.

### 📊 Eksport va Buxgalteriya integratsiyasi

- [x] Qarzlar ro'yxatini Excel (.xlsx) va chiroyli PDF hisobot/chek formatida yuklab olish: Dashboard va Qarzlar ro'yxatida filtrga moslashuvchi tezkor Excel/PDF eksport tugmalari hamda har bir qarz uchun A5 rasmiy kvitansiya generatsiyasi joriy qilindi.
- [ ] 1C yoki boshqa savdo tizimlari bilan API orqali sinxronizatsiya.

### 🔔 Aqlli Bildirishnomalar (Smart Reminders)

- [x] Qarz to'lov muddati tugashiga 3 kun qolganda avtomatik SMS yuborish (avtopilot rejim): Do'kon egasi uchun yagona Avto Eslatma boshqaruv modali (`AutoRemindersModal`) yaratildi (muddatiga 3 kun qolgan va kechikkan qarzdorlarni avtomatik saralash, 24 soatlik anti-spam filtri, jonli xabar tahriri, 1-klikda ommaviy yuborish) hamda `/api/cron/reminders` orqali to'liq avtomatik serverless cron avtopilot ta'minlandi.
- [x] Qarz to'langanda mijozga "Rahmat, to'lovingiz qabul qilindi" deb xushmuomala tasdiqnoma SMS yuborish: `AddPaymentModal`da SMS tasdiqnoma yuborish tanlovi qo'shildi, `/api/payments` endpointida xaridordan to'lov qabul qilinishi bilanoq avtomatik xushmuomala chek SMS xabari yuborilishi va kredit sarfi xavfsiz hisoblanishi joriy qilindi.

---

## 🎨 3. UI/UX Takomillashtirishlari

- [x] Dark / Light mode: `next-themes` orqali SSR miltillashsiz Light / Dark / System rejimlari, Topbar va Profil sozlamalaridagi ThemeToggle, hamda Slate Premium Dark to'liq ranglar uyg'unligi joriy qilindi.
- [x] Mobil PWA (Progressive Web App): Manifest (standalone, theme-color, icons), Service Worker, offline fallback (/offline va jonli OfflineIndicator), o'rnatish bannerlari (floating prompt, iOS Safari qo'llanma modali) hamda Sidebar va mobil Topbar'da o'rnatish tugmalari to'liq joriy qilindi.
- [x] Mikro-tovushlar: Web Audio API orqali sintez qilingan yengil va zamonaviy kristallik chime ovozlari (to'lov qabul qilinganda, yangi qarz kiritilganda), sozlamalarda sinov va o'chirish/yoqish imkoni.

---

_Eslatma: Har qanday yangi g'oyani ushbu faylga qo'shib borishingiz mumkin. Antigravity bilan ishlashda unga "ROADMAP.md faylidagi keyingi vazifani qilaylik" deb buyruq berishingiz mumkin!_

## MY NOTES

- [x] **(1) Check the navigation from dashboard to others**: Yagona `AppShell` tizimi yaratildi, layout sakrashlari bartaraf etildi, breadcrumbs va barqaror navigatsiya barcha sahifalarga bog'landi. ----- (4)
- [x] **(2) Work on other payment provider, such as Payme and Click**: Payme Subscribe API (`cards.create`, `cards.verify`, `receipts.create`, `receipts.pay`) va On-site `PaymeOnSiteModal` ishlab chiqildi. Payme webhookidagi muhim xatolik (`createAdminClient`, `PerformTransaction` account/order resolution) bartaraf etildi. Click Shop API va On-site Card/Invoice tizimi to'liq testlandi va yagona sinov skripti (`npm run test:payments`) yaratildi. ----- (2)
- [x] **(3) AGAIN the UI design still kinda lacks**: Dashboard va Qarzlar ro'yxati (DebtsListDraggable) tubdan zamonaviy CRM uslubida qayta yaratildi: jonli qidiruv, 4 ta status filtri chiplari (Barchasi, Qarzdorlar, Muddati o'tgan, To'langan), saralash, bosh harfli gradient avatarlar, to'lov progress-bari, aqlli muddat nishonlari (pulsatsiyali kechikish ko'rsatkichi) va to'g'ridan-to'g'ri qatorda ko'rinadigan "+ To'lov", "SMS", "Qo'ng'iroq" tezkor tugmalari qo'shildi. Shimmer skeleton yuklanish holatlari integratsiya qilindi. ----- (3)
- [x] **(4) Work immediately on sidebar on all the routes**: Barcha marshrutlarda (`/dashboard`, `/analytics`, `/sms-credits`, `/pricing`, `/profile`, `/debtor/[phone]`) zamonaviy Collapsible Sidebar va mobil Drawer integratsiya qilindi. Dashboarddagi 288px'lik og'ir ikkinchi sidebar zamonaviy gorizontal `FolderFilterBar` chiplari bilan almashtirildi. ----- (1)
