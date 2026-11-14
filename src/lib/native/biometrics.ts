// src/lib/native/biometrics.ts
// Native Biometric & PIN Security Service for Qarz Daftari

import { Capacitor } from '@capacitor/core'
import { BiometricAuth, getBiometryName } from '@aparajita/capacitor-biometric-auth'
import { nativeHaptics } from './index'

export interface BiometricStatus {
  isAvailable: boolean
  biometryName: string
  hasEnrolled: boolean
  strongBiometryIsAvailable: boolean
}

const PIN_STORAGE_KEY = 'qd_security_pin_hash'
const LOCK_ENABLED_KEY = 'qd_security_lock_enabled'
const BIOMETRIC_ENABLED_KEY = 'qd_security_bio_enabled'
const TIMEOUT_KEY = 'qd_security_timeout' // in seconds: 0, 60, 300
const LAST_ACTIVE_KEY = 'qd_security_last_active'

/**
 * Hash a 4-digit PIN with SHA-256 and app-level salt
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = 'qd_secure_pin_salt_v1_2026'
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if the device has hardware biometrics (Face ID, Fingerprint) available
 */
export async function checkBiometrics(): Promise<BiometricStatus> {
  if (typeof window === 'undefined') {
    return {
      isAvailable: false,
      biometryName: 'Biometrika',
      hasEnrolled: false,
      strongBiometryIsAvailable: false,
    }
  }

  // If on native platform with Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await BiometricAuth.checkBiometry()
      const name = getBiometryName(info.biometryType) || 'Biometrika'
      return {
        isAvailable: info.isAvailable,
        biometryName: name,
        hasEnrolled: info.isAvailable,
        strongBiometryIsAvailable: info.strongBiometryIsAvailable,
      }
    } catch (err) {
      console.warn('[Biometrics] checkBiometry error:', err)
    }
  }

  // Web / PWA fallback: Check WebAuthn PublicKeyCredential if available
  if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (available) {
        return {
          isAvailable: true,
          biometryName: 'Biometrik Tekshiruv (WebAuthn)',
          hasEnrolled: true,
          strongBiometryIsAvailable: true,
        }
      }
    } catch {}
  }

  return {
    isAvailable: false,
    biometryName: 'Biometrika',
    hasEnrolled: false,
    strongBiometryIsAvailable: false,
  }
}

/**
 * Trigger native Face ID / Fingerprint authentication prompt
 */
export async function authenticateBiometrics(reason: string = 'Qarz Daftari ilovasini ochish'): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false }

  if (Capacitor.isNativePlatform()) {
    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'PIN kod kiritish',
        allowDeviceCredential: false,
      })
      await nativeHaptics.notification('success')
      return { success: true }
    } catch (err: any) {
      console.warn('[Biometrics] Auth failed or cancelled:', err)
      return { success: false, error: err?.message || 'Biometrik tekshiruv bekor qilindi' }
    }
  }

  return { success: false, error: 'Qurilmada biometrika mavjud emas' }
}

/**
 * Storage helpers for PIN and Security Preferences
 */
export const securityStorage = {
  isLockEnabled: (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LOCK_ENABLED_KEY) === 'true' && Boolean(localStorage.getItem(PIN_STORAGE_KEY))
  },

  setLockEnabled: (enabled: boolean) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOCK_ENABLED_KEY, enabled ? 'true' : 'false')
  },

  hasPin: (): boolean => {
    if (typeof window === 'undefined') return false
    return Boolean(localStorage.getItem(PIN_STORAGE_KEY))
  },

  savePin: async (pin: string) => {
    if (typeof window === 'undefined') return
    const hashed = await hashPin(pin)
    localStorage.setItem(PIN_STORAGE_KEY, hashed)
    localStorage.setItem(LOCK_ENABLED_KEY, 'true')
  },

  removePin: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(PIN_STORAGE_KEY)
    localStorage.removeItem(LOCK_ENABLED_KEY)
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
  },

  verifyPin: async (enteredPin: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY)
    if (!storedHash) return false
    const enteredHash = await hashPin(enteredPin)
    return enteredHash === storedHash
  },

  isBiometricsEnabled: (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
  },

  setBiometricsEnabled: (enabled: boolean) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false')
  },

  getTimeout: (): number => {
    if (typeof window === 'undefined') return 0
    const raw = localStorage.getItem(TIMEOUT_KEY)
    return raw !== null ? parseInt(raw, 10) : 0 // Default: 0 seconds (Immediate)
  },

  setTimeout: (seconds: number) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TIMEOUT_KEY, seconds.toString())
  },

  recordActiveTime: () => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString())
  },

  getLastActiveTime: (): number => {
    if (typeof window === 'undefined') return 0
    const raw = sessionStorage.getItem(LAST_ACTIVE_KEY)
    return raw ? parseInt(raw, 10) : 0
  },
}
