// src/components/ui/animated-counter.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number // ms, default 1100
  formatter?: (val: number) => string
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  isLoading?: boolean
}

// Luxurious easeOutExpo easing curve: fast initial acceleration, silky smooth deceleration
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

export function AnimatedCounter({
  value,
  duration = 1100,
  formatter,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  isLoading = false,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const prevValueRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // Check for user's reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || isLoading) {
      setDisplayValue(value)
      prevValueRef.current = value
      return
    }

    const startVal = prevValueRef.current
    const targetVal = Number(value) || 0
    const change = targetVal - startVal

    // If no meaningful change, set immediately
    if (Math.abs(change) < 0.0001) {
      setDisplayValue(targetVal)
      return
    }

    let startTime: number | null = null

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      const current = startVal + change * easedProgress
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(targetVal)
        prevValueRef.current = targetVal
      }
    }

    animationFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration, isLoading])

  if (isLoading) {
    return (
      <span
        className={`inline-block animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md h-[1.15em] w-24 align-middle ${className}`}
        aria-hidden="true"
      />
    )
  }

  // Format the output
  const rounded = Number(displayValue.toFixed(decimals))
  const formatted = formatter
    ? formatter(rounded)
    : decimals > 0
    ? rounded.toLocaleString('uz-UZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(rounded).toLocaleString('uz-UZ')

  return (
    <span className={`tabular-nums font-feature-settings-tnum ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
