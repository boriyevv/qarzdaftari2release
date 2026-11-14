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

- [x] Do'kon egasi uchun rasmiy `@debtbookuz_bot` va Telegram Mini App (TMA):
  - Rasmiy bot yaratildi (`@debtbookuz_bot`, BotFather tasdiqlandi).
  - Vebhook xizmati (`/api/telegram/webhook`) va secret token xavfsizligi o'rnatildi.
  - Profil (`/profile`) sahifasida 1-klikda chuqur havola (`https://t.me/debtbookuz_bot?start=link_USER_ID`) orqali Telegram chat ID ni avtomatik ulash, test xabari yuborish va ulanishni boshqarish komponenti joriy qilindi.
  - Telegram chat menu button'i rasmiy Mini App (TMA) qilib sozlangan (`setChatMenuButton`), ilova Telegram ichida to'liq ekran (expand) va dark-slate sarlavha bilan ochiladi.
  - Har kuni ertalab 09:00 da (Toshkent vaqti) avtomatik fonda do'kon egasiga kunlik umumiy qarzlar, kechikkan summalar va kutilayotgan to'lovlar hisobotini yuboruvchi avtopilot integratsiya qilindi.
  - Botda interaktiv klaviatura menyusi (`📊 Bugungi hisobot`, `🚀 Qarz Daftari`, `➕ Yangi qarz`, `⚙️ Sozlamalar va Holat`) faollashtirildi.
