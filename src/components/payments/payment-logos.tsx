// src/components/payments/payment-logos.tsx
import React from 'react'

export interface PaymentLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
  width?: number | string
  height?: number | string
  alt?: string
}

/**
 * Uzum Bank official logo (using authentic official vector uzum-bank.svg)
 */
export function UzumBankLogo({ className = 'h-10 w-auto', alt = 'Uzum Bank', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/uzum-bank.svg"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Uzum compact logo icon
 */
export function UzumLogo({ className = 'h-10 w-auto', alt = 'Uzum', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/uzum-bank.svg"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Payme official logo (tightly cropped, edge-to-edge transparent PNG)
 */
export function PaymeLogo({ className = 'h-10 w-auto', alt = 'Payme', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/payme.png"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Click official logo (tightly cropped, edge-to-edge transparent PNG)
 */
export function ClickLogo({ className = 'h-10 w-auto', alt = 'Click', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/click.png"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Uzcard official logo (tightly cropped, edge-to-edge transparent PNG)
 */
export function UzcardLogo({ className = 'h-10 w-auto', alt = 'Uzcard', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/uzcard.png"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Humo official logo (tightly cropped, edge-to-edge transparent PNG)
 */
export function HumoLogo({ className = 'h-10 w-auto', alt = 'Humo', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/humo.png"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Visa official logo (tightly fitted viewBox visa.svg)
 */
export function VisaLogo({ className = 'h-8 w-auto', alt = 'Visa', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/visa.svg"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Mastercard official logo (using authentic official vector mastercard.svg)
 */
export function MastercardLogo({ className = 'h-10 w-auto', alt = 'Mastercard', ...props }: PaymentLogoProps) {
  return (
    <img
      src="/images/payments/mastercard.svg"
      alt={alt}
      className={`object-contain inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  )
}

/**
 * Row displaying accepted payment providers and national bank cards.
 * Displays only active methods: Uzum Bank, Click, Payme, Uzcard, and Humo.
 */
export function PaymentMethodsRow({ className = '' }: { className?: string }) {
  const badgeCardClass =
    'h-12 sm:h-14 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-xs flex items-center justify-center transition-all hover:scale-105 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-3.5 ${className}`}>
      <div title="Uzum Bank" className={badgeCardClass}>
        <UzumBankLogo className="h-8 sm:h-9 w-auto" />
      </div>
      <div title="Click" className={badgeCardClass}>
        <ClickLogo className="h-7 sm:h-8 w-auto" />
      </div>
      <div title="Payme" className={badgeCardClass}>
        <PaymeLogo className="h-7 sm:h-8 w-auto" />
      </div>
      <div title="Uzcard" className={badgeCardClass}>
        <UzcardLogo className="h-8 sm:h-9 w-auto" />
      </div>
      <div title="Humo" className={badgeCardClass}>
        <HumoLogo className="h-8 sm:h-9 w-auto" />
      </div>
    </div>
  )
}
