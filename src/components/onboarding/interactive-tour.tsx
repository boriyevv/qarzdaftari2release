// src/components/onboarding/interactive-tour.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Rocket,
  Compass,
} from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  mobileTargetSelector?: string
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right'
  icon?: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Qarz Daftari tizimiga xush kelibsiz! 👋',
    description:
      'Do\'koningiz va mijozlar qarzlarini professional boshqarish uchun 1 daqiqalik tezkor sayohat. Boshlaymizmi?',
    icon: '✨',
  },
  {
    id: 'add-debt',
    title: 'Yangi qarz yozish',
    description:
      'Mijozga qarz berganingizda shu tugmani bosing. Ismi, telefon raqami, summa va qaytarish muddatini kiritish kifoya.',
    targetSelector: '#tour-add-debt',
    mobileTargetSelector: '#tour-add-debt-mobile',
    preferredPosition: 'bottom',
    icon: '➕',
  },
  {
    id: 'folders',
    title: 'Qarzlarni guruhlash (Papka / Folder)',
    description:
      'Qarzlaringizni qulay papkalarga ajrating: masalan, "Do\'kon", "Ulgurji", "Katta mijozlar" yoki "Shaxsiy". Tartib bilan boshqaring.',
    targetSelector: '#tour-folders',
    mobileTargetSelector: '#tour-folders',
    preferredPosition: 'bottom',
    icon: '📁',
  },
  {
    id: 'stats',
    title: 'Balans va statistika',
    description:
      'Jami berilgan qarzlar, mijozlar qaytargan summa va muddati o\'tgan qarzdorliklarni bir qarashda real vaqtda kuzatib boring.',
    targetSelector: '#tour-stats',
    preferredPosition: 'bottom',
    icon: '📊',
  },
  {
    id: 'sms-credits',
    title: 'SMS Eslatmalar',
    description:
      'To\'lov muddati yaqinlashganda mijozlarga avtomatik va tezkor SMS xabarnomalar yuboring.',
    targetSelector: '#tour-nav-sms',
    mobileTargetSelector: '#tour-nav-sms-mobile',
    preferredPosition: 'right',
    icon: '💬',
  },
  {
    id: 'analytics',
    title: 'Chuqur analitika va hisobotlar',
    description:
      'Oylik va yillik dinamikani, eng ko\'p qarzdorlarni tahlil qiling va hisobotlarni Excel yoki PDF formatida yuklab oling.',
    targetSelector: '#tour-nav-analytics',
    mobileTargetSelector: '#tour-nav-analytics-mobile',
    preferredPosition: 'right',
    icon: '📈',
  },
  {
    id: 'finish',
    title: 'Barchasi tayyor! 🚀',
    description:
      'Endi birinchi qarzingizni yozib, tizimdan to\'liq foydalanishingiz mumkin. Omadli savdo va barakali biznes tilaymiz!',
    icon: '🎉',
  },
]

const STORAGE_KEY = 'qarzdaftari_product_tour_completed_v1'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface PopoverPos {
  top: number
  left: number
  arrowPlacement: 'top' | 'bottom' | 'left' | 'right' | 'none'
  arrowOffset: number
}

