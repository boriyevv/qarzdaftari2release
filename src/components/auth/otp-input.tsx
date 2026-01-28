// src/components/auth/otp-input.tsx
'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { Input } from '@/src/components/ui/input'
import { cn } from '@/src/lib/utills'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function OTPInput({ length = 6, value, onChange, disabled }: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1)

    const newValue = value.split('')
    newValue[index] = digit
    onChange(newValue.join(''))

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Focus previous input on backspace
        inputRefs.current[index - 1]?.focus()
      }
      const newValue = value.split('')
      newValue[index] = ''
      onChange(newValue.join(''))
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    onChange(pastedData)

    // Focus last filled input
    const focusIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {inputRefs.current[index] = el}}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => setFocusedIndex(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-bold',
            focusedIndex === index && 'ring-2 ring-blue-500',
            value[index] && 'bg-blue-50'
          )}
        />
      ))}
    </div>
  )
}