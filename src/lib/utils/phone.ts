// src/lib/utils/phone.ts
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    const code = cleaned.slice(0, 3);
    const operator = cleaned.slice(3, 5);
    const part1 = cleaned.slice(5, 8);
    const part2 = cleaned.slice(8, 10);
    const part3 = cleaned.slice(10, 12);
    
    return `+${code} (${operator}) ${part1}-${part2}-${part3}`;
  } else if (cleaned.length === 9) {
    const operator = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, 5);
    const part2 = cleaned.slice(5, 7);
    const part3 = cleaned.slice(7, 9);
    return `+998 (${operator}) ${part1}-${part2}-${part3}`;
  }
  
  return phone;
}

/**
 * Formats a 9-digit local phone input as "(90) 123-45-67" live as the user types
 */
export function formatPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 5) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
}

/**
 * Formats a full international phone input as "+998 (90) 123-45-67" live
 */
export function formatFullPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '+998 ';
  
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('8') && digits.length === 10) {
    digits = digits.slice(1);
  }
  
  digits = digits.slice(0, 9);
  
  if (!digits) return '+998 ';
  if (digits.length <= 2) return `+998 (${digits}`;
  if (digits.length <= 5) return `+998 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('998')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.length === 9) {
    cleaned = '+998' + cleaned;
  }
  
  return cleaned;
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^998\d{9}$/.test(cleaned);
}

export function getPhoneOperator(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 5) return 'Noma\'lum';
  
  const code = cleaned.slice(3, 5);
  
  const operators: Record<string, string> = {
    '90': 'Beeline',
    '91': 'Beeline',
    '93': 'Ucell',
    '94': 'Ucell',
    '95': 'UzMobile',
    '97': 'UzMobile',
    '98': 'Ucell',
    '99': 'Beeline',
    '88': 'Mobiuz',
    '33': 'Humans',
  };
  
  return operators[code] || 'Noma\'lum';
}