export function InteractiveTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [popoverPos, setPopoverPos] = useState<PopoverPos>({
    top: 0,
    left: 0,
    arrowPlacement: 'none',
    arrowOffset: 24,
  })

  const popoverRef = useRef<HTMLDivElement>(null)

  // Start tour programmatically
  const startTour = useCallback((startIndex = 0) => {
    setCurrentStepIndex(startIndex)
    setIsOpen(true)
  }, [])

  // Listen for custom trigger event
  useEffect(() => {
    const handleTrigger = () => startTour(0)
    window.addEventListener('qarzdaftari:start-tour', handleTrigger)
    return () => window.removeEventListener('qarzdaftari:start-tour', handleTrigger)
  }, [startTour])

  // Support ?tour=start URL query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('tour') === 'start') {
        startTour(0)
        url.searchParams.delete('tour')
        const newSearch = url.searchParams.toString()
        window.history.replaceState(
          {},
          '',
          url.pathname + (newSearch ? `?${newSearch}` : '')
        )
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, [startTour])

  // Auto-launch for first-time visitors
  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        startTour(0)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  const step = TOUR_STEPS[currentStepIndex]
  const totalSteps = TOUR_STEPS.length
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  // Find target element
  const resolveTargetElement = useCallback((): HTMLElement | null => {
    if (!step) return null
    if (window.innerWidth < 1024 && step.mobileTargetSelector) {
      const el = document.querySelector(step.mobileTargetSelector) as HTMLElement | null
      if (el && el.offsetParent !== null) return el
    }
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector) as HTMLElement | null
      if (el && el.offsetParent !== null) return el
    }
    return null
  }, [step])

  // Recalculate target rect and popover positioning
  const updatePosition = useCallback(() => {
    if (!isOpen || !step) return

    const targetEl = resolveTargetElement()

    if (!targetEl) {
      // Centered modal view (Welcome or Finish steps)
      setTargetRect(null)
      setPopoverPos({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        arrowPlacement: 'none',
        arrowOffset: 24,
      })
      return
    }

    // Scroll element into view smoothly if not visible
    const b = targetEl.getBoundingClientRect()
    const isVisibleInViewport =
      b.top >= 0 &&
      b.left >= 0 &&
      b.bottom <= window.innerHeight &&
      b.right <= window.innerWidth

    if (!isVisibleInViewport) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const rect = targetEl.getBoundingClientRect()
    const padding = 8
    const spotlight: Rect = {
      x: Math.max(0, rect.left - padding),
      y: Math.max(0, rect.top - padding),
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    }
    setTargetRect(spotlight)

    // Calculate Popover Position
    const popoverW = Math.min(380, window.innerWidth - 32)
    const popoverH = popoverRef.current?.offsetHeight || 200
    const margin = 16

    let pos = step.preferredPosition || 'bottom'
    let top = 0
    let left = 0
    let arrow: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none'

    const spaceBelow = window.innerHeight - spotlight.y - spotlight.height
    const spaceAbove = spotlight.y
    const spaceRight = window.innerWidth - spotlight.x - spotlight.width
    const spaceLeft = spotlight.x

    if (pos === 'right' && spaceRight >= popoverW + margin) {
      left = spotlight.x + spotlight.width + margin
      top = spotlight.y + spotlight.height / 2 - popoverH / 2
      arrow = 'left'
    } else if (pos === 'left' && spaceLeft >= popoverW + margin) {
      left = spotlight.x - popoverW - margin
      top = spotlight.y + spotlight.height / 2 - popoverH / 2
      arrow = 'right'
    } else if (pos === 'bottom' && spaceBelow >= popoverH + margin) {
      top = spotlight.y + spotlight.height + margin
      left = spotlight.x + spotlight.width / 2 - popoverW / 2
      arrow = 'top'
    } else if (pos === 'top' && spaceAbove >= popoverH + margin) {
      top = spotlight.y - popoverH - margin
      left = spotlight.x + spotlight.width / 2 - popoverW / 2
      arrow = 'bottom'
    } else {
      // Fallback: pick best available space
      if (spaceBelow >= popoverH + margin) {
        top = spotlight.y + spotlight.height + margin
        left = spotlight.x + spotlight.width / 2 - popoverW / 2
        arrow = 'top'
      } else if (spaceAbove >= popoverH + margin) {
        top = spotlight.y - popoverH - margin
        left = spotlight.x + spotlight.width / 2 - popoverW / 2
        arrow = 'bottom'
      } else if (spaceRight >= popoverW + margin) {
        left = spotlight.x + spotlight.width + margin
        top = spotlight.y + spotlight.height / 2 - popoverH / 2
        arrow = 'left'
      } else {
        top = window.innerHeight / 2 - popoverH / 2
        left = window.innerWidth / 2 - popoverW / 2
        arrow = 'none'
      }
    }

    // Clamp coordinates within screen viewport
    const clampedLeft = Math.max(16, Math.min(window.innerWidth - popoverW - 16, left))
    const clampedTop = Math.max(16, Math.min(window.innerHeight - popoverH - 16, top))

    // Calculate exact arrow offset so arrow points at spotlight center
    let arrowOffset = 24
    if (arrow === 'left' || arrow === 'right') {
      const targetCenterY = spotlight.y + spotlight.height / 2
      arrowOffset = Math.max(16, Math.min(popoverH - 24, targetCenterY - clampedTop))
    } else if (arrow === 'top' || arrow === 'bottom') {
      const targetCenterX = spotlight.x + spotlight.width / 2
      arrowOffset = Math.max(16, Math.min(popoverW - 24, targetCenterX - clampedLeft))
    }

    setPopoverPos({
      top: clampedTop,
      left: clampedLeft,
      arrowPlacement: arrow,
      arrowOffset,
    })
  }, [isOpen, step, resolveTargetElement])

  // Recalculate on step change, resize, or scroll
  useEffect(() => {
    updatePosition()
    const handleResizeOrScroll = () => {
      requestAnimationFrame(updatePosition)
    }
    window.addEventListener('resize', handleResizeOrScroll)
    window.addEventListener('scroll', handleResizeOrScroll, true)
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll, true)
    }
  }, [updatePosition])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handleBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStepIndex])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleDismiss = () => {
    setIsOpen(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const handleComplete = () => {
    setIsOpen(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!isOpen) return null

  const isCentered = !targetRect

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. SPOTLIGHT SVG MASK OVERLAY
          ───────────────────────────────────────────────────────────── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300 ease-out"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White fills everything (opaque mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout creates transparent spotlight window */}
            {targetRect && (
              <rect
                x={targetRect.x}
                y={targetRect.y}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                ry="14"
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop with cutout mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 15, 29, 0.76)"
          mask="url(#tour-spotlight-mask)"
        />

        {/* Glowing animated border around highlighted target */}
        {targetRect && (
          <rect
            x={targetRect.x - 2}
            y={targetRect.y - 2}
            width={targetRect.width + 4}
            height={targetRect.height + 4}
            rx="16"
            ry="16"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse transition-all duration-300 ease-out"
          />
        )}
      </svg>

      {/* Click-capturing transparent backdrop to prevent accidental outside clicks */}
      <div
        className="fixed inset-0 pointer-events-auto"
        onClick={() => {
          // Keep active or advance
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING POPOVER CARD (SATASHKENT-Inspired Design)
          ───────────────────────────────────────────────────────────── */}
      <div
        ref={popoverRef}
        style={
          isCentered
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            : {
                position: 'fixed',
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
              }
        }
        className={`pointer-events-auto w-[92vw] sm:w-[380px] max-w-[390px] bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl p-5 transition-all duration-300 ease-out animate-in fade-in zoom-in-95`}
      >
        {/* Dynamic Arrow Pointer */}
        {!isCentered && popoverPos.arrowPlacement !== 'none' && (
          <div
            style={
              popoverPos.arrowPlacement === 'left' || popoverPos.arrowPlacement === 'right'
                ? { top: `${popoverPos.arrowOffset}px` }
                : { left: `${popoverPos.arrowOffset}px` }
            }
            className={`absolute w-3.5 h-3.5 bg-slate-900 border-slate-700/80 rotate-45 pointer-events-none ${
              popoverPos.arrowPlacement === 'top'
                ? '-top-2 border-t border-l'
                : popoverPos.arrowPlacement === 'bottom'
                ? '-bottom-2 border-b border-r'
                : popoverPos.arrowPlacement === 'left'
                ? '-left-2 border-b border-l'
                : '-right-2 border-t border-r'
            }`}
          />
        )}

        {/* Popover Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {step.icon && <span className="text-xl leading-none">{step.icon}</span>}
            <h3 className="font-extrabold text-white text-base leading-snug">
              {step.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Yopish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Popover Body Description */}
        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-5">
          {step.description}
        </p>

        {/* Popover Footer: Counter and Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/90">
          <div className="text-[11px] font-bold text-slate-400 tracking-wide">
            {currentStepIndex + 1} of {totalSteps}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Orqaga</span>
              </button>
            )}

            {isFirstStep && (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
              >
                O&apos;tkazib yuborish
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                isLastStep
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              <span>{isLastStep ? 'Boshlash' : isFirstStep ? 'Boshlash' : 'Keyingisi'}</span>
              {isLastStep ? (
                <Rocket className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
