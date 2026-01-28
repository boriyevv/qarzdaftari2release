// src/lib/utils/date.ts
import { format, formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'dd.MM.yyyy'
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return format(dateObj, formatStr, { locale: uz });
  } catch (error) {
    console.error('Date format error:', error);
    return '-';
  }
}

export function formatRelativeTime(date: Date | string): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: uz
    });
  } catch (error) {
    return '-';
  }
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd.MM.yyyy, HH:mm');
}

export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}