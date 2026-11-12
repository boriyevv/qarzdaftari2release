# 📱 Qarz Daftari — Mobile Apps (Android & iOS) Guide

Ushbu qo'llanma **Qarz Daftari** platformasini Android va iOS native ilovalar sifatida ishga tushirish, sinovdan o'tkazish va App Store hamda Google Play Store'ga chiqarish bosqichlarini o'z ichiga oladi.

---

## 🛠️ O'rnatilgan Texnologiyalar & Native Plaginlar

- **Framework**: Capacitor 8 (Next.js 14 Hybrid Native Shell)
- **App ID**: `uz.debtbook.app`
- **Ilova nomi**: `Qarz Daftari`
- **Native Plaginlar**:
  - `@capacitor/status-bar`: Tizim mavzusiga (Dark/Light) qarab status-bar rangini moslash (`#0f172a` va `#ffffff`).
  - `@capacitor/haptics`: Tugmalar, muvaffaqiyatli to'lov va qarz kiritishda yoqimli taktil titrash (vibratsiya).
  - `@capacitor/keyboard`: Inputlarga fokus qilinganda mobil klaviaturaning silliq chiqishi va layout sakramasligi.
  - `@capacitor/app`: Android apparat (hardware) "Orqaga" tugmasini boshqarish.
  - `@capacitor-community/contacts`: Yangi qarz kiritishda qarzdorni to'g'ridan-to'g'ri telefon kontaktlaridan 1 ta bosishda tanlash.

---

## 🚀 Tezkor Buyruqlar (NPM Scripts)

Ilovalarni sinash va loyihalarni ochish:

```bash
# Barcha o'zgarishlar va native plaginlarni sinxronizatsiya qilish:
npm run cap:sync

# Android Studio'da ochish:
npm run cap:open:android

# macOS'da Xcode'da ochish:
npm run cap:open:ios
```

---

## 🤖 1. Android Ilovasini Ishga Tushirish (Android Studio)

### A) Talablar:
- [Android Studio](https://developer.android.com/studio) o'rnatilgan bo'lishi kerak.
- Android SDK (API 34/35) va Java JDK 17/21.

### B) Emulator yoki Haqiqiy Telefonda Sinash:
1. Terminalda quyidagi buyruqni bering:
   ```bash
   npm run cap:open:android
   ```
2. Android Studio ochiladi va Gradle loyihani sinxronizatsiya qiladi.
3. Yuqori paneldagi **Run ▶** (Yashil uchburchak) tugmasini bosing.
4. Ilova ulangan haqiqiy Android telefonda yoki emulatorda ochiladi.

### C) Sinov APK (Debug APK) Yaratish:
Android Studio'ni ochmasdan to'g'ridan-to'g'ri terminal orqali APK yig'ish (Windows):
```powershell
cd android
.\gradlew.bat assembleDebug
```
Yaratilgan APK manzili:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🍏 2. iOS Ilovasini Ishga Tushirish (Xcode)

### A) Talablar:
- macOS operatsion tizimi va [Xcode](https://developer.apple.com/xcode/) o'rnatilgan bo'lishi kerak.
- CocoaPods (`sudo gem install cocoapods`) yoki Swift Package Manager.

### B) Ishga Tushirish:
1. Loyihani macOS'ga ko'chiring yoki Mac kompyuteringizda oching.
2. Terminalda:
   ```bash
   npm run cap:sync
   npm run cap:open:ios
   ```
3. Xcode ochilgach, simulyatorni (masalan, iPhone 16 Pro) tanlab **Cmd + R** bosing.

---

## 🌐 3. Mahalliy Tarmoqda (Local IP) Sinovdan O'tkazish

Hozirda ilova production manziliga (`https://debtbook.uz`) sozlangan.
Agar o'z kompyuteringizdagi local Next.js serverini (`npm run dev`) telefonda sinamoqchi bo'lsangiz:

1. Kompyuteringizning Wi-Fi IP manzilini bilib oling (masalan: `192.168.1.105`).
2. Terminalda server manzilini ko'rsatib ishga tushiring:
   ```bash
   $env:CAPACITOR_LIVE_URL="http://192.168.1.105:3000"
   npm run cap:sync
   ```
3. Telefonda local serveringiz jonli ochiladi va barcha kod o'zgarishlari darhol aks etadi (Hot Reloading).

---

## 📦 4. Google Play Store va App Store'ga Chiqarish (Production Release)

### Google Play:
1. Android Studio menyusidan: **Build -> Generate Signed Bundle / APK**.
2. **Android App Bundle (.aab)** tanlang.
3. Keystore kalit yarating va imzolang.
4. Google Play Console orqali `.aab` faylni yuklang.

### Apple App Store:
1. Xcode menyusidan: **Product -> Archive**.
2. **Distribute App -> App Store Connect**.
3. App Store Connect orqali TestFlight yoki Store moderatsiyasiga yuboring.
