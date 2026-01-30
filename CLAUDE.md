# CLAUDE.md - Qarz Daftari AI Development Guide

## Project Overview

**Qarz Daftari** - bu O'zbekistondagi kichik va o'rta bizneslar uchun mo'ljallangan professional qarzlarni boshqarish platformasi. Loyiha oddiy qarz daftaridan ishonch va risk boshqaruv tizimiga rivojlantirilmoqda.

### Current MVP Features
- Qarz qo'shish / tahrirlash / yopish
- Qarzdorlar (mijozlar) ro'yxati
- SMS notifikatsiyalar (Eskiz.uz orqali)
- In-app notifikatsiyalar
- Folderlar (mijozlarni guruhlash)
- Login / Register / Authentication (Email + Phone)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Custom Phone Auth |
| Styling | Tailwind CSS + Radix UI |
| State | React Context + Zustand |
| Forms | React Hook Form + Zod |
| SMS | Eskiz.uz API |
| Deployment | Vercel |
| PWA | next-pwa |

### Key Dependencies
```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.93.2",
  "next": "14.2.35",
  "react-hook-form": "^7.71.1",
  "zod": "^4.3.6",
  "zustand": "^5.0.10",
  "@dnd-kit/core": "^6.3.1",
  "lucide-react": "^0.563.0",
  "date-fns": "^4.1.0"
}
```

---

## Project Structure

```
qarzdaftari2release/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── send-otp/route.ts
│   │   │   │   ├── verify-otp/route.ts
│   │   │   │   └── forgot-password/route.ts
│   │   │   ├── debts/              # Debts CRUD
│   │   │   │   ├── route.ts        # GET (list), POST (create)
│   │   │   │   └── [id]/route.ts   # GET, PATCH, DELETE
│   │   │   ├── folders/            # Folders CRUD
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── payments/route.ts   # Payments
│   │   ├── dashboard/page.tsx      # Main dashboard
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── layout.tsx              # Root layout with UserProvider
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Radix-based UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   └── otp-input.tsx
│   │   ├── dashboard/
│   │   │   └── dashboard-stats.tsx
│   │   ├── debts/
│   │   │   ├── add-debt-modal.tsx
│   │   │   ├── edit-debt-modal.tsx
│   │   │   ├── add-payment-modal.tsx
│   │   │   └── debts-list-draggable.tsx
│   │   └── folders/
│   │       └── folders-sidebar-responsive.tsx
│   └── lib/
│       ├── constants/
│       │   ├── plans.ts            # Tarif rejalari (free, plus, pro)
│       │   └── statuses.ts         # Qarz statuslari
│       ├── contexts/
│       │   └── user-context.tsx    # User state management
│       ├── services/
│       │   ├── sms.service.ts      # Eskiz.uz SMS integration
│       │   └── otp.service.ts      # OTP management
│       ├── supabase/
│       │   ├── client.ts           # Browser Supabase client
│       │   ├── server.ts           # Server Supabase client
│       │   └── middleware.ts       # Auth middleware
│       ├── types/
│       │   └── database.types.ts   # TypeScript types for DB
│       ├── utils/
│       │   ├── date.ts
│       │   ├── currency.ts
│       │   ├── phone.ts
│       │   └── helpers.ts
│       ├── hooks/
│       │   └── use-toast.ts
│       └── utills.ts               # cn() utility
├── public/
│   ├── manifest.json               # PWA manifest
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Database Schema

### Tables Overview

#### `users`
```typescript
{
  id: string                        // UUID (primary key)
  created_at: string
  updated_at: string
  full_name: string
  phone: string                     // +998XXXXXXXXX format
  email: string | null
  username: string
  store_name: string
  plan_type: 'free' | 'plus' | 'pro'
  plan_expires_at: string | null
  is_active: boolean
  is_admin: boolean
  phone_verified: boolean
  sms_enabled: boolean
  push_enabled: boolean
  language: string
  locale_settings: Json
  auth_id: string | null            // Supabase Auth user ID (null for phone-only users)
  deletion_requested_at: string | null
  deletion_reason: string | null
}
```

#### `folders`
```typescript
{
  id: string
  created_at: string
  updated_at: string
  user_id: string                   // FK -> users.id
  name: string
  order_index: number
  is_default: boolean
  color: string                     // Hex color
  icon: string
  version: number
}
```

#### `debts`
```typescript
{
  id: string
  created_at: string
  updated_at: string
  user_id: string                   // FK -> users.id
  folder_id: string | null          // FK -> folders.id
  debtor_name: string
  debtor_phone: string              // +998XXXXXXXXX format
  amount: number
  paid_amount: number
  remaining_amount?: number         // Computed field
  debt_date: string
  due_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'blacklisted' | 'deleted'
  note: string | null
  order_index: number
  reminder_sent: boolean
  last_reminder_at: string | null
  deleted_at: string | null         // Soft delete
  version: number
}
```

#### `payments`
```typescript
{
  id: string
  created_at: string
  debt_id: string                   // FK -> debts.id
  amount: number
  payment_date: string
  note: string | null
}
```

#### `sms_credits`
```typescript
{
  id: string
  created_at: string
  updated_at: string
  user_id: string                   // FK -> users.id
  balance: number
  total_purchased: number
  total_used: number
}
```

---

## API Routes

### Authentication (`/api/auth/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Email/Password login |
| `/register` | POST | Email or Phone registration |
| `/logout` | POST | Session logout |
| `/me` | GET | Get current user profile |
| `/send-otp` | POST | Send OTP to phone |
| `/verify-otp` | POST | Verify OTP code |
| `/forgot-password` | POST | Password reset request |

