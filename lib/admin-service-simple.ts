import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

export interface PopularBrand {
  brand: string
  count: number
}

export interface CategoryExpense {
  category: string
  amount: number
}

class SimpleAdminService {
  async getStats(): Promise<AdminStats> {
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Получаем все документы
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      // Расчеты
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const totalRevenue = cars
        .filter(car => car.salePrice)
        .reduce((sum, car) => sum + (car.salePrice || 0), 0)
      
      const totalProfit = cars
        .filter(car => car.salePrice && car.purchasePrice)
        .reduce((sum, car) => sum + ((car.salePrice || 0) - car.purchasePrice), 0)

      const thisMonthCars = cars.filter(car => {
        const carDate = car.createdAt instanceof Timestamp ? car.createdAt.toDate() : new Date(car.createdAt || '')
        return carDate >= firstDayOfMonth
      })

      const thisMonthSoldCars = cars.filter(car => {
        if (!car.saleDate) return false
        const saleDate = car.saleDate instanceof Timestamp ? car.saleDate.toDate() : new Date(car.saleDate || '')
        return saleDate >= firstDayOfMonth
      })

      const thisMonthUsers = users.filter(user => {
        const userDate = user.createdAt instanceof Timestamp ? user.createdAt.toDate() : new Date(user.createdAt || '')
        return userDate >= firstDayOfMonth
      })

      return {
        totalUsers: users.length,
        totalCars: cars.length,
        totalExpenses,
        totalRevenue,
        activeUsers: users.length, // Упрощено для примера
        newUsersThisMonth: thisMonthUsers.length,
        carsSoldThisMonth: thisMonthSoldCars.length,
        avgCarPrice: cars.length > 0 ? cars.reduce((sum, car) => sum + car.purchasePrice, 0) / cars.length : 0,
        totalProfit,
        carsThisMonth: thisMonthCars.length
      }
    } catch (error) {
      console.error('Error getting admin stats:', error)
      
      // Возвращаем fallback данные
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

  async getUsers(): Promise<AdminUser[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      return users.map(user => {
        const userCars = cars.filter((car: any) => car.userId === user.id)
        const userExpenses = expenses.filter((exp: any) => userCars.some((car: any) => car.id === exp.carId))
        const totalExpenses = userExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        const totalInvested = userCars.reduce((sum, car) => sum + (car.purchasePrice || 0), 0) + totalExpenses
        const carsSold = userCars.filter((car: any) => car.status === 'sold').length
        const totalProfit = userCars
          .filter((car: any) => car.salePrice && car.purchasePrice)
          .reduce((sum, car) => sum + ((car.salePrice || 0) - car.purchasePrice), 0)

        return {
          id: user.id,
          email: user.email || '',
          garageName: (user as any).garageName,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          createdAt: user.createdAt instanceof Timestamp ? user.createdAt.toISOString() : user.createdAt || '',
          lastLogin: (user as any).lastLogin,
          isActive: true, // Упрощено
          carCount: userCars.length,
          totalExpenses,
          totalInvested,
          carsSold,
          totalProfit
        }
      })
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  async getCars(): Promise<AdminCar[]> {
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))

      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      return cars.map(car => {
        const user = users.find((u: any) => u.id === car.userId)
        const carExpenses = expenses.filter((exp: any) => exp.carId === car.id)
        const totalExpenses = carExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        const profit = car.salePrice ? car.salePrice - (car.purchasePrice || 0) : undefined

        return {
          id: car.id,
          userId: car.userId,
          userEmail: user?.email || '',
          garageName: (user as any)?.garageName,
          name: car.name || '',
          purchasePrice: car.purchasePrice || 0,
          salePrice: car.salePrice,
          status: car.status || 'active',
          createdAt: car.createdAt instanceof Timestamp ? car.createdAt.toISOString() : car.createdAt || '',
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

  async getPopularBrands(): Promise<PopularBrand[]> {
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'))
      const cars = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const brandCounts: { [key: string]: number } = {}
      
      cars.forEach((car: any) => {
        const brand = (car.name || '').split(' ')[0]
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      })

      return Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    } catch (error) {
      console.error('Error getting popular brands:', error)
      return []
    }
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    try {
      const expensesSnapshot = await getDocs(collection(db, 'expenses'))
      const expenses = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const categoryTotals: { [key: string]: number } = {}
      
      expenses.forEach((expense: any) => {
        const category = expense.category || 'other'
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0)
      })

      return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
    } catch (error) {
      console.error('Error getting category expenses:', error)
      return []
    }
  }

  async blockUser(userId: string): Promise<void> {
    console.log('Simple blocking user:', userId)
  }

  async sendNotification(title: string, message: string, onlyActive: boolean = false): Promise<void> {
    console.log('Simple sending notification:', { title, message, onlyActive })
  }

  async cleanupInactiveUsers(): Promise<number> {
    console.log('Simple cleaning up inactive users')
    return 1
  }
}

export const simpleAdminService = new SimpleAdminService()
