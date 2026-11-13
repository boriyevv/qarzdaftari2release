/**
 * Format currency with spaces between thousands (e.g., "100 000 so'm")
 */
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
 * Format live amount input with thousands spaces (e.g., "100000" -> "100 000")
 */
export function formatAmountInput(value: string | number): string {
  if (value === undefined || value === null) return ''
  const str = value.toString().replace(/\D/g, '')
  if (!str) return ''
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Parses user formatted amount input (e.g. "100 000") into a raw number
 */
export function parseAmountInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (!value) return 0
  const cleaned = value.toString().replace(/[^\d]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

/**
 * Converts a financial amount into official Uzbek words
 * (e.g., 100000 -> "Bir yuz ming so'm", 1500000 -> "Bir million besh yuz ming so'm")
 */
export function numberToUzbekWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return ''
  const ones = ['', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"]
  const tens = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"]

  function convertGroup(n: number): string {
    let result = ''
    const h = Math.floor(n / 100)
    const rem = n % 100
    const t = Math.floor(rem / 10)
    const o = rem % 10

    if (h > 0) {
      result += (h === 1 ? 'bir yuz' : ones[h] + ' yuz') + ' '
    }
    if (t > 0) {
      result += tens[t] + ' '
    }
    if (o > 0) {
      result += ones[o] + ' '
    }
    return result.trim()
  }

  const rounded = Math.round(num)
  if (rounded === 0) return "Nol so'm"

  const billions = Math.floor(rounded / 1_000_000_000)
  const millions = Math.floor((rounded % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((rounded % 1_000_000) / 1_000)
  const remainder = rounded % 1_000

  const parts: string[] = []
  if (billions > 0) parts.push(convertGroup(billions) + ' milliard')
  if (millions > 0) parts.push(convertGroup(millions) + ' million')
  if (thousands > 0) parts.push(convertGroup(thousands) + ' ming')
  if (remainder > 0) parts.push(convertGroup(remainder))

  const words = parts.join(' ').trim()
  if (!words) return ''
  return words.charAt(0).toUpperCase() + words.slice(1) + " so'm"
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
