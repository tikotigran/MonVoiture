'use client'

import React from 'react'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
