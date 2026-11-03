# 🗺️ Qarz Daftari — Production Launch & Development Roadmap

Loyihaning kelgusi rejalari, ishlab chiqarishga (Production) tayyorgarlik va barcha takomillashtirish vazifalari ro'yxati.

---

## 🚀 1. Production Launch Checklist (Serverga chiqishdan oldin)

Ushbu vazifalar platformaning `https://debtbook.uz` manzilida to'liq va uzluksiz ishlashini ta'minlash uchun zarur:

- [ ] **1. Uzum Bank Merchant Moderatsiyasi & Webhook**:
  - Uzum Bank yordamchisi bilan shartnoma tuzilib, akkaunt rasmiy tasdiqlangach (Production mode):
    - `.env.production` faylida `UZUM_API_KEY` va `UZUM_SERVICE_ID` ishlab chiqarish kalitlariga almashtiriladi.
    - Uzum shaxsiy kabinetida Webhook URL o'rnatiladi: `https://debtbook.uz/api/payments/uzum/webhook`.
  - To'lovdan so'ng qaytish manzili: `https://debtbook.uz/dashboard?payment=success`.

- [ ] **2. Atrof-muhit o'zgaruvchilari (Environment Variables)**:
  - Vercel yoki production hosting sozlamalarida quyidagilar kiritilishi shart:
    - `NEXT_PUBLIC_APP_URL=https://debtbook.uz` (hech qanday localhost emas)
    - `NEXT_PUBLIC_SUPABASE_URL=...`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
    - `SUPABASE_SERVICE_ROLE_KEY=...`
    - `UZUM_API_KEY=...` & `UZUM_SERVICE_ID=...`
    - `ESKIZ_EMAIL=...` & `ESKIZ_PASSWORD=...`

- [ ] **3. Eskiz SMS Integratsiyasi (Real SMS yuborish)**:
  - `eskiz.uz` hisobiga pul tashlash va tasdiqlangan sender nickname olish (masalan, `4546` yoki `QarzDaftar`).
  - SMS shablonlarini tekshirish va qarz eslatmalarining yetib borishini test qilish.

- [ ] **4. Supabase RLS & Cron Jobs**:
  - Supabase'da Row Level Security (RLS) qoidalari faolligini qayta tekshirish (foydalanuvchilar faqat o'z qarzlarini ko'ra olishi shart).
  - Obuna muddati tugagan foydalanuvchilar tarifini avtomatik 'FREE'ga tushirish uchun Supabase pg_cron yoki Next.js cron API yaratish.

- [ ] **5. Domen va SSL Sertifikati**:
  - `debtbook.uz` domenini hostingga ulash (A yoki CNAME yozuvlari).
  - HTTPS / SSL to'liq yoqilganligini tekshirish.

---

## 💡 2. Kelajakdagi Yangi Imkoniyatlar (Feature Backlog)

Kelgusi versiyalarda amalga oshirish rejalashtirilgan takomillashtirishlar:

### 📱 Telegram Bot & Integratsiya

- [ ] Do'kon egasi uchun rasmiy `@QarzDaftariBot`:
  - Yangi qarz qo'shish (tezkor komanda orqali).
  - Kunlik/haftalik qarzlar hisobotini Telegramga yuborish.
- [ ] Mijozlar uchun Telegram orqali qarz eslatmasi (SMS krediti tejaladi).

### 👥 Ko'p foydalanuvchilik rejim (Multi-user / Cashiers)

- [ ] Katta do'konlar uchun: Sotuvchi/Kassir akkauntlarini qo'shish imkoniyati.
- [ ] Kassir faqat yangi qarz kiritishi va qabul qilishi mumkin, lekin tahlillarni o'chira olmaydi.

### 📊 Eksport va Buxgalteriya integratsiyasi

- [ ] Qarzlar ro'yxatini Excel (.xlsx) va chiroyli PDF chek formatida yuklab olish.
- [ ] 1C yoki boshqa savdo tizimlari bilan API orqali sinxronizatsiya.

### 🔔 Aqlli Bildirishnomalar (Smart Reminders)

- [ ] Qarz to'lov muddati tugashiga 3 kun qolganda avtomatik SMS yuborish (avtopilot rejim).
- [ ] Qarz to'langanda mijozga "Rahmat, to'lovingiz qabul qilindi" deb xushmuomala tasdiqnoma SMS yuborish.

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
