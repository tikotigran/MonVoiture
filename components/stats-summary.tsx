'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { Car } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { t } from '@/lib/translations'

interface StatsSummaryProps {
  cars: Car[]
  currency: string
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function StatsSummary({ cars, currency, language = 'ru' as const }: StatsSummaryProps) {
  const soldCars = cars.filter((c) => c.status === 'sold')
  const activeCars = cars.filter((c) => c.status === 'active')

  const totalProfit = soldCars.reduce((sum, car) => {
    const expenses = car.expenses.reduce((s, e) => s + (e.amount || 0), 0)
    const invested = (car.purchasePrice || 0) + expenses
    return sum + ((car.salePrice || 0) - invested)
  }, 0)

  const totalInvested = activeCars.reduce((sum, car) => {
    const expenses = car.expenses.reduce((s, e) => s + (e.amount || 0), 0)
    return sum + (car.purchasePrice || 0) + expenses
  }, 0)

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-secondary/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('stats.invested', language)}</p>
          <p className="text-lg font-bold">{formatCurrency(totalInvested, currency, language)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeCars.length} {t('stats.carsActive', language)}
          </p>
        </CardContent>
      </Card>
      <Card className={totalProfit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('label.profit', language)}</p>
          <p
            className={`text-lg font-bold ${totalProfit >= 0 ? 'text-primary' : 'text-destructive'
              }`}
          >
            {totalProfit >= 0 ? '+' : ''}
            {formatCurrency(totalProfit, currency, language)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {soldCars.length} {t('stats.carsSold', language)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
