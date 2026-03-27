'use client'

import { useState } from 'react'
import { ChevronRight, Users, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Car } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { t } from '@/lib/translations'

interface CarCardProps {
  car: Car
  currency: string
  language?: 'ru' | 'fr' | 'hy' | 'en'
  onClick: () => void
  onEdit?: () => void
  showLicensePlate?: boolean
  showPurchaseDate?: boolean
  showKm?: boolean
  showYear?: boolean
}

export function CarCard({ car, currency, language = 'ru', onClick, onEdit, showLicensePlate = true, showPurchaseDate = true, showKm = true, showYear = true }: CarCardProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const totalExpenses = car.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalInvested = (car.purchasePrice || 0) + totalExpenses
  const profit = car.salePrice ? car.salePrice - totalInvested : 0
  const isProfitable = profit > 0
  
  // Calculate days to profitability
  const daysToProfitability = car.status === 'sold' && profit > 0
    ? Math.ceil((new Date(car.saleDate || '').getTime() - new Date(car.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const handleMouseDown = () => {
    setIsLongPress(false)
    const timer = setTimeout(() => {
      setIsLongPress(true)
      if (onEdit) onEdit()
    }, 500) // 500ms для долгого нажатия
    setPressTimer(timer)
  }

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    // Только клик без долгого нажатия
    if (!isLongPress && onClick) {
      onClick()
    }
  }

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    setIsLongPress(false)
  }

  const handleTouchStart = () => {
    setIsLongPress(false)
    const timer = setTimeout(() => {
      setIsLongPress(true)
      if (onEdit) onEdit()
    }, 500) // 500ms для долгого нажатия
    setPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:bg-secondary/50 active:scale-[0.98]"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{car.name}</h3>
              {car.isPartnership && (
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              {/* Иконка чек-листа всегда видна */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckSquare className="w-4 h-4" />
                {car.checklist && car.checklist.length > 0 ? (
                  <span className="text-xs">
                    {car.checklist.filter(i => i.completed).length}/{car.checklist.length}
                  </span>
                ) : (
                  <span className="text-xs">+</span>
                )}
              </div>
            </div>
            {showLicensePlate && car.licensePlate && (
              <p className="text-sm text-muted-foreground mb-1 font-mono">
                {car.licensePlate}
              </p>
            )}
            <div className="flex gap-3 text-sm text-muted-foreground mb-3">
              {showYear && car.year && (
                <span>{car.year}</span>
              )}
              {showKm && car.km && (
                <span>{car.km.toLocaleString()} {t('label.km', language)}</span>
              )}
            </div>
            {showPurchaseDate && (
            <p className="text-sm text-muted-foreground mb-3">
              {car.status === 'sold' && car.saleDate
                ? `${t('label.sold', language)} ${formatDate(car.saleDate, language)}`
                : formatDate(car.purchaseDate, language)}
            </p>
            )}

            {totalInvested > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('stats.invested', language)}:</span>
                <span>{formatCurrency(totalInvested, currency)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge variant="secondary">
              {car.status === 'sold' ? t('status.sold', language) : t('status.active', language)}
            </Badge>
            {car.status === 'sold' && (
                <span className="text-sm font-semibold">
                  {isProfitable ? '+' : ''}
                  {formatCurrency(profit, currency, language)}
                  {daysToProfitability && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({daysToProfitability} дней)
                    </span>
                  )}
                </span>
            )}
          </div>
        </div>
        
        {totalInvested > 0 && (
          <div className="flex justify-between text-sm font-medium pt-2 border-t">
            <span>{t('stats.total', language)}:</span>
            <span>{formatCurrency(totalInvested, currency)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
