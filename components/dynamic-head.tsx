'use client'

import { useEffect } from 'react'
import Head from 'next/head'

interface DynamicHeadProps {
  garageName?: string
}

export function DynamicHead({ garageName }: DynamicHeadProps) {
  useEffect(() => {
    // Update document title
    if (garageName && garageName.trim()) {
      document.title = `${garageName.trim()} - Учёт расходов на авто`
    } else {
      document.title = 'MyGarage - Учёт расходов на авто'
    }
  }, [garageName])

  return null
}
