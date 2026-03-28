'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Mail,
  User,
  Loader2,
  Package,
  Receipt
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AdminUser, AdminCar } from '@/lib/admin-service-users-only'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

interface CarWithExpenses extends AdminCar {
  expenses: Expense[]
}

interface UserDetailModalProps {
  user: AdminUser | null
  open: boolean
  onClose: () => void
}

export function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [cars, setCars] = useState<CarWithExpenses[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user && open) {
      loadUserDetails()
    }
  }, [user, open])

  const loadUserDetails = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load user profile
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.id, 'settings', 'userInfo'))
        if (profileDoc.exists()) {
          setProfile(profileDoc.data())
        }
      } catch (e) {
        // Profile not found
      }

      // Load cars with expenses
      const carsSnapshot = await getDocs(collection(db, 'users', user.id, 'cars'))
      const carsData: CarWithExpenses[] = []
      
      for (const carDoc of carsSnapshot.docs) {
        const carData = carDoc.data()
        
        if (carData.deleted === true) continue
        
        const expenses: Expense[] = []
        if (carData.expenses && Array.isArray(carData.expenses)) {
          carData.expenses.forEach((exp: any, index: number) => {
            expenses.push({
              id: `exp-${index}`,
              description: exp.description || 'Без описания',
              amount: exp.amount || 0,
              category: exp.category || 'Другое',
              date: exp.date || ''
            })
          })
        }
        
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        
        carsData.push({
          id: carDoc.id,
          userId: user.id,
          userEmail: user.email,
          garageName: user.garageName,
          name: carData.name || 'Без названия',
          purchasePrice: carData.purchasePrice || 0,
          salePrice: carData.salePrice,
          status: carData.status || 'active',
          createdAt: carData.createdAt || '',
          profit: carData.salePrice ? carData.salePrice - (carData.purchasePrice || 0) - totalExpenses : undefined,
          expensesCount: expenses.length,
          totalExpenses,
          expenses
        })
      }
      
      setCars(carsData)
    } catch (error) {
      console.error('Error loading user details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const totalInvested = cars.reduce((sum, car) => sum + car.purchasePrice, 0)
  const totalExpenses = cars.reduce((sum, car) => sum + car.totalExpenses, 0)
  const totalSold = cars.filter(c => c.status === 'sold').reduce((sum, car) => sum + (car.salePrice || 0), 0)
  const totalProfit = cars.filter(c => c.status === 'sold').reduce((sum, car) => sum + (car.profit || 0), 0)
  const activeCars = cars.filter(c => c.status !== 'sold').length
  const soldCars = cars.filter(c => c.status === 'sold').length

  // Activity data for simple chart
  const monthlyActivity = getMonthlyActivity(cars)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-lg">
              {(user.firstName?.charAt(0) || 'U')}{(user.lastName?.charAt(0) || '')}
            </div>
            <div>
              <div className="text-xl">{user.firstName || 'Пользователь'} {user.lastName || ''}</div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="cars">Машины ({cars.length})</TabsTrigger>
              <TabsTrigger value="expenses">Расходы</TabsTrigger>
              <TabsTrigger value="activity">Активность</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Car className="w-4 h-4" />
                      Всего машин
                    </div>
                    <div className="text-2xl font-bold mt-1">{cars.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {activeCars} активных, {soldCars} продано
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="w-4 h-4" />
                      Инвестировано
                    </div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(totalInvested, 'EUR')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Receipt className="w-4 h-4" />
                      Расходы
                    </div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses, 'EUR')}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <TrendingUp className="w-4 h-4" />
                      Прибыль
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, 'EUR')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Информация профиля</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Гараж:</span>
                    <span className="ml-2 font-medium">{user.garageName || profile?.garageName || 'Не указан'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата регистрации:</span>
                    <span className="ml-2 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Статус:</span>
                    <Badge variant={user.isActive ? 'default' : 'secondary'} className="ml-2">
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cars Tab */}
            <TabsContent value="cars" className="space-y-4 mt-4">
              {cars.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  У пользователя нет машин
                </div>
              ) : (
                <div className="space-y-3">
                  {cars.map((car) => (
                    <Card key={car.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium">{car.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Добавлена: {car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'Н/Д'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={car.status === 'sold' ? 'default' : 'secondary'}>
                              {car.status === 'sold' ? 'Продана' : 'Активна'}
                            </Badge>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(car.purchasePrice, 'EUR')}</div>
                              {car.salePrice && (
                                <div className="text-sm text-green-600">
                                  Продано: {formatCurrency(car.salePrice, 'EUR')}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {car.expensesCount} расходов ({formatCurrency(car.totalExpenses, 'EUR')})
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expenses list for this car */}
                        {car.expenses.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-sm font-medium mb-2">Расходы:</div>
                            <div className="space-y-1">
                              {car.expenses.slice(0, 5).map((exp) => (
                                <div key={exp.id} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{exp.description}</span>
                                  <span>{formatCurrency(exp.amount, 'EUR')}</span>
                                </div>
                              ))}
                              {car.expenses.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                  ...и еще {car.expenses.length - 5} расходов
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Все расходы пользователя</CardTitle>
                </CardHeader>
                <CardContent>
                  {cars.every(c => c.expenses.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground">
                      У пользователя нет расходов
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cars.filter(c => c.expenses.length > 0).map((car) => (
                        <div key={car.id}>
                          <div className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            {car.name}
                          </div>
                          <div className="space-y-1 pl-6">
                            {car.expenses.map((exp) => (
                              <div key={exp.id} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                                <div>
                                  <span>{exp.description}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {exp.category}
                                  </Badge>
                                </div>
                                <span className="font-medium">{formatCurrency(exp.amount, 'EUR')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t flex justify-between font-medium">
                        <span>Итого расходов:</span>
                        <span>{formatCurrency(totalExpenses, 'EUR')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses by category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">По категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderExpensesByCategory(cars)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Активность по месяцам</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Нет данных об активности
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {monthlyActivity.map((month) => (
                        <div key={month.month} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-muted-foreground">{month.month}</div>
                          <div className="flex-1 h-8 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(month.count / Math.max(...monthlyActivity.map(m => m.count))) * 100}%` }}
                            />
                          </div>
                          <div className="w-20 text-sm text-right">
                            {month.count} {month.type === 'cars' ? 'машин' : 'расх.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Последние действия</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cars.slice(0, 5).map((car) => (
                      <div key={car.id} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">
                          {car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'Н/Д'}
                        </span>
                        <span>
                          {car.status === 'sold' ? 'Продана машина' : 'Добавлена машина'}: {car.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function getMonthlyActivity(cars: CarWithExpenses[]) {
  const months: { [key: string]: number } = {}
  
  cars.forEach((car) => {
    if (car.createdAt) {
      const date = new Date(car.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[monthKey] = (months[monthKey] || 0) + 1
    }
  })
  
  return Object.entries(months)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('ru', { year: 'numeric', month: 'short' }),
      count,
      type: 'cars'
    }))
}

function renderExpensesByCategory(cars: CarWithExpenses[]) {
  const categories: { [key: string]: number } = {}
  
  cars.forEach((car) => {
    car.expenses.forEach((exp) => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount
    })
  })
  
  const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0)
  
  if (total === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Нет данных о расходах
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => (
          <div key={category} className="flex items-center gap-4">
            <div className="w-32 text-sm">{category}</div>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(amount / total) * 100}%` }}
              />
            </div>
            <div className="w-24 text-sm text-right font-medium">
              {formatCurrency(amount, 'EUR')}
            </div>
            <div className="w-12 text-xs text-muted-foreground">
              {Math.round((amount / total) * 100)}%
            </div>
          </div>
        ))}
    </div>
  )
}
