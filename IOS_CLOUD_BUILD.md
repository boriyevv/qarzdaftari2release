# 🍏 Qarz Daftari — iOS Cloud Build (Mac'siz iOS yig'ish)

Ushbu qo'llanma **macOS kompyuterisiz**, to'g'ridan-to'g'ri Windows orqali bulutdagi bepul Mac serverlarida (GitHub Actions) **iOS (.ipa)** ilovasini yig'ish va iPhone'ga o'rnatish bosqichlarini tushuntiradi.

---

## 🚀 1. Qanday ishga tushiriladi? (1-klikda)

1. Loyihangizdagi o'zgarishlarni GitHub repository'ingizga yuboring (`git push`).
2. Brauzerda o'z **GitHub repository** sahifangizni oching.
3. Yuqoridagi **«Actions»** bo'limiga o'ting.
4. Chap menyudan **«Build iOS (IPA)»** workflow'ini tanlang.
5. O'ng tarafdagi **«Run workflow»** tugmasini bosing:
   - Branch: `main`
   - Build Type: `Release`
   - **«Run workflow»** tugmasini bosing.
6. GitHub bepul **Apple Silicon macOS (Mac)** serverini ishga tushiradi va taxminan **4-6 daqiqa** ichida butun iOS loyihani kompilyatsiya qilib, `.ipa` fayl tayyorlaydi.

---

## 📥 2. Tayyor .IPA faylni yuklab olish

1. Jarayon yashil belgi bilan (✅) tugagach, o'sha run ustiga bosing.
2. Sahifaning eng pastki qismida **«Artifacts»** bo'limi paydo bo'ladi.
3. **`QarzDaftari-iOS-IPA`** faylini kompyuteringizga yuklab oling (bu ichida `QarzDaftari-iOS.ipa` joylashgan arxiv bo'ladi).

---

## 📲 3. .IPA faylni iPhone'ga bepul o'rnatish usullari

Apple Developer akkauntisiz ham o'z iPhone'ingizda ilovani sinash uchun eng ommabop va ishonchli usul:

### Usul A: Sideloadly (Tavsiya etiladi — Windows uchun eng oson)
1. Kompyuteringizga bepul **[Sideloadly](https://sideloadly.io/)** dasturini o'rnating (Windows versiyasi mavjud).
2. iPhone'ingizni kabel orqali kompyuterga ulang.
3. Sideloadly dasturini oching:
   - Yuqoridagi maydonga yuklab olingan `QarzDaftari-iOS.ipa` faylni sudrab tashlang (Drag & Drop).
   - `Apple ID` bandiga o'z shaxsiy Apple ID elektron pochtangizni yozing.
   - **Start** tugmasini bosing.
4. Ilova to'g'ridan-to'g'ri iPhone'ingiz ekraniga o'rnatiladi!
5. **iPhone'da birinchi marta ochishda:**
   - iPhone: `Sozlamalar -> Asosiy -> VPN va Qurilmani boshqarish` bo'limiga kiring.
   - O'z Apple ID'ingizni tanlab, **«Ishonch bildirish» (Trust)** tugmasini bosing.
   - Endi Qarz Daftari iPhone'da to'liq offline/online ishlaydi!

---

### Usul B: App Store va TestFlight (Rasmiy Apple Developer uchun)
Agar sizda rasmiy [Apple Developer](https://developer.apple.com) akkauntingiz ($99/yil) bo'lsa:
1. GitHub Secrets bo'limiga o'z sertifikatingizni kiritasiz.
2. Workflow avtomatik tarzda ilovani to'g'ridan-to'g'ri **TestFlight** va **App Store Connect**ga yuklab beradi.
