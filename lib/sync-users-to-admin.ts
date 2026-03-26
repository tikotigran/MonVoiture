import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Синхронизация всех пользователей из users в adminUsers
export async function syncAllUsersToAdmin() {
  try {
    console.log('🔄 Синхронизация пользователей из users в adminUsers...')
    
    // Получаем всех пользователей из users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`📋 Найдено ${usersSnapshot.docs.length} пользователей в users`)
    
    const batch = writeBatch(db)
    let syncedCount = 0
    let errorCount = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      
      try {
        // Получаем профиль пользователя
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        const profileSnap = await getDoc(profileRef)
        
        let userData = {
          email: 'unknown@example.com',
          firstName: 'Unknown',
          lastName: 'User',
          garageName: 'Unknown Garage',
          createdAt: new Date().toISOString()
        }
        
        if (profileSnap.exists()) {
          userData = { ...userData, ...profileSnap.data() }
          console.log(`✅ Найден профиль для: ${userData.email}`)
        } else {
          console.log(`⚠️ Профиль не найден для пользователя: ${userId}`)
        }
        
        // Получаем количество машин
        let carCount = 0
        let totalExpenses = 0
        
        try {
          const carsRef = collection(db, 'users', userId, 'cars')
          const carsSnapshot = await getDocs(carsRef)
          carCount = carsSnapshot.docs.length
          
          // Считаем расходы
          for (const carDoc of carsSnapshot.docs) {
            const carData = carDoc.data()
            if (carData.expenses && Array.isArray(carData.expenses)) {
              totalExpenses += carData.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
            }
          }
          
          console.log(`  🚗 Найдено ${carCount} машин, расходов: ${totalExpenses} EUR`)
        } catch (carsError) {
          console.log(`  ❌ Ошибка получения машин: ${carsError}`)
        }
        
        // Создаем/обновляем запись в adminUsers
        const adminUserRef = doc(db, 'adminUsers', userId)
        const adminUserData = {
          ...userData,
          id: userId,
          carCount,
          totalExpenses,
          isActive: true,
          syncedAt: new Date().toISOString(),
          syncedBy: 'sync-function',
          role: 'user' // Все пользователи как обычные
        }
        
        batch.set(adminUserRef, adminUserData)
        syncedCount++
        console.log(`✅ Добавлен в adminUsers: ${userData.email}`)
        
      } catch (userError) {
        console.log(`❌ Ошибка обработки пользователя ${userId}: ${userError}`)
        errorCount++
      }
    }
    
    // Выполняем пакетную запись
    await batch.commit()
    
    console.log(`🎉 Синхронизация завершена!`)
    console.log(`✅ Синхронизировано: ${syncedCount}`)
    console.log(`❌ Ошибок: ${errorCount}`)
    
    return {
      success: true,
      syncedCount,
      errorCount,
      message: `Синхронизировано пользователей: ${syncedCount}, ошибок: ${errorCount}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error)
    return {
      success: false,
      syncedCount: 0,
      errorCount: 0,
      message: `Ошибка синхронизации: ${(error as Error).message}`
    }
  }
}

// Быстрая синхронизация только базовых данных
export async function quickSyncUsers() {
  try {
    console.log('⚡ Быстрая синхронизация пользователей...')
    
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`📋 Найдено ${usersSnapshot.docs.length} пользователей`)
    
    const batch = writeBatch(db)
    let count = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      
      // Создаем минимальную запись в adminUsers
      const adminUserRef = doc(db, 'adminUsers', userId)
      const basicData = {
        id: userId,
        email: `user-${userId.slice(0, 8)}@example.com`,
        firstName: 'User',
        lastName: `${userId.slice(0, 6)}`,
        garageName: 'User Garage',
        carCount: 0,
        totalExpenses: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
        role: 'user'
      }
      
      batch.set(adminUserRef, basicData)
      count++
    }
    
    await batch.commit()
    
    console.log(`✅ Быстрая синхронизация завершена: ${count} пользователей`)
    
    return {
      success: true,
      count,
      message: `Быстро синхронизировано: ${count} пользователей`
    }
    
  } catch (error) {
    console.error('❌ Ошибка быстрой синхронизации:', error)
    return {
      success: false,
      count: 0,
      message: `Ошибка: ${(error as Error).message}`
    }
  }
}

// Обновление данных существующих пользователей
export async function updateExistingUsers() {
  try {
    console.log('🔄 Обновление существующих пользователей в adminUsers...')
    
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    
    // Создаем Set существующих adminUsers
    const existingAdminUsers = new Set(adminUsersSnapshot.docs.map(doc => doc.id))
    
    const batch = writeBatch(db)
    let updatedCount = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      
      if (existingAdminUsers.has(userId)) {
        // Обновляем существующего пользователя
        
        try {
          // Получаем актуальные данные
          const profileRef = doc(db, 'users', userId, 'profile', 'doc')
          const profileSnap = await getDoc(profileRef)
          
          let userData = {}
          if (profileSnap.exists()) {
            userData = profileSnap.data()
          }
          
          // Получаем актуальные данные о машинах
          let carCount = 0
          let totalExpenses = 0
          
          try {
            const carsRef = collection(db, 'users', userId, 'cars')
            const carsSnapshot = await getDocs(carsRef)
            carCount = carsSnapshot.docs.length
            
            for (const carDoc of carsSnapshot.docs) {
              const carData = carDoc.data()
              if (carData.expenses && Array.isArray(carData.expenses)) {
                totalExpenses += carData.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
              }
            }
          } catch (carsError) {
            // Игнорируем ошибки
          }
          
          // Обновляем запись в adminUsers
          const adminUserRef = doc(db, 'adminUsers', userId)
          const updatedData = {
            ...userData,
            carCount,
            totalExpenses,
            updatedAt: new Date().toISOString(),
            updatedBy: 'sync-update'
          }
          
          batch.update(adminUserRef, updatedData)
          updatedCount++
          
        } catch (updateError) {
          console.log(`❌ Ошибка обновления ${userId}: ${updateError}`)
        }
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit()
      console.log(`✅ Обновлено пользователей: ${updatedCount}`)
    }
    
    return {
      success: true,
      updatedCount,
      message: `Обновлено пользователей: ${updatedCount}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка обновления:', error)
    return {
      success: false,
      updatedCount: 0,
      message: `Ошибка: ${(error as Error).message}`
    }
  }
}

// Добавляем в window
declare global {
  interface Window {
    syncAllUsersToAdmin: typeof syncAllUsersToAdmin
    quickSyncUsers: typeof quickSyncUsers
    updateExistingUsers: typeof updateExistingUsers
  }
}

if (typeof window !== 'undefined') {
  window.syncAllUsersToAdmin = syncAllUsersToAdmin
  window.quickSyncUsers = quickSyncUsers
  window.updateExistingUsers = updateExistingUsers
}
