// src/lib/constants/plans.ts

export const PLAN_TYPES = {
  FREE: 'FREE',
  PLUS: 'PLUS',
  PRO: 'PRO',
} as const

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  SEMI_ANNUAL: 'semi_annual',
  ANNUAL: 'annual',
} as const

export type BillingCycle = typeof BILLING_CYCLES[keyof typeof BILLING_CYCLES]

export interface PlanFeatures {
  max_debts: number // -1 = unlimited
  max_folders: number
  sms_notifications: boolean // Always false - SMS is separate
  telegram_notifications: boolean
  analytics: boolean
  analytics_period: 'monthly' | 'semi_annual' | 'annual' | null
  export: boolean
  api_access?: boolean
  priority_support?: boolean
  trial_days?: number
}

export interface PlanPrice {
  monthly: number
  semi_annual: number // 6 months - 5% discount
  annual: number // 12 months - 10% discount
}

export interface Plan {
  name: string
  displayName: string
  prices: PlanPrice
  features: PlanFeatures
  popular?: boolean
  description: string
}

// Calculate discounted prices
const calculatePrices = (monthlyPrice: number): PlanPrice => {
  return {
    monthly: monthlyPrice,
    semi_annual: Math.round(monthlyPrice * 6 * 0.95), // 5% discount
    annual: Math.round(monthlyPrice * 12 * 0.90), // 10% discount
  }
}

export const PLANS: Record<PlanType, Plan> = {
  FREE: {
    name: 'FREE',
    displayName: 'Free Trial',
    prices: {
      monthly: 0,
      semi_annual: 0,
      annual: 0,
    },
    description: '30 kun bepul sinov - to\'liq funksiyalar!',
    features: {
      max_debts: -1, // Unlimited during trial
      max_folders: -1, // Unlimited during trial
      sms_notifications: false, // SMS alohida sotib olinadi
      telegram_notifications: true,
      analytics: true,
      analytics_period: 'monthly',
      export: true,
      trial_days: 30,
    }
  },
  PLUS: {
    name: 'PLUS',
    displayName: 'Plus',
    prices: calculatePrices(49_900),
    description: 'Kichik biznes uchun',
    popular: true,
    features: {
      max_debts: 500,
      max_folders: 10,
      sms_notifications: false, // SMS alohida sotib olinadi
      telegram_notifications: true,
      analytics: true,
      analytics_period: 'monthly',
      export: true,
    }
  },
  PRO: {
    name: 'PRO',
    displayName: 'Pro',
    prices: calculatePrices(99_900),
    description: 'Professional biznes uchun',
    features: {
      max_debts: -1, // unlimited
      max_folders: -1, // unlimited
      sms_notifications: false, // SMS alohida sotib olinadi
      telegram_notifications: true,
      analytics: true,
      analytics_period: 'annual',
      export: true,
      api_access: true,
      priority_support: true,
    }
  }
}

// SMS Credit Packages
export const SMS_PACKAGES = [
  {
    id: '10-sms',
    name: '10 SMS',
    credits: 10,
    price: 5_000,
    pricePerSMS: 500,
  },
  {
    id: '50-sms',
    name: '50 SMS',
    credits: 50,
    price: 20_000,
    pricePerSMS: 400,
    popular: true,
  },
  {
    id: '100-sms',
    name: '100 SMS',
    credits: 100,
    price: 35_000,
    pricePerSMS: 350,
    savings: '30% tejash',
  },

  {
    id: '500-sms',
    name: '500 SMS',
    credits: 500,
    price: 162_500,
    pricePerSMS: 325,
    savings: '35% tejash',
  },

  {
    id: '1000-sms',
    name: '1000 SMS',
    credits: 500,
    price: 300_000,
    pricePerSMS: 300,
    savings: '40% tejash',
  },

   {
    id: '2000-sms',
    name: '2000 SMS',
    credits: 2000,
    price: 500_000,
    pricePerSMS: 250,
    savings: '50% tejash',
  }
]

// Billing cycle labels
export const BILLING_CYCLE_LABELS = {
  monthly: 'Oylik',
  semi_annual: '6 oylik',
  annual: 'Yillik',
}

// Billing cycle months
export const BILLING_CYCLE_MONTHS = {
  monthly: 1,
  semi_annual: 6,
  annual: 12,
}

// Discount percentages
export const BILLING_CYCLE_DISCOUNTS = {
  monthly: 0,
  semi_annual: 5,
  annual: 10,
}

// Helper functions
export function getPlanPrice(planType: PlanType, billingCycle: BillingCycle): number {
  return PLANS[planType].prices[billingCycle]
}

export function getMonthlyEquivalent(planType: PlanType, billingCycle: BillingCycle): number {
  const totalPrice = getPlanPrice(planType, billingCycle)
  const months = BILLING_CYCLE_MONTHS[billingCycle]
  return Math.round(totalPrice / months)
}

export function getDiscount(planType: PlanType, billingCycle: BillingCycle): {
  amount: number
  percentage: number
} {
  const monthlyPrice = PLANS[planType].prices.monthly
  const months = BILLING_CYCLE_MONTHS[billingCycle]
  const totalWithoutDiscount = monthlyPrice * months
  const actualPrice = getPlanPrice(planType, billingCycle)

  return {
    amount: totalWithoutDiscount - actualPrice,
    percentage: BILLING_CYCLE_DISCOUNTS[billingCycle],
  }
}

export function getPlanLimits(planType: PlanType): PlanFeatures {
  return PLANS[planType].features
}

export function canUserPerformAction(
  planType: PlanType,
  action: keyof PlanFeatures
): boolean {
  const features = PLANS[planType].features
  return features[action] === true
}

export function hasReachedLimit(
  planType: PlanType,
  limitType: 'max_debts' | 'max_folders',
  currentCount: number
): boolean {
  const limit = PLANS[planType].features[limitType]

  if (limit === -1) {
    return false // unlimited
  }

  return currentCount >= limit
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' so\'m'
}

export function formatPricePerMonth(price: number, months: number): string {
  const perMonth = Math.round(price / months)
  return formatPrice(perMonth) + '/oy'
}

// Trial helpers
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30)
  return endDate
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const now = new Date()
  const end = new Date(trialEndsAt)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}