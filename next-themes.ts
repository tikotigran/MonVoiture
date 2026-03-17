import React from 'react'
import type { ClassValue, clsx } from 'clsx'

export type Theme = 'dark' | 'light' | 'system'

export interface Theme {
  name: string
  colors: {
    background: string
    foreground: string
    muted: string
    accent: string
    destructive: string
    border: string
    input: string
    ring: string
    card: string
  }
}

export const themes: Record<Theme, Theme> = {
  light: {
    name: 'light',
    colors: {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      muted: 'hsl(210 40% 98%)',
      accent: 'hsl(210 40% 96%)',
      destructive: 'hsl(0 84.2% 60.2%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      input: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      muted: 'hsl(215 27.9% 33%)',
      accent: 'hsl(217.2 91.2% 15.8%)',
      destructive: 'hsl(0 62.8% 30.6%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      input: 'hsl(217.2 32.6% 17.5%)',
      ring: 'hsl(212.7 26.8% 83.9%)',
      card: 'hsl(222.2 84% 4.9%)'
    }
  },
  system: {
    name: 'system',
    colors: {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      muted: 'hsl(210 40% 98%)',
      accent: 'hsl(210 40% 96%)',
      destructive: 'hsl(0 84.2% 60.2%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      input: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)'
    }
  }
}

export type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
}

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>('system')

  React.useEffect(() => {
    const root = window.document.documentElement
    if (root) {
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }
  }, [theme])

  return {
    theme,
    setTheme,
    systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}
