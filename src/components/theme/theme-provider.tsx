// src/components/theme/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'
import { nativeStatusBar } from '@/lib/native'

function NativeThemeSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (resolvedTheme) {
      nativeStatusBar.syncWithTheme(resolvedTheme === 'dark')
    }
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <NativeThemeSync />
      {children}
    </NextThemesProvider>
  )
}
