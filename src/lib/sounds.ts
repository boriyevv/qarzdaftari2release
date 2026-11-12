// src/lib/sounds.ts
'use client'

import { nativeHaptics } from '@/lib/native'

const SOUND_STORAGE_KEY = 'qd_sound_enabled'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SOUND_STORAGE_KEY)
  return stored !== 'false'
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false')
}

// Reusable AudioContext singleton
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioCtx()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Pleasant modern success chime (e.g., payment recorded or debt fully repaid)
 * Clean harmonic arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
 */
export function playSuccessSound(): void {
  // Fire tactile vibration alongside audio
  nativeHaptics.notification('success').catch(() => {})

  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.18 }, // C5
    { freq: 659.25, time: 0.08, dur: 0.20 }, // E5
    { freq: 783.99, time: 0.16, dur: 0.22 }, // G5
    { freq: 1046.5, time: 0.24, dur: 0.45 }, // C6
  ]

  const now = ctx.currentTime

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + time)

    // Soft attack, gentle exponential decay
    gain.gain.setValueAtTime(0.0001, now + time)
    gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + time)
    osc.stop(now + time + dur)
  })
}

/**
 * Quick, crisp confirmation ping (e.g., adding partial payment or copying text)
 */
export function playPingSound(): void {
  // Fire subtle tactile click
  nativeHaptics.impact('light').catch(() => {})

  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now) // A5
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08) // E6

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.18)
}
