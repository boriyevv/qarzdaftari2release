// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export all utilities
export * from './utils/date'
export * from './utils/currency'
export * from './utils/phone'
export * from './utils/helpers'