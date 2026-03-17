'use client'

import { Car } from 'lucide-react'
import { t } from '@/lib/translations'

interface EmptyStateProps {
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function EmptyState({ language = 'ru' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 animate-in fade-in zoom-in-95 duration-500">
        <Car className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t('message.noCars', language)}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('message.addCarsFirst', language)}
      </p>
    </div>
  )
}