### Debts (`/api/debts/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/debts` | GET | List debts (with filters: folder_id, status, search) |
| `/debts` | POST | Create new debt |
| `/debts/[id]` | GET | Get single debt with payments |
| `/debts/[id]` | PATCH | Update debt |
| `/debts/[id]` | DELETE | Soft delete debt |

### Folders (`/api/folders/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/folders` | GET | List folders with debt counts |
| `/folders` | POST | Create new folder |
| `/folders/[id]` | PATCH | Update folder |
| `/folders/[id]` | DELETE | Delete folder |

### Payments (`/api/payments/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments` | POST | Add payment to debt |

---

## Authentication Architecture

### Dual Auth System
The app supports two authentication methods:

1. **Email Auth** (Supabase Auth)
   - Uses Supabase's built-in auth
   - `auth_id` field links to Supabase user
   - Password stored in Supabase

2. **Phone Auth** (Custom)
   - OTP verification via Eskiz.uz SMS
   - No Supabase Auth user created
   - `auth_id` is NULL
   - Session managed separately

### Auth Flow
```
Email Registration:
1. Validate input with Zod
2. Create Supabase Auth user
3. Create profile in `users` table (auth_id = supabase user id)
4. Create default folder
5. Create SMS credits record

Phone Registration:
1. Send OTP to phone
2. Verify OTP
3. Create profile in `users` table (auth_id = NULL)
4. Create default folder
5. Create SMS credits record
6. Send welcome SMS
```

---

## Plan System

### Plan Types
```typescript
const PLAN_LIMITS = {
  free: {
    max_debts: 50,
    max_folders: 2,
    max_history_days: 30,
    features: { export: false, sms: false, push: true }
  },
  plus: {
    max_debts: 500,
    max_folders: 10,
    max_history_days: null, // unlimited
    features: { export: true, sms: true, push: true, analytics_advanced: true }
  },
  pro: {
    max_debts: null, // unlimited
    max_folders: null,
    max_history_days: null,
    features: { ...all_features, multi_user: true, api_access: true }
  }
}
```

### Plan Prices (UZS)
- Free: 0
- Plus: 49,900
- Pro: 99,900

---

## Development Conventions

### Code Style

1. **API Routes**
   - Always use `export const dynamic = 'force-dynamic'`
   - Always use `export const runtime = 'nodejs'`
   - Use Zod for input validation
   - Return consistent error format: `{ error: 'message' }`
   - Return data format: `{ debt: {...} }` or `{ debts: [...] }`

2. **Components**
   - Use `'use client'` directive for client components
   - Follow Radix UI patterns for dialogs, selects, etc.
   - Use Tailwind CSS for styling
   - Mobile-first responsive design

3. **TypeScript**
   - Types are defined in `src/lib/types/database.types.ts`
   - Use strict typing for all functions
   - Import types from centralized location

4. **Phone Format**
   - Always use `+998XXXXXXXXX` format
   - Validate with regex: `/^\+998\d{9}$/`

5. **Language**
   - UI is in Uzbek (uz)
   - Error messages in Uzbek
   - Code comments in English

### Naming Conventions

```typescript
// Files: kebab-case
add-debt-modal.tsx
user-context.tsx

// Components: PascalCase
export function AddDebtModal() {}

// Functions: camelCase
const fetchDebts = async () => {}

// Constants: SCREAMING_SNAKE_CASE
const PLAN_LIMITS = {}
const DEBT_STATUSES = {}

// Database fields: snake_case
debtor_name, paid_amount, due_date
```

---

## SMS Service (Eskiz.uz)

### Configuration
```env
ESKIZ_EMAIL=your-email
ESKIZ_PASSWORD=your-password
ESKIZ_TEST_MODE=true  # For testing
```

