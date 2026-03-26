import { collection, getDocs, query, orderBy, where, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Car, Expense, UserInfo } from '@/lib/types'

export interface AdminUser {
  id: string
  email: string
  garageName?: string
  firstName?: string
  lastName?: string
  createdAt: string
  lastLogin?: string
  isActive: boolean
  carCount: number
  totalExpenses: number
  totalInvested: number
  carsSold: number
  totalProfit: number
}

export interface AdminCar {
  id: string
  userId: string
  userEmail: string
  garageName?: string
  name: string
  purchasePrice: number
  salePrice?: number
  status: 'active' | 'sold'
  createdAt: string
  profit?: number
  expensesCount: number
  totalExpenses: number
}

export interface AdminStats {
  totalUsers: number
  totalCars: number
  totalExpenses: number
  totalRevenue: number
  activeUsers: number
  newUsersThisMonth: number
  carsSoldThisMonth: number
  avgCarPrice: number
  totalProfit: number
  carsThisMonth: number
}

export interface PopularBrand {
  brand: string
  count: number
}

export interface CategoryExpense {
  category: string
  amount: number
}

class AdminService {
  // Получение общей статистики
  async getStats(): Promise<AdminStats> {
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Получаем все документы пользователей
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Получаем все машины
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[]

      // Получаем все расходы
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))
      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]

      // Фильтры для этого месяца
      const thisMonthCars = cars.filter(car => {
        const carDate = car.createdAt instanceof Timestamp ? car.createdAt.toDate() : new Date(car.createdAt)
        return carDate >= firstDayOfMonth
      })

      const thisMonthSoldCars = cars.filter(car => {
        if (!car.saleDate) return false
        const saleDate = car.saleDate instanceof Timestamp ? car.saleDate.toDate() : new Date(car.saleDate)
        return saleDate >= firstDayOfMonth
      })

      const thisMonthUsers = users.filter(user => {
        const userDate = user.createdAt instanceof Timestamp ? user.createdAt.toDate() : new Date(user.createdAt)
        return userDate >= firstDayOfMonth
      })

      // Расчеты
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const totalRevenue = cars
        .filter(car => car.salePrice)
        .reduce((sum, car) => sum + (car.salePrice || 0), 0)
      
      const totalProfit = cars
        .filter(car => car.salePrice && car.purchasePrice)
        .reduce((sum, car) => sum + (car.salePrice! - car.purchasePrice), 0)

      const activeUsers = users.filter(user => {
        // Считаем активными если есть машины или расходы за последний месяц
        const userCars = cars.filter(car => car.userId === user.id)
        const userExpenses = expenses.filter(exp => exp.carId && userCars.some(car => car.id === exp.carId))
        const lastActivity = Math.max(
          ...userCars.map(car => car.createdAt instanceof Timestamp ? car.createdAt.toDate().getTime() : new Date(car.createdAt).getTime()),
          ...userExpenses.map(exp => exp.date instanceof Timestamp ? exp.date.toDate().getTime() : new Date(exp.date).getTime())
        )
        const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000)
        return lastActivity > thirtyDaysAgo
      }).length

      const avgCarPrice = cars.length > 0 
        ? cars.reduce((sum, car) => sum + car.purchasePrice, 0) / cars.length 
        : 0

      return {
        totalUsers: users.length,
        totalCars: cars.length,
        totalExpenses,
        totalRevenue,
        activeUsers,
        newUsersThisMonth: thisMonthUsers.length,
        carsSoldThisMonth: thisMonthSoldCars.length,
        avgCarPrice,
        totalProfit,
        carsThisMonth: thisMonthCars.length
      }
    } catch (error) {
      console.error('Error getting admin stats:', error)
      
      // Возвращаем fallback данные если нет доступа
      return {
        totalUsers: 0,
        totalCars: 0,
        totalExpenses: 0,
        totalRevenue: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        carsSoldThisMonth: 0,
        avgCarPrice: 0,
        totalProfit: 0,
        carsThisMonth: 0
      }
    }
  }

  // Получение всех пользователей
  async getUsers(): Promise<AdminUser[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[]

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]

      return users.map(user => {
        const userCars = cars.filter(car => car.userId === user.id)
        const userExpenses = expenses.filter(exp => {
          const car = userCars.find(car => car.id === exp.carId)
          return car !== undefined
        })

        const totalExpenses = userExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        const totalInvested = userCars.reduce((sum, car) => sum + car.purchasePrice, 0) + totalExpenses
        const carsSold = userCars.filter(car => car.status === 'sold').length
        const totalProfit = userCars
          .filter(car => car.salePrice && car.purchasePrice)
          .reduce((sum, car) => sum + (car.salePrice! - car.purchasePrice), 0)

        // Определяем активность пользователя
        const now = new Date()
        const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000)
        const lastActivity = Math.max(
          ...userCars.map(car => car.createdAt instanceof Timestamp ? car.createdAt.toDate().getTime() : new Date(car.createdAt).getTime()),
          ...userExpenses.map(exp => exp.date instanceof Timestamp ? exp.date.toDate().getTime() : new Date(exp.date).getTime())
        )
        const isActive = lastActivity > thirtyDaysAgo

        return {
          id: user.id,
          email: user.email || '',
          garageName: user.garageName,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt instanceof Timestamp ? user.createdAt.toDate().toISOString() : user.createdAt,
          lastLogin: user.lastLogin,
          isActive,
          carCount: userCars.length,
          totalExpenses,
          totalInvested,
          carsSold,
          totalProfit
        }
      })
    } catch (error) {
      console.error('Error getting users:', error)
      // Возвращаем пустой массив если нет доступа
      return []
    }
  }

  // Получение всех машин
  async getCars(): Promise<AdminCar[]> {
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[]

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]

      return cars.map(car => {
        const user = users.find(u => u.id === car.userId)
        const carExpenses = expenses.filter(exp => exp.carId === car.id)
        const totalExpenses = carExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        const profit = car.salePrice ? car.salePrice - car.purchasePrice : undefined

        return {
          id: car.id,
          userId: car.userId,
          userEmail: user?.email || '',
          garageName: user?.garageName,
          name: car.name,
          purchasePrice: car.purchasePrice,
          salePrice: car.salePrice,
          status: car.status,
          createdAt: car.createdAt instanceof Timestamp ? car.createdAt.toISOString() : car.createdAt,
          profit,
          expensesCount: carExpenses.length,
          totalExpenses
        }
      })
    } catch (error) {
      console.error('Error getting cars:', error)
      return []
    }
  }

  // Получение популярных марок
  async getPopularBrands(): Promise<PopularBrand[]> {
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[]

      const brandCounts: { [key: string]: number } = {}
      
      cars.forEach(car => {
        const brand = car.name.split(' ')[0] // Берем первое слово как марку
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      })

      return Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Топ-10 марок
    } catch (error) {
      console.error('Error getting popular brands:', error)
      return []
    }
  }

  // Получение расходов по категориям
  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    try {
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))
      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]

      const categoryTotals: { [key: string]: number } = {}
      
      expenses.forEach(expense => {
        const category = expense.category || 'other'
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
      })

      return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
    } catch (error) {
      console.error('Error getting category expenses:', error)
      return []
    }
  }

  // Блокировка пользователя
  async blockUser(userId: string): Promise<void> {
    try {
      // В реальном приложении здесь будет обновление документа пользователя
      // userRef.update({ isActive: false, blockedAt: Timestamp.now() })
      console.log('User blocked:', userId)
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  // Отправка уведомления всем пользователям
  async sendNotification(title: string, message: string, onlyActive: boolean = false): Promise<void> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // В реальном приложении здесь будет логика отправки уведомлений
      // через Firebase Cloud Messaging или другой сервис
      console.log('Sending notification:', { title, message, onlyActive, userCount: users.length })
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  // Очистка неактивных пользователей
  async cleanupInactiveUsers(): Promise<number> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Car[]

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]

      let deletedCount = 0

      for (const user of users) {
        const userCars = cars.filter(car => car.userId === user.id)
        const userExpenses = expenses.filter(exp => {
          const car = userCars.find(car => car.id === exp.carId)
          return car !== undefined
        })

        const lastActivity = Math.max(
          ...userCars.map(car => car.createdAt instanceof Timestamp ? car.createdAt.toDate().getTime() : new Date(car.createdAt).getTime()),
          ...userExpenses.map(exp => exp.date instanceof Timestamp ? exp.date.toDate().getTime() : new Date(exp.date).getTime())
        )

        if (lastActivity < sixMonthsAgo.getTime() && userCars.length === 0) {
          // В реальном приложении здесь будет удаление пользователя
          console.log('Deleting inactive user:', user.id)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up inactive users:', error)
      throw error
    }
  }
}

export const adminService = new AdminService()
