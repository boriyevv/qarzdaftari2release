// src/components/auth/otp-input.tsx
'use client'

import { ClipboardEvent, KeyboardEvent, useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function OTPInput({
  length = 6,
  value = '',
  onChange,
  disabled,
}: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Automatically focus next empty box when typing
  useEffect(() => {
    if (value.length < length && focusedIndex !== null) {
      inputRefs.current[value.length]?.focus()
    }
  }, [value, length])

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return
    const digit = inputValue.replace(/\D/g, '').slice(-1)

    const chars = value.split('')
    chars[index] = digit
    const nextVal = chars.join('').slice(0, length)
    onChange(nextVal)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      const chars = value.split('')
      if (chars[index]) {
        chars[index] = ''
        onChange(chars.join(''))
      } else if (index > 0) {
        chars[index - 1] = ''
        onChange(chars.join(''))
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return
    const pasted = e.clipboardData
      .getData('text/plain')
      .replace(/\D/g, '')
      .slice(0, length)
    onChange(pasted)
    const nextIdx = Math.min(pasted.length, length - 1)
    inputRefs.current[nextIdx]?.focus()
    setFocusedIndex(nextIdx)
  }

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-center items-center py-1">
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || ''
        const isFocused = focusedIndex === index
        const hasChar = Boolean(char)

        return (
          <div
            key={index}
            onClick={() => {
              if (!disabled) {
                inputRefs.current[index]?.focus()
                setFocusedIndex(index)
              }
            }}
            className={cn(
              'relative w-11 h-13 sm:w-13 sm:h-15 flex items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 select-none',
              isFocused
                ? 'border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/80 shadow-md scale-105 z-20'
                : hasChar
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs',
              disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
            )}
          >
            {/* Hidden native input for 100% accessible keyboard/mobile touch entry */}
            <input
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              onPaste={handlePaste}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 caret-transparent"
            />

            {/* Bottom-up animated digit */}
            {hasChar ? (
              <span
                key={`${index}-${char}`}
                className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 animate-otp-digit pointer-events-none select-none"
              >
                {char}
              </span>
            ) : isFocused ? (
              <span className="w-0.5 h-5 sm:h-6 bg-blue-600 animate-pulse rounded-full pointer-events-none" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 pointer-events-none" />
            )}
          </div>
        )
      })}
    </div>
  )
}
