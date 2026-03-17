'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import type { Car } from '@/lib/types'
import { formatCurrency } from '@/lib/format'

interface DebugPanelProps {
  cars: Car[]
  currency: string
}

export function DebugPanel({ cars, currency }: DebugPanelProps) {
  const soldCars = cars.filter(car => car.status === 'sold')
  const activeCars = cars.filter(car => car.status === 'active')

  // Подробный расчет
  const calculations = cars.map(car => {
    const expenses = car.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const purchasePrice = car.purchasePrice || 0
    const salePrice = car.salePrice || 0
    const invested = purchasePrice + expenses
    const profit = salePrice - invested

    return {
      id: car.id,
      name: car.name,
      status: car.status,
      purchasePrice,
      expenses,
      invested,
      salePrice,
      profit,
      hasIssues: purchasePrice < 0 || expenses < 0 || salePrice < 0
    }
  })

  const totalInvested = calculations.reduce((sum, car) => sum + car.invested, 0)
  const totalRevenue = calculations.reduce((sum, car) => sum + car.salePrice, 0)
  const totalProfit = totalRevenue - totalInvested

  const problematicCars = calculations.filter(car => car.hasIssues)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Debug Panel - Financial Analysis</h1>
      </div>

      {/* Общая сводка */}
      <Card>
        <CardHeader>
          <CardTitle>Общая финансовая сводка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalInvested, currency)}
              </div>
              <div className="text-sm text-red-600">Общие инвестиции</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue, currency)}
              </div>
              <div className="text-sm text-green-600">Общая выручка</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingDown className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalProfit, currency)}
              </div>
              <div className="text-sm text-orange-600">Общая прибыль</div>
            </div>
          </div>
          
          {totalProfit < 0 && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <h3 className="font-bold text-red-800 mb-2">⚠️ Обнаружен убыток!</h3>
              <p className="text-red-700">
                Убыток составляет {formatCurrency(Math.abs(totalProfit), currency)}. 
                Это означает что расходы ({formatCurrency(totalInvested, currency)}) 
                превышают выручку ({formatCurrency(totalRevenue, currency)}).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Подробные данные по машинам */}
      <Card>
        <CardHeader>
          <CardTitle>Подробные расчеты по машинам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calculations.map((car) => (
              <div key={car.id} className={`p-4 border rounded-lg ${car.hasIssues ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{car.name}</h3>
                    <Badge variant={car.status === 'sold' ? 'default' : 'secondary'}>
                      {car.status === 'sold' ? 'Продана' : 'Активна'}
                    </Badge>
                    {car.hasIssues && (
                      <Badge variant="destructive">Проблема!</Badge>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${car.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit, currency)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Покупка:</div>
                    <div className="font-medium">{formatCurrency(car.purchasePrice, currency)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Расходы:</div>
                    <div className="font-medium">{formatCurrency(car.expenses, currency)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Инвестировано:</div>
                    <div className="font-medium">{formatCurrency(car.invested, currency)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Продажа:</div>
                    <div className="font-medium">{formatCurrency(car.salePrice, currency)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Прибыль:</div>
                    <div className={`font-medium ${car.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit, currency)}
                    </div>
                  </div>
                </div>
                
                {car.hasIssues && (
                  <div className="mt-2 text-sm text-red-600">
                    ⚠️ Проблема с данными: отрицательные значения
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Проблемные машины */}
      {problematicCars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Проблемные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {problematicCars.map(car => (
                <div key={car.id} className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium">{car.name}</div>
                  <div className="text-sm text-red-600">
                    Проверьте: покупка ({formatCurrency(car.purchasePrice, currency)}), 
                    расходы ({formatCurrency(car.expenses, currency)}), 
                    продажа ({formatCurrency(car.salePrice, currency)})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Рекомендации */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {totalProfit < 0 && (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-yellow-800">1. Проверьте цены покупки</div>
                  <div className="text-sm text-yellow-700">
                    Возможно, цена покупки указана неверно (слишком высокая)
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-yellow-800">2. Проверьте расходы</div>
                  <div className="text-sm text-yellow-700">
                    Возможно, есть дублированные или слишком большие расходы
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-yellow-800">3. Проверьте цены продажи</div>
                  <div className="text-sm text-yellow-700">
                    Возможно, машины продаются дешевле чем были куплены
                  </div>
                </div>
              </>
            )}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="font-medium text-blue-800">Совет:</div>
              <div className="text-sm text-blue-700">
                Для прибыльности бизнеса цена продажи должна быть выше суммы (цена покупки + расходы)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
