'use client'

import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock, Target, Car as CarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Car } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { t } from '@/lib/translations'

interface DashboardProps {
  cars: Car[]
  currency: string
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function Dashboard({ cars, currency, language = 'ru' }: DashboardProps) {
  const soldCars = cars.filter(car => car.status === 'sold')
  const activeCars = cars.filter(car => car.status === 'active')
  
  // Финансовые показатели - только по проданным машинам
  const soldCarsData = soldCars.map(car => {
    const expenses = car.expenses.reduce((eSum, e) => eSum + (e.amount || 0), 0)
    const purchasePrice = car.purchasePrice || 0
    const invested = purchasePrice + expenses
    const profit = (car.salePrice || 0) - invested
    
    return {
      car,
      expenses,
      purchasePrice,
      invested,
      profit
    }
  })

  const totalInvested = soldCarsData.reduce((sum, data) => sum + data.invested, 0)
  const totalRevenue = soldCars.reduce((sum, car) => sum + (car.salePrice || 0), 0)
  const totalProfit = soldCarsData.reduce((sum, data) => sum + data.profit, 0)
  
  const profitableCars = soldCarsData.filter(data => data.profit > 0)
  
  // Средний срок окупаемости
  const profitabilityDays = soldCarsData
    .filter(data => data.profit > 0 && data.car.saleDate)
    .map(data => {
      const purchaseDate = data.car.purchaseDate || new Date().toISOString()
      return Math.ceil((new Date(data.car.saleDate!).getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
    })
  
  const avgDaysToProfit = profitabilityDays.length > 0 
    ? Math.round(profitabilityDays.reduce((sum, days) => sum + days, 0) / profitabilityDays.length)
    : 0
  
  // Текущий месяц
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthSales = soldCars.filter(car => {
    if (!car.saleDate) return false
    const saleDate = new Date(car.saleDate)
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
  })
  
  const thisMonthProfit = thisMonthSales.reduce((sum, car) => {
    const carData = soldCarsData.find(data => data.car.id === car.id)
    return sum + (carData?.profit || 0)
  }, 0)

  // Расчет инвестиций в активные машины
  const activeCarsInvested = activeCars.reduce((sum, car) => {
    const expenses = car.expenses.reduce((eSum, e) => eSum + (e.amount || 0), 0)
    const purchasePrice = car.purchasePrice || 0
    return sum + purchasePrice + expenses
  }, 0)

  const stats = [
    {
      title: t('dashboard.totalCars', language),
      value: cars.length,
      icon: CarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('dashboard.activeCars', language),
      value: activeCars.length,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dashboard.soldCars', language),
      value: soldCars.length,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('dashboard.profitableCars', language),
      value: profitableCars.length,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ]

  const financialStats = [
    {
      title: t('dashboard.totalInvested', language),
      value: formatCurrency(totalInvested, currency, language),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: t('dashboard.totalRevenue', language),
      value: formatCurrency(totalRevenue, currency, language),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dashboard.totalProfit', language),
      value: formatCurrency(totalProfit, currency, language),
      icon: TrendingUp,
      color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Инвестиции в активные',
      value: formatCurrency(activeCarsInvested, currency, language),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('dashboard.avgPaybackPeriod', language),
      value: avgDaysToProfit > 0 ? `${avgDaysToProfit} ${t('dashboard.days', language)}` : '—',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Финансовая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика за месяц */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('dashboard.thisMonth', language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('dashboard.carsSoldThisMonth', language)}</p>
              <p className="text-2xl font-bold text-green-600">{thisMonthSales.length}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('dashboard.monthlyProfit', language)}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthProfit, currency, language)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('dashboard.avgProfit', language)}</p>
              <p className="text-2xl font-bold text-blue-600">
                {thisMonthSales.length > 0 
                  ? formatCurrency(thisMonthProfit / thisMonthSales.length, currency, language)
                  : formatCurrency(0, currency, language)
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Последние продажи */}
      {soldCars.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Последние продажи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {soldCars
                .sort((a, b) => new Date(b.saleDate || 0).getTime() - new Date(a.saleDate || 0).getTime())
                .slice(0, 5)
                .map((car) => {
                  const carData = soldCarsData.find(data => data.car.id === car.id)
                  const profit = carData?.profit || 0
                  const days = car.saleDate 
                    ? Math.ceil((new Date(car.saleDate).getTime() - new Date(car.purchaseDate || new Date().toISOString()).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  
                  return (
                    <div key={car.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{car.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {car.saleDate && formatDate(car.saleDate)} • {days} дней
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(profit, currency, language)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(car.salePrice || 0, currency, language)}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
