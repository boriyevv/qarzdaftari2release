export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return "0 so'm"
  const isNegative = amount < 0
  const absoluteAmount = Math.abs(Math.round(amount))
  const formatted = absoluteAmount
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${isNegative ? '-' : ''}${formatted} so'm`
}

/**
 * Format number as short currency (K, M)
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K'
  }
  return amount.toString()
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ''))
}
