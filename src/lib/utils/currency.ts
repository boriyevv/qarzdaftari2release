// src/lib/utils/currency.ts
export function formatCurrency(
  amount: number | string | null | undefined,
  showDecimals: boolean = false
): string {
  if (amount === null || amount === undefined || amount === '') return '0 so\'m';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0 so\'m';
  
  const formatted = new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
  
  return `${formatted} so'm`;
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M so'm`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K so'm`;
  }
  return formatCurrency(amount);
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}