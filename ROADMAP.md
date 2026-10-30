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

- [ ] Dark / Light mode to'liq almashinuvchi tugmasi.
- [ ] Mobil PWA (Progressive Web App): Telefon ekraniga ilova kabi o'rnatib olish imkoni.
- [ ] Mikro-tovushlar: To'lov qabul qilinganda yoqimli muvaffaqiyat ovozi.

---

_Eslatma: Har qanday yangi g'oyani ushbu faylga qo'shib borishingiz mumkin. Antigravity bilan ishlashda unga "ROADMAP.md faylidagi keyingi vazifani qilaylik" deb buyruq berishingiz mumkin!_

## MY NOTES

(1) Chech the navigation from dashboard to others because the current version is kinda daunting to navigate easily
(2) Work on other payment provider, such as Payme and Click
(3) AGAIN the UI design still kinda lacks
