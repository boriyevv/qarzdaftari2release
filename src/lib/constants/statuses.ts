// src/lib/constants/statuses.ts
// Qarz statuslari

export const DEBT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  BLACKLISTED: 'blacklisted',
  DELETED: 'deleted',
} as const;

export type DebtStatus = typeof DEBT_STATUSES[keyof typeof DEBT_STATUSES];

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  [DEBT_STATUSES.PENDING]: 'Kutilmoqda',
  [DEBT_STATUSES.PAID]: 'To\'langan',
  [DEBT_STATUSES.OVERDUE]: 'Muddati o\'tgan',
  [DEBT_STATUSES.BLACKLISTED]: 'Qora ro\'yhat',
  [DEBT_STATUSES.DELETED]: 'O\'chirilgan',
};

export const DEBT_STATUS_COLORS: Record<DebtStatus, string> = {
  [DEBT_STATUSES.PENDING]: 'blue',
  [DEBT_STATUSES.PAID]: 'green',
  [DEBT_STATUSES.OVERDUE]: 'red',
  [DEBT_STATUSES.BLACKLISTED]: 'purple',
  [DEBT_STATUSES.DELETED]: 'gray',
};

export const DEBT_STATUS_BADGES: Record<DebtStatus, string> = {
  [DEBT_STATUSES.PENDING]: 'bg-blue-100 text-blue-800',
  [DEBT_STATUSES.PAID]: 'bg-green-100 text-green-800',
  [DEBT_STATUSES.OVERDUE]: 'bg-red-100 text-red-800',
  [DEBT_STATUSES.BLACKLISTED]: 'bg-purple-100 text-purple-800',
  [DEBT_STATUSES.DELETED]: 'bg-gray-100 text-gray-800',
};