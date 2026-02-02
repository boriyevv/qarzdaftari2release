// src/components/onboarding/tooltip-guide.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Step {
  id: string
  title: string
  description: string
  target: string // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right'
}

const ONBOARDING_STEPS: Step[] = [
  {
    id: 'debts-list',
    title: 'Qarzlar ro\'yxati',
    description: 'Qarzdor ustiga bosing - to\'liq ma\'lumot va tarix ko\'rish uchun',
    target: '[data-tour="debts-list"]',
    position: 'bottom',
  },
  {
    id: 'add-debt',
    title: 'Yangi qarz qo\'shish',
    description: 'Bu tugma orqali yangi qarz qo\'shing',
    target: '[data-tour="add-debt-button"]',
    position: 'left',
  },
  {
    id: 'analytics',
    title: 'Analitika',
    description: 'Biznesingiz statistikasini ko\'ring',
    target: '[data-tour="analytics-link"]',
    position: 'bottom',
  },
  {
    id: 'sms-credits',
    title: 'SMS eslatmalar',
    description: 'SMS yuborish uchun kredit sotib oling',
    target: '[data-tour="sms-link"]',
    position: 'bottom',
  },
]

export function OnboardingTooltip() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setTimeout(() => {
        setIsVisible(true)
        updatePosition()
      }, 1000)
    }
  }, [])

  useEffect(() => {
    if (isVisible) {
      updatePosition()
    }
  }, [currentStep, isVisible])

  const updatePosition = () => {
    const step = ONBOARDING_STEPS[currentStep]
    const target = document.querySelector(step.target)

    if (target) {
      const rect = target.getBoundingClientRect()
      let top = 0
      let left = 0

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + 10
          left = rect.left + rect.width / 2
          break
        case 'top':
          top = rect.top + 10
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 10
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 10
          break
      }

      setPosition({ top, left })

      // Highlight target
      target.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
    }
  }

  const handleNext = () => {
    // Remove highlight
    const step = ONBOARDING_STEPS[currentStep]
    const target = document.querySelector(step.target)
    if (target) {
      target.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    // Remove highlight
    const step = ONBOARDING_STEPS[currentStep]
    const target = document.querySelector(step.target)
    if (target) {
      target.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
    }

    setIsVisible(false)
    localStorage.setItem('hasSeenOnboarding', 'true')
  }

  if (!isVisible) return null

  const step = ONBOARDING_STEPS[currentStep]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleClose}
      />

      {/* Tooltip */}
      <Card
        className="fixed z-50 p-4 w-[96%] shadow-lg animate-in fade-in slide-in-from-bottom-2 mt-[300px] ml-2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          // transform: 'translate(-50%, 0)',
        }}
      >
        <div className="flex items-start justify-between mb-2 mt-2 ">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {currentStep + 1}
            </div>
            <h3 className="font-semibold">{step.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>
          <Button onClick={handleNext} size="sm">
            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <>
                Keyingisi <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              'Tushunarli'
            )}
          </Button>
        </div>
      </Card>
    </>
  )
}