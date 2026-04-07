import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

export interface AdminStats {
  totalUsers: number
  totalCars: number
  totalExpenses: number
  totalRevenue: number
  avgCarPrice: number
  activeUsers: number
  newUsers: number
  inactiveUsers: number
}

export interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  garageName?: string
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
  percentage: number
}

// Простой сервис который использует только users коллекцию
export class UsersOnlyAdminService {
  getCurrentUser() {
    return auth.currentUser
  }

  async getStats(): Promise<AdminStats> {
    try {
      console.log('📊 Loading stats from users/{userId}/cars structure...')
      
      // Получаем всех пользователей (ID документов в коллекции users)
      const usersSnapshot = await getDocs(collection(db, 'users'))
      console.log(`📋 Found ${usersSnapshot.docs.length} user folders`)

      let totalUsers = 0
      let totalCars = 0
      let totalExpenses = 0
      let totalRevenue = 0

      // Для каждого пользователя проверяем есть ли у него профиль и машины
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        
        // Проверяем есть ли профиль или настройки (это реальный пользователь)
        const [profileSnap, userInfoSnap] = await Promise.all([
          getDoc(doc(db, 'users', userId, 'profile', 'doc')),
          getDoc(doc(db, 'users', userId, 'settings', 'userInfo'))
        ])
        
        if (profileSnap.exists() || userInfoSnap.exists()) {
          totalUsers++
        }
        
        // Получаем машины пользователя из users/{userId}/cars
        const carsSnapshot = await getDocs(collection(db, 'users', userId, 'cars'))
        
        for (const carDoc of carsSnapshot.docs) {
          const carData = carDoc.data()
          
          // Пропускаем удаленные машины
          if (carData.deleted === true) continue
          
          totalCars++
          
          // Считаем расходы если они есть в машине
          if (carData.expenses && Array.isArray(carData.expenses)) {
            const carExpenses = carData.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
            totalExpenses += carExpenses
          }
          
          totalRevenue += (carData.purchasePrice || 0)
        }
      }

      const stats: AdminStats = {
        totalUsers,
        totalCars,
        totalExpenses,
        totalRevenue,
        avgCarPrice: totalCars > 0 ? totalRevenue / totalCars : 0,
        activeUsers: totalUsers,
        newUsers: 0,
        inactiveUsers: 0
      }

      console.log('✅ Stats loaded:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error getting stats:', error)
      throw error
    }
  }

  async getUsers(): Promise<AdminUser[]> {
    try {
      console.log('👥 Loading users from users/{userId}/profile structure...')
      
      // Получаем все папки пользователей
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users: AdminUser[] = []

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        
        // Получаем профиль и userInfo пользователя
        const [profileSnap, userInfoSnap] = await Promise.all([
          getDoc(doc(db, 'users', userId, 'profile', 'doc')),
          getDoc(doc(db, 'users', userId, 'settings', 'userInfo'))
        ])
        
        // Используем данные из userInfo или profile
        const profileData = userInfoSnap.exists() ? userInfoSnap.data() : (profileSnap.exists() ? profileSnap.data() : null)
        
        // Пропускаем если нет профиля (не реальный пользователь)
        if (!profileData) {
          console.log(`⚠️ User ${userId} has no profile, skipping`)
          continue
        }
        
        // Получаем машины пользователя из users/{userId}/cars
        const carsSnapshot = await getDocs(collection(db, 'users', userId, 'cars'))
        const userCars = carsSnapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
          .filter(car => car.deleted !== true)
        
        // Считаем статистику
        let totalExpenses = 0
        let totalInvested = 0
        let carsSold = 0
        let totalProfit = 0

        for (const car of userCars) {
          // Считаем расходы
          if (car.expenses && Array.isArray(car.expenses)) {
            const carExpenses = car.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
            totalExpenses += carExpenses
          }
          
          totalInvested += (car.purchasePrice || 0)
          
          if (car.status === 'sold' && car.salePrice) {
            carsSold++
            totalProfit += (car.salePrice - (car.purchasePrice || 0))
          }
        }

        const adminUser: AdminUser = {
          id: userId,
          email: profileData.email || 'unknown@example.com',
          firstName: profileData.firstName || profileData.name || 'Unknown',
          lastName: profileData.lastName || '',
          garageName: profileData.garageName || profileData.companyName || 'Unknown Garage',
          createdAt: profileData.createdAt || new Date().toISOString(),
          isActive: profileData.isActive !== false,
          carCount: userCars.length,
          totalExpenses,
          totalInvested,
          carsSold,
          totalProfit
        }

        users.push(adminUser)
        console.log(`✅ Loaded user: ${adminUser.email} with ${userCars.length} cars`)
      }

      console.log(`✅ Total loaded ${users.length} users`)
      return users
    } catch (error) {
      console.error('❌ Error getting users:', error)
      throw error
    }
  }

  async getCars(): Promise<AdminCar[]> {
    try {
      console.log('🚗 Loading cars from users/{userId}/cars structure...')
      
      // Получаем все папки пользователей
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const allCars: AdminCar[] = []

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        
        // Получаем данные пользователя для email и garageName
        const [profileSnap, userInfoSnap] = await Promise.all([
          getDoc(doc(db, 'users', userId, 'profile', 'doc')),
          getDoc(doc(db, 'users', userId, 'settings', 'userInfo'))
        ])
        
        const profileData = userInfoSnap.exists() ? userInfoSnap.data() : (profileSnap.exists() ? profileSnap.data() : null)
        const userEmail = profileData?.email || 'unknown@example.com'
        const garageName = profileData?.garageName || profileData?.companyName
        
        // Получаем машины пользователя
        const carsSnapshot = await getDocs(collection(db, 'users', userId, 'cars'))

        for (const carDoc of carsSnapshot.docs) {
          const carData = carDoc.data() as any
          
          // Пропускаем удаленные машины
          if (carData.deleted === true) continue
          
          let totalExpenses = 0
          let expensesCount = 0
          
          if (carData.expenses && Array.isArray(carData.expenses)) {
            expensesCount = carData.expenses.length
            totalExpenses = carData.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
          }

          const profit = carData.status === 'sold' && carData.salePrice 
            ? carData.salePrice - (carData.purchasePrice || 0)
            : undefined

          const adminCar: AdminCar = {
            id: carDoc.id,
            userId: userId,
            userEmail,
            garageName,
            name: carData.name || 'Unknown Car',
            purchasePrice: carData.purchasePrice || 0,
            salePrice: carData.salePrice,
            status: carData.status || 'active',
            createdAt: carData.createdAt instanceof Date ? carData.createdAt.toISOString() : carData.createdAt || '',
            profit,
            expensesCount,
            totalExpenses
          }

          allCars.push(adminCar)
        }
      }

      console.log(`✅ Loaded ${allCars.length} cars from all users`)
      return allCars
    } catch (error) {
      console.error('❌ Error getting cars:', error)
      throw error
    }
  }

  async getPopularBrands(): Promise<PopularBrand[]> {
    try {
      console.log('🏆 Loading popular brands...')
      
      const cars = await this.getCars()
      const brandCounts: { [key: string]: number } = {}
      
      cars.forEach((car: AdminCar) => {
        const brand = (car.name || '').split(' ')[0]
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      })

      const result = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      console.log(`✅ Loaded ${result.length} popular brands`)
      return result
    } catch (error) {
      console.error('❌ Error getting popular brands:', error)
      throw error
    }
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    try {
      console.log('💰 Loading category expenses...')
      
      const cars = await this.getCars()
      const categoryTotals: { [key: string]: number } = {}
      
      cars.forEach((car: AdminCar) => {
        // Здесь можно добавить логику категорий расходов
        // Пока используем общую сумму
        categoryTotals['Общие расходы'] = (categoryTotals['Общие расходы'] || 0) + car.totalExpenses
      })

      const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
      
      const result = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)

      console.log(`✅ Loaded ${result.length} expense categories`)
      return result
    } catch (error) {
      console.error('❌ Error getting category expenses:', error)
      throw error
    }
  }

  // Простые методы управления пользователями
  async deleteUser(userId: string): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🗑️ Deleting user ${userId} and all data...`)
      
      const batch = writeBatch(db)
      let deletedCount = 0

      // Удаляем профиль
      try {
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        batch.delete(profileRef)
        deletedCount++
      } catch (error) {
        console.log(`⚠️ Error deleting profile: ${error}`)
      }

      // Удаляем машины
      try {
        const carsRef = collection(db, 'users', userId, 'cars')
        const carsSnapshot = await getDocs(carsRef)
        
        for (const carDoc of carsSnapshot.docs) {
          batch.delete(carDoc.ref)
          deletedCount++
        }
      } catch (error) {
        console.log(`⚠️ Error deleting cars: ${error}`)
      }

      // Удаляем другие коллекции
      const collections = ['documents', 'settings', 'notifications']
      for (const collectionName of collections) {
        try {
          const collRef = collection(db, 'users', userId, collectionName)
          const collSnapshot = await getDocs(collRef)
          
          for (const docSnap of collSnapshot.docs) {
            batch.delete(docSnap.ref)
            deletedCount++
          }
        } catch (error) {
          console.log(`⚠️ Error deleting ${collectionName}: ${error}`)
        }
      }

      // Выполняем удаление
      await batch.commit()
      
      return {
        success: true,
        message: `Пользователь и все данные удалены (${deletedCount} элементов)`
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      return {
        success: false,
        message: `Ошибка удаления: ${(error as Error).message}`
      }
    }
  }

  async blockUser(userId: string): Promise<{success: boolean, message: string}> {
    // Блокировка через профиль
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      await updateDoc(profileRef, {
        isActive: false,
        blockedAt: new Date().toISOString()
      })
      
      return { success: true, message: 'Пользователь заблокирован' }
    } catch (error) {
      return { success: false, message: `Ошибка блокировки: ${(error as Error).message}` }
    }
  }

  async unblockUser(userId: string): Promise<{success: boolean, message: string}> {
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      await updateDoc(profileRef, {
        isActive: true,
        blockedAt: null
      })
      
      return { success: true, message: 'Пользователь разблокирован' }
    } catch (error) {
      return { success: false, message: `Ошибка разблокировки: ${(error as Error).message}` }
    }
  }

  async sendNotification(userId: string, title: string, message: string): Promise<{success: boolean, message: string}> {
    try {
      const notificationsRef = doc(collection(db, 'users', userId, 'notifications'))
      await setDoc(notificationsRef, {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false
      })
      
      return { success: true, message: 'Уведомление отправлено' }
    } catch (error) {
      return { success: false, message: `Ошибка отправки: ${(error as Error).message}` }
    }
  }

  async cleanupInactiveUsers(daysInactive: number = 180): Promise<{success: boolean, message: string, deletedCount?: number}> {
    try {
      console.log(`🧹 Cleaning up inactive users (${daysInactive} days)...`)
      
      const users = await this.getUsers()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)
      
      const batch = writeBatch(db)
      let deletedCount = 0
      
      for (const user of users) {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(user.createdAt)
        
        if (lastLogin < cutoffDate) {
          // Удаляем неактивного пользователя
          const profileRef = doc(db, 'users', user.id, 'profile', 'doc')
          batch.delete(profileRef)
          deletedCount++
        }
      }
      
      if (deletedCount > 0) {
        await batch.commit()
      }
      
      return {
        success: true,
        message: `Очистка завершена. Удалено: ${deletedCount}`,
        deletedCount
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка очистки: ${(error as Error).message}`
      }
    }
  }
}

export const usersOnlyAdminService = new UsersOnlyAdminService()