- [x] Qarzdor mijozlar uchun bepul Telegram eslatmalari:
  - Eskiz SMS xarajatlarini tejash (0 so'm sarf) maqsadida mijozlarga Telegram orqali xushmuomala eslatma va to'g'ridan-to'g'ri onlayn to'lov / hisob-kitob havolasini yuboruvchi mexanizm yaratildi (`formatTelegramDebtReminder`, `getTelegramShareUrl`, `getTelegramDirectPhoneUrl`).
  - Qarzlar ro'yxatida har bir qatorda tezkor «Telegram» tugmasi, mobil kartalarda «TG» tugmasi hamda amallar menyusida «Telegram eslatma (Bepul)» bandi qo'shildi.
  - Eslatma modalida Telegram va SMS kanallari o'rtasida oson o'tish (100% Bepul, cheksiz eslatmalar), matnni 1-klikda nusxalash va to'g'ridan-to'g'ri chat ochish imkoni joriy qilindi.
  - Mijoz profili (`/debtor/[phone]`) sahifasida tezkor «Telegram (Bepul)» eslatma tugmasi va SMS balansi tugaganda bepul Telegramga yo'naltirish integratsiya qilindi.
  - Telegram orqali eslatma yuborilganda ma'lumotlar bazasida `reminder_sent = true` va `last_reminder_at` avtomatik yangilanishi va muvaffaqiyat ovozi yangrashi joriy qilindi.

### 🔒 Mobil Xavfsizlik & Biometrika (Mobile Biometrics)

- [x] Barmoq izi (Fingerprint) va Face ID bilan ilovani qulflash:
  - `@aparajita/capacitor-biometric-auth` rasmiy native plagin o'rnatildi va Capacitor 8 (Android & iOS) loyihalari bilan to'liq sinxronlashtirildi (`npx cap sync`).
  - Android (`USE_BIOMETRIC`, `USE_FINGERPRINT`) va iOS (`NSFaceIDUsageDescription`) tizim ruxsatlari sozlandi.
  - Xavfsiz SHA-256 shifrlangan 4 xonali PIN kod mexanizmi (`hashPin`, `verifyPin`) va WebAuthn fallback joriy qilindi.
  - To'liq ekranli zamonaviy Slate Lock Overlay (`AppLockProvider`) yaratildi: animatsiyali 4 nuqta, 3x4 raqamli klaviatura, Face ID/barmoq izi tugmasi va haptic taktil titrash.
  - Ilova fondan qayta ochilganda yoki ilova ochilganda avtomatik Face ID / barmoq izi so'rovi hamda avto-qulflash intervallari (Darhol, 1 daqiqa, 5 daqiqa) ishlab chiqildi.
  - Profil (`/profile`) sahifasida «Ilova Xavfsizligi va Qulfi» boshqaruv kartasi (`SecurityLockSettings`) va 2 bosqichli PIN kod o'rnatish modali qo'shildi.

### 🛡️ App Store & Google Play Moderatsiya Auditi (Pre-Flight Store Compliance)

- [x] Apple App Store va Google Play uchun Akkauntni o'chirish (Guideline 5.1.1(v)):
  - `/profile` sahifasiga xavfli hudud (Danger Zone) kartasi va «Hisobni o'chirish» modali (`DeleteAccountSection`) qo'shildi.
  - Sabab tanlash, ogohlantirish va tasdiqlash bilan `/api/auth/delete-account` xavfsiz endpointi orqali hisobni faolsizlantirish, seanslarni tozalash va telefon raqamni arxivlash amalga oshirildi.
- [x] Apple va Google moderatorlari uchun maxsus Demo Bypass tizimi:
  - O'zbekiston tashqarisidagi reviewerlar uchun `+998901234567` va statik `123456` OTP kodi joriy qilindi (`otp.service.ts` va `reviewer-demo.service.ts`).
  - Moderator kirishi bilan realistik namunaviy qarzlarga ega «Demo Savdo Do'koni» avtomatik taqdim etiladi.
- [x] iOS Native ilovasida Apple to'lov siyosatiga moslashuv (Guideline 3.1.1):
  - iOS qurilmalarida raqamli obuna va SMS sotishda Apple 30% IAP talabini aylanib o'tish uchun maxsus `IosPaymentDialog` yaratildi. To'lovlar xavfsiz tarzda tashqi Safari veb-portaliga yo'naltirildi.
- [x] Xatoliklar va 404 himoya ekranlari (App Completeness):
  - Kutilmagan uzilishlarda xom xatolar chiqmasligi uchun brendlangan `src/app/error.tsx` va `src/app/not-found.tsx` himoya ekranlari joriy qilindi.
- [x] Production SMS OTP xavfsizligi:
  - `send-otp` endpointi ishlab chiqarish rejimida OTP kodni API javobida fosh qilmaydigan qilib mustahkamlandi.

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
- [x] Tezkor Kiritish & Autocomplete (Input Velocity):
  - Telefon raqami ixtiyoriy qilindi (do'kondor mijoz telefonini bilmaganda ham tezkor qarz yoza oladi).
  - Qarzdor ismini yozishda avtomatik taklif (Autocomplete Dropdown - mavjud qarzdorlar va ularning balansi ko'rinadi).
  - Summa kiritishda tezkor chiplar (+10k, +50k, +100k, +500k, +1 mln) va so'z bilan jonli ifodalash ("bir yuz ellik ming so'm").
- [x] 1-Klikda To'liq To'lov & Swipe Amallari (Touch Ergonomics):
  - Qarzni yopishda «To'liq yopish» tugmasi (bitta bosishda butun qoldiq summani kiritadi).
  - Mobil kartalarda sensorli Swipe (o'ngga surish: "+ To'lov", chapga surish: "Telegram eslatma") hamda taktil haptic tebranish.
- [x] Offline-First Kiritish & Avto-Sinxronizatsiya:
  - Internet uzilganda ham do'kondor yangi qarzlarni to'xtovsiz kiritishi uchun mahalliy navbat (`offline-debts.service.ts`).
  - Tarmoq qayta ulanganda fonda avtomatik sinxronlanishi va sarlavhadagi jonli tarmoq ko'rsatkichi.

---

_Eslatma: Har qanday yangi g'oyani ushbu faylga qo'shib borishingiz mumkin. Antigravity bilan ishlashda unga "ROADMAP.md faylidagi keyingi vazifani qilaylik" deb buyruq berishingiz mumkin!_

## MY NOTES

- [x] **(1) Check the navigation from dashboard to others**: Yagona `AppShell` tizimi yaratildi, layout sakrashlari bartaraf etildi, breadcrumbs va barqaror navigatsiya barcha sahifalarga bog'landi. ----- (4)
- [x] **(2) Work on other payment provider, such as Payme and Click**: Payme Subscribe API (`cards.create`, `cards.verify`, `receipts.create`, `receipts.pay`) va On-site `PaymeOnSiteModal` ishlab chiqildi. Payme webhookidagi muhim xatolik (`createAdminClient`, `PerformTransaction` account/order resolution) bartaraf etildi. Click Shop API va On-site Card/Invoice tizimi to'liq testlandi va yagona sinov skripti (`npm run test:payments`) yaratildi. ----- (2)
- [x] **(3) AGAIN the UI design still kinda lacks**: Dashboard va Qarzlar ro'yxati (DebtsListDraggable) tubdan zamonaviy CRM uslubida qayta yaratildi: jonli qidiruv, 4 ta status filtri chiplari (Barchasi, Qarzdorlar, Muddati o'tgan, To'langan), saralash, bosh harfli gradient avatarlar, to'lov progress-bari, aqlli muddat nishonlari (pulsatsiyali kechikish ko'rsatkichi) va to'g'ridan-to'g'ri qatorda ko'rinadigan "+ To'lov", "SMS", "Qo'ng'iroq" tezkor tugmalari qo'shildi. Shimmer skeleton yuklanish holatlari integratsiya qilindi. ----- (3)
- [x] **(4) Work immediately on sidebar on all the routes**: Barcha marshrutlarda (`/dashboard`, `/analytics`, `/sms-credits`, `/pricing`, `/profile`, `/debtor/[phone]`) zamonaviy Collapsible Sidebar va mobil Drawer integratsiya qilindi. Dashboarddagi 288px'lik og'ir ikkinchi sidebar zamonaviy gorizontal `FolderFilterBar` chiplari bilan almashtirildi. ----- (1)
