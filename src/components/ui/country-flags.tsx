import React from 'react'

interface FlagProps {
  className?: string
  width?: number | string
  height?: number | string
}

/**
 * High-definition SVG Flag of Uzbekistan 🇺🇿
 */
export function UzbekistanFlag({ className = 'w-6 h-4.5', width, height }: FlagProps) {
  return (
    <svg
      viewBox="0 0 500 250"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] shadow-2xs border border-slate-200/40 dark:border-slate-700/50 ${className}`}
      width={width}
      height={height}
      aria-label="O'zbekiston bayrog'i"
    >
      {/* Blue top bar */}
      <rect width="500" height="80" fill="#0099B5" />
      {/* Red upper separator */}
      <rect y="80" width="500" height="5" fill="#CE1126" />
      {/* White middle bar */}
      <rect y="85" width="500" height="80" fill="#FFFFFF" />
      {/* Red lower separator */}
      <rect y="165" width="500" height="5" fill="#CE1126" />
      {/* Green bottom bar */}
      <rect y="170" width="500" height="80" fill="#1EB53A" />

      {/* Crescent Moon */}
      <circle cx="70" cy="40" r="30" fill="#FFFFFF" />
      <circle cx="78" cy="40" r="26" fill="#0099B5" />

      {/* 12 Stars (5-pointed) */}
      <g fill="#FFFFFF">
        {/* Row 1 (3 stars) */}
        <polygon points="120,20 122,26 128,26 123,30 125,36 120,32 115,36 117,30 112,26 118,26" />
        <polygon points="140,20 142,26 148,26 143,30 145,36 140,32 135,36 137,30 132,26 138,26" />
        <polygon points="160,20 162,26 168,26 163,30 165,36 160,32 155,36 157,30 152,26 158,26" />

        {/* Row 2 (4 stars) */}
        <polygon points="100,40 102,46 108,46 103,50 105,56 100,52 95,56 97,50 92,46 98,46" />
        <polygon points="120,40 122,46 128,46 123,50 125,56 120,52 115,56 117,50 112,46 118,46" />
        <polygon points="140,40 142,46 148,46 143,50 145,56 140,52 135,56 137,50 132,46 138,46" />
        <polygon points="160,40 162,46 168,46 163,50 165,56 160,52 155,56 157,50 152,46 158,46" />

        {/* Row 3 (5 stars) */}
        <polygon points="80,60 82,66 88,66 83,70 85,76 80,72 75,76 77,70 72,66 78,66" />
        <polygon points="100,60 102,66 108,66 103,70 105,76 100,72 95,76 97,70 92,66 98,66" />
        <polygon points="120,60 122,66 128,66 123,70 125,76 120,72 115,76 117,70 112,66 118,66" />
        <polygon points="140,60 142,66 148,66 143,70 145,76 140,72 135,76 137,70 132,66 138,66" />
        <polygon points="160,60 162,66 168,66 163,70 165,76 160,72 155,76 157,70 152,66 158,66" />
      </g>
    </svg>
  )
}

/**
 * High-definition SVG Flag of Russia 🇷🇺
 */
export function RussiaFlag({ className = 'w-6 h-4.5', width, height }: FlagProps) {
  return (
    <svg
      viewBox="0 0 300 200"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] shadow-2xs border border-slate-200/40 dark:border-slate-700/50 ${className}`}
      width={width}
      height={height}
      aria-label="Флаг России"
    >
      {/* White top stripe */}
      <rect width="300" height="66.66" fill="#FFFFFF" />
      {/* Blue middle stripe */}
      <rect y="66.66" width="300" height="66.66" fill="#0039A6" />
      {/* Red bottom stripe */}
      <rect y="133.32" width="300" height="66.68" fill="#D52B1E" />
    </svg>
  )
}

/**
 * High-definition SVG Flag of United Kingdom (English) 🇬🇧
 */
export function UkFlag({ className = 'w-6 h-4.5', width, height }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] shadow-2xs border border-slate-200/40 dark:border-slate-700/50 ${className}`}
      width={width}
      height={height}
      aria-label="United Kingdom Flag"
    >
      <clipPath id="uk-clip">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        {/* Navy Blue background */}
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        {/* White saltire */}
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red saltire */}
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        {/* White Cross */}
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        {/* Red Cross */}
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}
