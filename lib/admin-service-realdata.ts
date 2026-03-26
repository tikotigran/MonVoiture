import { collection, getDocs, Timestamp, doc, deleteDoc, writeBatch, updateDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { type AdminStats, type AdminUser, type AdminCar, type PopularBrand, type CategoryExpense } from './admin-service-simple'

class RealDataAdminService {
  private getCurrentUser() {
    return auth.currentUser
  }

  async getStats(): Promise<AdminStats> {
    try {
      console.log('Loading REAL admin stats...')
      console.log('🔍 Firebase db:', db)
      console.log('🔍 Firebase app:', db.app)
      console.log('🔍 Current user:', this.getCurrentUser())
      
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        console.error('❌ No authenticated user')
        throw new Error('User not authenticated')
      }
      
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Получаем ВСЕХ пользователей из корневой коллекции adminUsers
      console.log('🔍 Getting adminUsers collection...')
      const usersSnapshot = await getDocs(collection(db, 'adminUsers'))
      console.log('🔍 Users snapshot:', usersSnapshot)
      console.log('🔍 Users docs count:', usersSnapshot.docs.length)
      console.log('🔍 Users metadata:', usersSnapshot.metadata)
      
      if (usersSnapshot.docs.length > 0) {
        console.log('🔍 First few user IDs:')
        usersSnapshot.docs.slice(0, 5).forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.id} - ${doc.data().email || 'no email'}`)
        })
      }
      
      // Получаем все машины из ВСЕХ пользователей
      let allCars: any[] = []
      let allExpenses: any[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        console.log(`🔍 Getting cars for user: ${userId}`)
        
        // Проверяем машины пользователя
        try {
          const carsRef = collection(db, 'users', userId, 'cars')
          const carsSnapshot = await getDocs(carsRef)
          console.log(`🔍 Cars for user ${userId}:`, carsSnapshot.docs.length)
          
          const userCars = carsSnapshot.docs.map(doc => ({
            id: doc.id,
            userId: userId,
            userEmail: userDoc.data().email || '',
            garageName: userDoc.data().garageName || '',
            ...(doc.data() as any)
          }))
          
          allCars.push(...userCars)
          
          // Получаем расходы для каждой машины (вложенные в данные машины)
          for (const car of userCars) {
            if (car.expenses && Array.isArray(car.expenses)) {
              const carExpenses = car.expenses.map((expense: any, index: number) => ({
                id: `${car.id}_expense_${index}`,
                carId: car.id,
                userId: userId,
                ...(expense as any)
              }))
              allExpenses.push(...carExpenses)
              console.log(`🔍 Found ${carExpenses.length} expenses in car data for ${car.id}`)
            }
          }
        } catch (error) {
          console.log(`🔍 No cars collection for user ${userId}`)
        }
      }
      
      console.log('🔍 All cars loaded:', allCars.length)
      console.log('🔍 All expenses loaded:', allExpenses.length)

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))

      const cars = allCars
      const expenses = allExpenses

      console.log('🔥 REAL DATA loaded:', {
        users: users.length,
        cars: cars.length, 
        expenses: expenses.length
      })

      // Расчеты
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      const totalRevenue = cars
        .filter((car: any) => car.salePrice)
        .reduce((sum: number, car: any) => sum + (car.salePrice || 0), 0)
      
      const totalProfit = cars
        .filter((car: any) => car.salePrice && car.purchasePrice)
        .reduce((sum: number, car: any) => sum + ((car.salePrice || 0) - car.purchasePrice), 0)

      const thisMonthCars = cars.filter((car: any) => {
        const carDate = car.createdAt instanceof Timestamp ? car.createdAt.toDate() : new Date(car.createdAt || '')
        return carDate >= firstDayOfMonth
      })

      const thisMonthSoldCars = cars.filter((car: any) => {
        if (!car.saleDate) return false
        const saleDate = car.saleDate instanceof Timestamp ? car.saleDate.toDate() : new Date(car.saleDate || '')
        return saleDate >= firstDayOfMonth
      })

      const thisMonthUsers = users.filter((user: any) => {
        const userDate = user.createdAt instanceof Timestamp ? user.createdAt.toDate() : new Date(user.createdAt || '')
        return userDate >= firstDayOfMonth
      })

      const avgCarPrice = cars.length > 0 
        ? cars.reduce((sum: number, car: any) => sum + car.purchasePrice, 0) / cars.length 
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

      console.log('🔥 REAL STATS calculated:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error getting REAL admin stats:', error)
      throw error
    }
  }

  async getUsers(): Promise<AdminUser[]> {
    try {
      console.log('Loading REAL admin users...')
      
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        console.error('❌ No authenticated user')
        throw new Error('User not authenticated')
      }
      
      // Получаем ВСЕХ пользователей из корневой коллекции adminUsers
      const usersSnapshot = await getDocs(collection(db, 'adminUsers'))
      console.log('🔥 REAL USERS found:', usersSnapshot.docs.length)

      // Преобразуем данные пользователей в формат AdminUser
      const result: AdminUser[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        
        result.push({
          id: userDoc.id,
          email: userData.email || '',
          garageName: userData.garageName || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          createdAt: userData.createdAt || '',
          lastLogin: userData.lastLogin || '',
          isActive: userData.isActive !== false,
          carCount: userData.carCount || 0,
          totalExpenses: userData.totalExpenses || 0,
          totalInvested: userData.totalInvested || 0,
          carsSold: userData.carsSold || 0,
          totalProfit: userData.totalProfit || 0
        })
      }
      
      console.log('🔥 REAL USERS loaded:', result.length)
      return result
    } catch (error) {
      console.error('❌ Error getting REAL users:', error)
      throw error
    }
  }

  async getCars(): Promise<AdminCar[]> {
    try {
      console.log('Loading REAL admin cars...')
      
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        console.error('❌ No authenticated user')
        throw new Error('User not authenticated')
      }

      // Получаем ВСЕХ пользователей из adminUsers
      const usersSnapshot = await getDocs(collection(db, 'adminUsers'))
      console.log('🔍 Found users:', usersSnapshot.docs.length)

      // Получаем все машины из ВСЕХ пользователей
      let allCars: any[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        console.log(`🔍 Getting cars for user: ${userId}`)
        
        try {
          const carsRef = collection(db, 'users', userId, 'cars')
          const carsSnapshot = await getDocs(carsRef)
          const userCars = carsSnapshot.docs.map(doc => ({
            id: doc.id,
            userId: userId,
            userEmail: userDoc.data().email || '',
            garageName: userDoc.data().garageName || '',
            ...(doc.data() as any)
          }))
          
          allCars.push(...userCars)
          console.log(`🔍 Found ${userCars.length} cars for user ${userId}`)
        } catch (error) {
          console.log(`🔍 No cars for user ${userId}`)
        }
      }

      console.log('🔥 REAL CARS loaded:', allCars.length)

      return allCars.map((car: any) => {
        // Считаем расходы из данных машины (как на сайте)
        let expensesCount = 0
        let totalExpenses = 0
        
        if (car.expenses && Array.isArray(car.expenses)) {
          expensesCount = car.expenses.length
          totalExpenses = car.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
          console.log(`🔍 Found ${expensesCount} expenses in car data for ${car.id}`)
        }
        
        const profit = car.salePrice ? car.salePrice - (car.purchasePrice || 0) : undefined

        return {
          id: car.id,
          userId: car.userId,
          userEmail: car.userEmail || '',
          garageName: car.garageName,
          name: car.name || '',
          purchasePrice: car.purchasePrice || 0,
          salePrice: car.salePrice,
          status: car.status || 'active',
          createdAt: car.createdAt instanceof Timestamp ? car.createdAt.toISOString() : car.createdAt || '',
          profit,
          expensesCount,
          totalExpenses
        }
      })
    } catch (error) {

async getPopularBrands(): Promise<PopularBrand[]> {
try {
console.log('Loading REAL popular brands...')
  
const currentUser = this.getCurrentUser()
if (!currentUser) {
console.error(' No authenticated user')
throw new Error('User not authenticated')
}

// 
const usersSnapshot = await getDocs(collection(db, 'users'))
console.log(' Found users:', usersSnapshot.docs.length)

// 
let allCars: any[] = []
  
for (const userDoc of usersSnapshot.docs) {
const userId = userDoc.id
  
try {
const carsRef = collection(db, 'users', userId, 'cars')
const carsSnapshot = await getDocs(carsRef)
const userCars = carsSnapshot.docs.map(doc => ({
id: doc.id,
...(doc.data() as any)
}))
  
allCars.push(...userCars)
} catch (error) {
console.log(` No cars for user ${userId}`)
}
}

const brandCounts: { [key: string]: number } = {}
  
allCars.forEach((car: any) => {
const brand = (car.name || '').split(' ')[0]
brandCounts[brand] = (brandCounts[brand] || 0) + 1
})

const result = Object.entries(brandCounts)
.map(([brand, count]) => ({ brand, count }))
.sort((a, b) => b.count - a.count)
.slice(0, 10)

console.log(' REAL BRANDS loaded:', result.length)
return result
} catch (error) {
console.error(' Error getting REAL popular brands:', error)
throw error
}
}

async getCategoryExpenses(): Promise<CategoryExpense[]> {
try {
console.log('Loading REAL category expenses...')
  
const currentUser = this.getCurrentUser()
if (!currentUser) {
console.error(' No authenticated user')
throw new Error('User not authenticated')
}
    try {
      console.log('Loading REAL category expenses...')
      
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        console.error('❌ No authenticated user')
        throw new Error('User not authenticated')
      }

      // Получаем ВСЕХ пользователей
      const usersSnapshot = await getDocs(collection(db, 'users'))
      console.log('🔍 Found users:', usersSnapshot.docs.length)

      // Получаем все расходы из ВСЕХ пользователей
      let allExpenses: any[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        
        try {
          const carsRef = collection(db, 'users', userId, 'cars')
          const carsSnapshot = await getDocs(carsRef)
          const userCars = carsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          }))
          
          // Получаем расходы для каждой машины (из данных машины)
          for (const car of userCars) {
            if (car.expenses && Array.isArray(car.expenses)) {
              const carExpenses = car.expenses.map((expense: any) => ({
                carId: car.id,
                userId: userId,
                ...(expense as any)
              }))
              allExpenses.push(...carExpenses)
              console.log(`🔍 Found ${carExpenses.length} expenses in car data for ${car.id}`)
            }
          }
        } catch (error) {
          console.log(`🔍 No cars for user ${userId}`)
        }
      }

      const categoryTotals: { [key: string]: number } = {}
      
      allExpenses.forEach((expense: any) => {
        const category = expense.category || 'other'
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0)
      })

      const result = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      console.log('🔥 REAL CATEGORIES loaded:', result.length)
      return result
    } catch (error) {
      console.error('❌ Error getting REAL category expenses:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Удаление пользователя ${userId}...`)
      
      const batch = writeBatch(db)
      let deletedItems = 0
      
      // 1. Удаляем из adminUsers
      try {
        const adminUserRef = doc(db, 'adminUsers', userId)
        batch.delete(adminUserRef)
        deletedItems++
        console.log(`  🗑️ Будет удален из adminUsers`)
      } catch (error) {
        console.log(`  ❌ Ошибка удаления из adminUsers: ${error}`)
      }
      
      // 2. Удаляем профиль пользователя
      try {
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        batch.delete(profileRef)
        deletedItems++
        console.log(`  🗑️ Будет удален профиль`)
      } catch (error) {
        console.log(`  ❌ Ошибка удаления профиля: ${error}`)
      }
      
      // 3. Удаляем все машины пользователя
      try {
        const carsRef = collection(db, 'users', userId, 'cars')
        const carsSnapshot = await getDocs(carsRef)
        
        for (const carDoc of carsSnapshot.docs) {
          // Удаляем саму машину
          batch.delete(carDoc.ref)
          deletedItems++
          console.log(`  🗑️ Будет удалена машина: ${carDoc.id}`)
          
          // Удаляем расходы машины (если они в отдельной коллекции)
          try {
            const expensesRef = collection(db, 'users', userId, 'cars', carDoc.id, 'expenses')
            const expensesSnapshot = await getDocs(expensesRef)
            
            for (const expenseDoc of expensesSnapshot.docs) {
              batch.delete(expenseDoc.ref)
              deletedItems++
              console.log(`    🗑️ Будет удален расход: ${expenseDoc.id}`)
            }
          } catch (expenseError) {
            console.log(`    ❌ Ошибка удаления расходов машины ${carDoc.id}: ${expenseError}`)
          }
        }
      } catch (error) {
        console.log(`  ❌ Ошибка удаления машин: ${error}`)
      }
      
      // 4. Удаляем документы пользователя
      try {
        const docsRef = collection(db, 'users', userId, 'documents')
        const docsSnapshot = await getDocs(docsRef)
        
        for (const docDoc of docsSnapshot.docs) {
          batch.delete(docDoc.ref)
          deletedItems++
          console.log(`  🗑️ Будет удален документ: ${docDoc.id}`)
        }
      } catch (error) {
        console.log(`  ❌ Ошибка удаления документов: ${error}`)
      }
      
      // 5. Удаляем настройки пользователя
      try {
        const settingsRef = collection(db, 'users', userId, 'settings')
        const settingsSnapshot = await getDocs(settingsRef)
        
        for (const settingDoc of settingsSnapshot.docs) {
          batch.delete(settingDoc.ref)
          deletedItems++
          console.log(`  🗑️ Будет удалена настройка: ${settingDoc.id}`)
        }
      } catch (error) {
        console.log(`  ❌ Ошибка удаления настроек: ${error}`)
      }
      
      // Выполняем пакетное удаление
      await batch.commit()
      
      console.log(`✅ Удаление завершено! Удалено элементов: ${deletedItems}`)
      
      return {
        success: true,
        message: `Пользователь и все его данные удалены. Удалено элементов: ${deletedItems}`
      }
      
    } catch (error) {
      console.error('❌ Ошибка удаления пользователя:', error)
      return {
        success: false,
        message: `Ошибка удаления: ${error.message}`
      }
    }
  }

  async blockUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔒 Блокировка пользователя ${userId}...`)
      
      // Обновляем статус в adminUsers
      const adminUserRef = doc(db, 'adminUsers', userId)
      await updateDoc(adminUserRef, {
        isActive: false,
        blockedAt: new Date().toISOString(),
        blockedBy: this.getCurrentUser()?.email || 'admin'
      })
      
      console.log(`✅ Пользователь ${userId} заблокирован`)
      
      return {
        success: true,
        message: 'Пользователь успешно заблокирован'
      }
    } catch (error) {
      console.error('❌ Ошибка блокировки пользователя:', error)
      return {
        success: false,
        message: `Ошибка блокировки: ${error.message}`
      }
    }
  }

  async unblockUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔓 Разблокировка пользователя ${userId}...`)
      
      // Обновляем статус в adminUsers
      const adminUserRef = doc(db, 'adminUsers', userId)
      await updateDoc(adminUserRef, {
        isActive: true,
        blockedAt: null,
        blockedBy: null,
        unblockedAt: new Date().toISOString(),
        unblockedBy: this.getCurrentUser()?.email || 'admin'
      })
      
      console.log(`✅ Пользователь ${userId} разблокирован`)
      
      return {
        success: true,
        message: 'Пользователь успешно разблокирован'
      }
    } catch (error) {
      console.error('❌ Ошибка разблокировки пользователя:', error)
      return {
        success: false,
        message: `Ошибка разблокировки: ${error.message}`
      }
    }
  }

  async sendNotification(userId: string, title: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 Отправка уведомления пользователю ${userId}...`)
      
      // Сохраняем уведомление в коллекцию уведомлений пользователя
      const notificationRef = doc(collection(db, 'users', userId, 'notifications'))
      await setDoc(notificationRef, {
        id: notificationRef.id,
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
        sentBy: this.getCurrentUser()?.email || 'admin'
      })
      
      console.log(`✅ Уведомление отправлено пользователю ${userId}`)
      
      return {
        success: true,
        message: 'Уведомление успешно отправлено'
      }
    } catch (error) {
      console.error('❌ Ошибка отправки уведомления:', error)
      return {
        success: false,
        message: `Ошибка отправки: ${error.message}`
      }
    }
  }

  async cleanupInactiveUsers(daysInactive: number = 180): Promise<{ success: boolean; message: string; deletedCount?: number }> {
    try {
      console.log(`🧹 Очистка неактивных пользователей (более ${daysInactive} дней)...`)
      
      const usersSnapshot = await getDocs(collection(db, 'adminUsers'))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)
      
      const batch = writeBatch(db)
      let deletedCount = 0
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        const lastLogin = userData.lastLogin ? new Date(userData.lastLogin) : new Date(userData.createdAt)
        
        if (lastLogin < cutoffDate) {
          batch.delete(userDoc.ref)
          deletedCount++
          console.log(`🗑️ Будет удален неактивный пользователь: ${userData.email || userDoc.id}`)
        }
      }
      
      if (deletedCount > 0) {
        await batch.commit()
        console.log(`✅ Удалено ${deletedCount} неактивных пользователей`)
        
        return {
          success: true,
          message: `Удалено ${deletedCount} неактивных пользователей`,
          deletedCount
        }
      } else {
        console.log(`ℹ️ Неактивных пользователей не найдено`)
        
        return {
          success: true,
          message: 'Неактивных пользователей не найдено',
          deletedCount: 0
        }
      }
      
    } catch (error) {
      console.error('❌ Ошибка очистки неактивных пользователей:', error)
      return {
        success: false,
        message: `Ошибка очистки: ${(error as Error).message}`
      }
    }
  }
}

export const realDataAdminService = new RealDataAdminService()
