# 🚀 Qarz Daftari — Production Launch Qo'llanmasi (debtbook.uz)

Ushbu qo'llanma **Qarz Daftari** platformasini Vercel hostingida `https://debtbook.uz` domeni ostida to'liq ishga tushirish uchun qadamma-qadam yo'riqnomadir.

---

## 📋 1. Vercelga Loyihani Joylashtirish (Deploy)

### 1-qadam: GitHub Repozitoriyga Push Qilish
Barcha so'nggi o'zgarishlar `main` branch'ga yuklanganligiga ishonch hosil qiling:
```bash
git status
git push origin main
```

### 2-qadam: Vercel loyihasini yaratish
1. [vercel.com](https://vercel.com) saytiga kiring.
2. **"Add New..."** $\rightarrow$ **"Project"** tugmasini bosing.
3. `qarzdaftari` repozitoriyasini tanlang va **"Import"** tugmasini bosing.
4. Framework avtomatik ravishda **Next.js** sifatida aniqlanadi.
5. Server hududi `vercel.json` orqali **Frankfurt (fra1)** qilib sozlangan (O'zbekiston uchun eng tezkor ping va minimal kechikish).

---

## 🌐 2. Domen Sozlamalari (debtbook.uz)

`debtbook.uz` domenini ro'yxatdan o'tkazgan provayderingiz (masalan, Eskiz.uz, Arsenal-D, Webname yoki boshqa) DNS boshqaruv paneliga kiring va quyidagi 2 ta yozuvni qo'shing:

| Turi (Type) | Nomi (Host / Name) | Qiymati (Target / Value) | TTL |
| :--- | :--- | :--- | :--- |
| **A Record** | `@` (yoki bo'sh) | `76.76.21.21` | 3600 (yoki Auto) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 3600 (yoki Auto) |

### Vercel Dashboardda Domenni Tasdiqlash:
1. Vercel $\rightarrow$ Loyihangiz $\rightarrow$ **Settings** $\rightarrow$ **Domains** bo'limiga kiring.
2. `debtbook.uz` va `www.debtbook.uz` domenlarini kiriting.
3. DNS yozuvlari ulangach, Vercel avtomatik ravishda **bepul SSL (HTTPS) sertifikatini** faollashtiradi (odatda 5-15 daqiqa oladi).

---

## 🔑 3. Muhit O'zgaruvchilari (Environment Variables)

Vercel Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables** bo'limiga quyidagi kalitlarni kiriting (Production tanlovi bilan):

| Kalit Nomi | Qiymati / Izoh |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://debtbook.uz` |
| `NEXT_PUBLIC_APP_NAME` | `Qarz Daftari` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[SIZNING_LOYIHA].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Kaliti |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Kaliti (xavfsiz backend operatsiyalari uchun) |
| `CRON_SECRET` | Ixtiyoriy maxfiy kalit (Vercel Cron xavfsizligi uchun) |
| `ESKIZ_EMAIL` | `eskiz.uz` hisob emailingiz |
| `ESKIZ_PASSWORD` | `eskiz.uz` parolingiz |
| `ESKIZ_TEST_MODE` | `false` (jonli SMS yuborish uchun) |
| `CLICK_MERCHANT_ID` | Click Merchant ID |
| `CLICK_SERVICE_ID` | Click Xizmat ID (Service ID) |
| `CLICK_SECRET_KEY` | Click Maxfiy Kaliti |
| `CLICK_MERCHANT_USER_ID` | Click Foydalanuvchi ID |
| `PAYME_MERCHANT_ID` | Payme Merchant ID |
| `PAYME_SECRET_KEY` | Payme Production / Test Kaliti |
| `PAYME_TEST_KEY` | Payme Test Kaliti |
| `UZUM_BASE_URL` | `https://api.uzumbank.uz` |
| `UZUM_TERMINAL_ID` | Uzum Bank Terminal ID |
| `UZUM_API_KEY` | Uzum Bank API Kaliti |
| `UZUM_RETURN_BASE_URL` | `https://debtbook.uz` |

---

## 💳 4. To'lov Agregatorlarida Webhook URL'larini O'rnatish

To'lov amalga oshirilganda tizim darhol hisobni yangilashi uchun shaxsiy kabinetlarga quyidagi manzillarni kiriting:

### 1. Click ([merchant.click.uz](https://merchant.click.uz)):
* **Prepare URL**: `https://debtbook.uz/api/payments/click/prepare`
* **Complete URL**: `https://debtbook.uz/api/payments/click/complete`
* **Yagona Webhook URL**: `https://debtbook.uz/api/payments/click/webhook`

### 2. Payme ([business.payme.uz](https://business.payme.uz)):
* **Endpoint URL**: `https://debtbook.uz/api/payments/payme/webhook`

### 3. Uzum Bank ([business.uzumbank.uz](https://business.uzumbank.uz)):
* **Webhook URL**: `https://debtbook.uz/api/payments/uzum/webhook`
* **Return URL**: `https://debtbook.uz/dashboard?payment=success`

---

## 📨 5. Eskiz.uz Real SMS Xizmatini Yoqish

Haqiqiy foydalanuvchilar va qarzdorlarga SMS yetib borishi uchun:
1. [eskiz.uz](https://eskiz.uz) shaxsiy kabinetiga kiring.
2. Hisobingizni (balansni) Click yoki Payme orqali to'ldiring (kamida 20 000 - 50 000 so'm).
3. "SMS xabarnoma" bo'limida tasdiqlangan sender nomini tekshiring (`4546` yoki do'koningiz nomi).
4. Vercel sozlamalarida `ESKIZ_TEST_MODE=false` ekanligiga ishonch hosil qiling.

---

## ⏰ 6. Avtomatlashtirilgan Avtopilot Eslatmalar (Vercel Cron)

Loyihaning `vercel.json` faylida quyidagi cron jadvali kiritilgan:
* **Manzil**: `/api/cron/reminders`
* **Jadval**: `0 4 * * *` (UTC bo'yicha 04:00 $\rightarrow$ **Toshkent vaqti bilan har kuni soat 09:00 da**)
* **Vazifasi**: To'lov muddati tugashiga 3 kun qolgan va muddati o'tgan barcha qarzlarni tekshirib, xaridorni bezovta qilmasdan (24 soatlik anti-spam bilan) avtomatik xushmuomala SMS eslatma yuboradi.

---

## 🧪 7. Ishga Tushgandan So'ng Tekshirish (Smoke Test)

Platforma `https://debtbook.uz` manzilida ishga tushgach, quyidagilarni sinab ko'ring:
1. **Sayt xavfsizligi**: Brauzerda qulf belgisi (HTTPS) yashil/faolligini tekshiring.
2. **Ro'yxatdan o'tish**: Telefon raqam orqali yangi akkaunt oching va OTP SMS yetib borishini tekshiring.
3. **Qarz kiritish va Eksport**: Bitta sinov qarzini kiritib, **Excel (.xlsx)** va **PDF hisobot / Chek** yuklab oling.
4. **PWA o'rnatish**: Telefonda (Chrome yoki Safari) "Ilovani o'rnatish" tugmasi orqali asosiy ekranga o'rnatib ko'ring.
5. **Kassir tizimi**: Profilingizdan yangi kassir biriktirib, boshqa brauzerda kassir sifatida kirib sinang.

---

🎉 **Tabriklaymiz! Qarz Daftari ishlab chiqarishga to'liq tayyor!**
