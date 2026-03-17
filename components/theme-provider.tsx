'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useAppStore } from '@/lib/store'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { state, updateTheme } = useAppStore()

  // Sync theme with our store
  React.useEffect(() => {
    if (updateTheme) {
      // Get theme from next-themes storage
      const storedTheme = localStorage.getItem('edvi-auto-theme')
      if (storedTheme && storedTheme !== state.settings.theme) {
        updateTheme(storedTheme as 'light' | 'dark' | 'system')
      }
    }
  }, [state.settings.theme, updateTheme])

  // Sync store theme to next-themes
  React.useEffect(() => {
    if (state.settings.theme) {
      const root = window.document.documentElement
      if (state.settings.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(systemTheme)
      } else {
        root.classList.remove('light', 'dark')
        root.classList.add(state.settings.theme)
      }
    }
  }, [state.settings.theme])

  return (
    <NextThemesProvider 
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="edvi-auto-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