### Available Methods
```typescript
smsService.sendOTP(phone, code)         // OTP code
smsService.sendWelcome(phone, name)     // Welcome message
smsService.sendPaymentReminder(...)     // Payment reminder
smsService.sendPaymentConfirmation(...) // Payment confirmation
smsService.getBalance()                 // Check SMS balance
```

---

## Future Roadmap

### BOSQICH 1 - Qarz Intizomi (Small Update)
**Maqsad:** Qarz o'z vaqtida qaytarildimi yoki kechikdimi - avtomatik aniqlash

**Talablar:**
- Har bir qarzda: berilgan sana, qaytarilishi kerak bo'lgan sana, real qaytarilgan sana
- Tizim avtomatik aniqlasin: vaqtida qaytarilgan / kechikib qaytarilgan / hali ochiq
- Kechikkan kunlar soni hisoblanadi

**Database Changes:**
```sql
-- debts jadvaliga qo'shimcha fieldlar
ALTER TABLE debts ADD COLUMN closed_at TIMESTAMP;  -- real qaytarilgan sana
ALTER TABLE debts ADD COLUMN delay_days INTEGER DEFAULT 0;  -- kechikkan kunlar
ALTER TABLE debts ADD COLUMN payment_status VARCHAR(20);  -- 'on_time', 'late', 'open'
```

### BOSQICH 2 - Mijoz Profili Statistikasi (Small Update)
**Maqsad:** Har bir mijoz bo'yicha umumiy ko'rsatkichlar

**Ko'rsatkichlar:**
- Jami olingan qarz
- Jami qaytarilgan summa
- Hozirgi qarz
- Jami qarzlar soni
- Oxirgi qarz sanasi
- Oylik summary (berilgan, qaytarilgan, kutilayotgan)

### BOSQICH 3 - Ichki Ishonch Balli
**Maqsad:** Kelajakda reyting va AI uchun tayyorgarlik (UI da ko'rinmaydi)

**Formula Asoslari:**
- Qaytarish tezligi
- Kechikishlar soni
- Qarz miqdori

### BOSQICH 4 - Mijoz Reytingi (Major Update)
**Maqsad:** Biznes egasiga tez qaror qabul qilish imkoni

- 1-5 yulduzli reyting
- Ichki ball asosida hisoblanadi

### BOSQICH 5 - Risk Belgisi
**Belgilar:**
- Ishonchli (yashil)
- Kuzatuvda (sariq)
- Xavfli (qizil)

### BOSQICH 6 - Tariflar (Monetizatsiya)
- Free: qarzlar
- Pro: reyting, history
- Business: analytics, eksport

### BOSQICH 7 - AI Tavsiya (Keyingi bosqich)
- AI qaror chiqarmaydi, faqat tavsiya beradi

---

## Important Rules for AI Assistants

### DO's
1. **Har bosqichni alohida qil** - Barcha feature'larni birdan qo'shma
2. **Minimal yechim ber** - "Ideal" emas, "ishlaydigan" variant
3. **O'zbekcha matn** - UI/Error messages O'zbekchada bo'lsin
4. **Mavjud patternlarga amal qil** - Zod validation, API response format
5. **Mobile-first** - Responsive design
6. **Soft delete** - Ma'lumotlarni o'chirish o'rniga `deleted_at` ishlatish
7. **Typing** - Strict TypeScript types

### DON'Ts
1. **Murakkab AI ishlatma** - Hozircha oddiy formula yetarli
2. **Global reyting qo'shma** - Faqat bitta biznes ichida
3. **Qonuniy xavfli funksiya** - Axloqiy chegaralarni buzmasin
4. **Mavjud strukturani buzma** - Folder/file structure'ni saqlash
5. **Hardcoded values** - Constants fayllaridan foydalanish

### Security
- SQL injection prevention (Supabase parameterized queries)
- Input validation (Zod schemas)
- Auth check on all API routes
- Ownership verification before CRUD operations
- Soft delete for data recovery

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# SMS (Eskiz.uz)
ESKIZ_EMAIL=your-email
ESKIZ_PASSWORD=your-password
ESKIZ_TEST_MODE=true

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm run start

# Lint
npm run lint
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Database Types | `src/lib/types/database.types.ts` |
| Plan Constants | `src/lib/constants/plans.ts` |
| Status Constants | `src/lib/constants/statuses.ts` |
| User Context | `src/lib/contexts/user-context.tsx` |
| SMS Service | `src/lib/services/sms.service.ts` |
| Supabase Server | `src/lib/supabase/server.ts` |
| Supabase Client | `src/lib/supabase/client.ts` |
| Main Dashboard | `src/app/dashboard/page.tsx` |

---

## Contact & Support

- Language: O'zbek (uz)
- Timezone: Asia/Tashkent (UTC+5)
- Currency: UZS (O'zbek so'mi)
- Phone format: +998XXXXXXXXX

---

*Last updated: January 2026*
