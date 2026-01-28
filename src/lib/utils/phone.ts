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
  }
  
  return phone;
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