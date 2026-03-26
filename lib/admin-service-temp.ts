import { collection, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { type AdminStats, type AdminUser, type AdminCar, type PopularBrand, type CategoryExpense } from './admin-service-simple'

class TempAdminService {
  private getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        console.log('Current user:', user)
        console.log('Is admin?', user.email === 'tikjan1983@gmail.com')
        return user
      }
    }
    return null
  }

  async getStats(): Promise<AdminStats> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can access stats')
    }
    try {
      console.log('Loading admin stats...')
      
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

      console.log('Data loaded:', {
        users: users.length,
        cars: cars.length, 
        expenses: expenses.length
      })

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

      const avgCarPrice = cars.length > 0 
        ? cars.reduce((sum, car) => sum + car.purchasePrice, 0) / cars.length 
        : 0

      const stats = {
        totalUsers: users.length,
        totalCars: cars.length,
        totalExpenses,
        totalRevenue,
        activeUsers: users.length,
        newUsersThisMonth: thisMonthUsers.length,
        carsSoldThisMonth: thisMonthSoldCars.length,
        avgCarPrice,
        totalProfit,
        carsThisMonth: thisMonthCars.length
      }

      console.log('Admin stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('Error getting admin stats:', error)
      throw error
    }
  }

  async getUsers(): Promise<AdminUser[]> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can access users')
    }
    try {
      console.log('Loading admin users...')
      
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

      console.log('Users data loaded:', users.length)

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
          isActive: true,
          carCount: userCars.length,
          totalExpenses,
          totalInvested,
          carsSold,
          totalProfit
        }
      })
    } catch (error) {
      console.error('Error getting users:', error)
      throw error
    }
  }

  async getCars(): Promise<AdminCar[]> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can access cars')
    }
    try {
      console.log('Loading admin cars...')
      
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

      console.log('Cars data loaded:', cars.length)

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
      throw error
    }
  }

  async getPopularBrands(): Promise<PopularBrand[]> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can access analytics')
    }
    try {
      console.log('Loading popular brands...')
      
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

      const result = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      console.log('Popular brands loaded:', result.length)
      return result
    } catch (error) {
      console.error('Error getting popular brands:', error)
      throw error
    }
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can access analytics')
    }
    try {
      console.log('Loading category expenses...')
      
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

      const result = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      console.log('Category expenses loaded:', result.length)
      return result
    } catch (error) {
      console.error('Error getting category expenses:', error)
      throw error
    }
  }

  async blockUser(userId: string): Promise<void> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can block users')
    }

    console.log('Blocking user:', userId)
  }

  async sendNotification(title: string, message: string, onlyActive: boolean = false): Promise<void> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can send notifications')
    }

    console.log('Sending notification:', { title, message, onlyActive })
  }

  async cleanupInactiveUsers(): Promise<number> {
    const currentUser = this.getCurrentUser()
    
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      console.warn('Access denied: User is not admin', currentUser)
      throw new Error('Access denied: Only admin can cleanup users')
    }

    console.log('Cleaning up inactive users')
    return 1
  }
}

export const tempAdminService = new TempAdminService()
