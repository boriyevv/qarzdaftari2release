// src/lib/native/index.ts
'use client'

import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { Contacts } from '@capacitor-community/contacts'

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  return Capacitor.isNativePlatform()
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const p = Capacitor.getPlatform()
  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  return 'web'
}

/**
 * Native Haptic Feedback with graceful web fallback
 */
export const nativeHaptics = {
  impact: async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window === 'undefined') return
    try {
      if (Capacitor.isNativePlatform()) {
        const map = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        }
        await Haptics.impact({ style: map[style] })
      } else if ('vibrate' in navigator) {
        const durations = { light: 15, medium: 30, heavy: 50 }
        navigator.vibrate(durations[style])
      }
    } catch {
      // Ignore vibration errors on unsupported environments
    }
  },

  notification: async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (typeof window === 'undefined') return
    try {
      if (Capacitor.isNativePlatform()) {
        const map = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        }
        await Haptics.notification({ type: map[type] })
      } else if ('vibrate' in navigator) {
        const patterns = {
          success: [20, 50, 30],
          warning: [40, 40, 40],
          error: [50, 50, 50, 50, 50],
        }
        navigator.vibrate(patterns[type])
      }
    } catch {
      // Ignore
    }
  },

  selection: async () => {
    if (typeof window === 'undefined') return
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.selectionChanged()
      } else if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } catch {
      // Ignore
    }
  },
}

/**
 * Native Status Bar management (syncs with Theme)
 */
export const nativeStatusBar = {
  syncWithTheme: async (isDark: boolean) => {
    if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return
    try {
      // Set background color first
      await StatusBar.setBackgroundColor({
        color: isDark ? '#0f172a' : '#ffffff',
      })
      // In Capacitor:
      // Style.Dark = Light text/icons for dark backgrounds (#0f172a)
      // Style.Light = Dark text/icons for light backgrounds (#ffffff)
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      })
    } catch (e) {
      console.warn('StatusBar sync error:', e)
    }
  },
}

/**
 * Normalized contact interface
 */
export interface PickedContact {
  name: string
  phone: string
}

/**
 * Native Contact Picker for fast debtor entry
 */
export const nativeContacts = {
  isSupported: (): boolean => {
    if (typeof window === 'undefined') return false
    if (Capacitor.isNativePlatform()) return true
    // Also check standard Web Contact Picker API (Chrome Android)
    return 'contacts' in navigator && 'ContactsManager' in window
  },

  pick: async (): Promise<PickedContact | null> => {
    if (typeof window === 'undefined') return null

    // 1. Capacitor Native platform (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Contacts.checkPermissions()
        if (status.contacts !== 'granted') {
          const perm = await Contacts.requestPermissions()
          if (perm.contacts !== 'granted' && perm.contacts !== 'limited') {
            return null
          }
        }

        const res = await Contacts.pickContact({
          projection: {
            name: true,
            phones: true,
          },
        })

        if (!res || !res.contact) return null

        const rawName =
          res.contact.name?.display ||
          [res.contact.name?.given, res.contact.name?.family].filter(Boolean).join(' ') ||
          'Noma\'lum'

        const rawPhone = res.contact.phones?.[0]?.number || ''
        const cleanPhone = cleanPhoneNumber(rawPhone)

        return {
          name: rawName.trim(),
          phone: cleanPhone,
        }
      } catch (err: unknown) {
        // User cancelled or closed picker
        console.warn('Native contact pick cancelled or error:', err)
        return null
      }
    }

    // 2. Web Contact Picker API fallback (supported on Chrome Android)
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const nav = navigator as unknown as {
          contacts: {
            select: (
              props: string[],
              opts?: { multiple?: boolean }
            ) => Promise<Array<{ name?: string[]; tel?: string[] }>>
          }
        }
        const contacts = await nav.contacts.select(['name', 'tel'], { multiple: false })
        if (contacts && contacts.length > 0) {
          const c = contacts[0]
          const name = c.name?.[0] || 'Noma\'lum'
          const phone = cleanPhoneNumber(c.tel?.[0] || '')
          return { name: name.trim(), phone }
        }
      } catch {
        return null
      }
    }

    return null
  },
}

/**
 * Cleans and formats phone numbers to standard Uzbekistan (+998...) format
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return ''
  // Strip all non-digit characters except leading plus
  let digits = raw.replace(/[^\d+]/g, '')

  if (digits.startsWith('+998')) {
    digits = digits.slice(4)
  } else if (digits.startsWith('998')) {
    digits = digits.slice(3)
  } else if (digits.startsWith('8') && digits.length === 10) {
    // 8 90 123 45 67
    digits = digits.slice(1)
  }

  // Only take digits
  digits = digits.replace(/\D/g, '')

  // If 9 digits (standard Uzbekistan local format, e.g. 901234567)
  if (digits.length >= 9) {
    digits = digits.slice(-9)
    return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
  }

  return raw.trim()
}

/**
 * Android hardware back button handler
 */
export function registerBackButton(onBack: () => boolean | void) {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    return () => {}
  }

  const listenerPromise = App.addListener('backButton', (data) => {
    const handled = onBack()
    if (!handled && data.canGoBack) {
      window.history.back()
    }
  })

  return () => {
    listenerPromise.then((handle) => handle.remove())
  }
}
