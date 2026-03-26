'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface ThemeToggleProps {
  theme?: 'light' | 'dark' | 'system'
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void
}

export function ThemeToggle({ theme: controlledTheme, onThemeChange }: ThemeToggleProps = {}) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null
  
  const currentTheme = controlledTheme ?? ((theme as 'light' | 'dark' | 'system' | undefined) ?? 'system')
  const effectiveTheme = currentTheme === 'system' ? 'light' : currentTheme

  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = effectiveTheme === 'dark' ? 'light' : 'dark'
    if (onThemeChange) {
      onThemeChange(nextTheme)
    }
    setTheme(nextTheme)
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {effectiveTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
