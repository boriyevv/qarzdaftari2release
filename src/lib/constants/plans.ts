// src/lib/constants/plans.ts
// Tarif rejalari konstantalari

export const PLAN_TYPES = {
  FREE: 'free',
  PLUS: 'plus',
  PRO: 'pro',
} as const;

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES];

export const PLAN_LIMITS = {
  [PLAN_TYPES.FREE]: {
    max_debts: 50,
    max_folders: 2,
    max_history_days: 30,
    features: {
      export: false,
      sms: false,
      push: true,
      analytics_basic: true,
      analytics_advanced: false,
    },
  },
  [PLAN_TYPES.PLUS]: {
    max_debts: 500,
    max_folders: 10,
    max_history_days: null, // cheksiz
    features: {
      export: true,
      sms: true,
      push: true,
      analytics_basic: true,
      analytics_advanced: true,
      email_support: true,
    },
  },
  [PLAN_TYPES.PRO]: {
    max_debts: null, // cheksiz
    max_folders: null, // cheksiz
    max_history_days: null,
    features: {
      export: true,
      sms: true,
      push: true,
      analytics_basic: true,
      analytics_advanced: true,
      analytics_premium: true,
      multi_user: true,
      priority_support: true,
      api_access: true,
    },
  },
};

export const PLAN_PRICES = {
  [PLAN_TYPES.FREE]: 0,
  [PLAN_TYPES.PLUS]: 49_900,
  [PLAN_TYPES.PRO]: 99_900,
};

export const PLAN_NAMES = {
  [PLAN_TYPES.FREE]: 'Free',
  [PLAN_TYPES.PLUS]: 'Plus',
  [PLAN_TYPES.PRO]: 'Pro',
};

export const PLAN_DESCRIPTIONS = {
  [PLAN_TYPES.FREE]: 'Boshlang\'ich foydalanuvchilar uchun',
  [PLAN_TYPES.PLUS]: 'Kichik biznes uchun',
  [PLAN_TYPES.PRO]: 'Professional foydalanuvchilar uchun',
};