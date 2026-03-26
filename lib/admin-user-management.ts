import { collection, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Удаление пользователя и всех его данных
export async function deleteUserCompletely(userId: string) {
  try {
    console.log(`🗑️ Удаление пользователя ${userId} и всех его данных...`)
    
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
      deletedItems,
      userId
    }
    
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error)
    return {
      success: false,
      error: error.message,
      userId
    }
  }
}

// Удаление только из adminUsers (оставляем данные пользователя)
export async function deleteUserFromAdmin(userId: string) {
  try {
    console.log(`🗑️ Удаление пользователя ${userId} из adminUsers...`)
    
    const adminUserRef = doc(db, 'adminUsers', userId)
    await deleteDoc(adminUserRef)
    
    console.log(`✅ Пользователь ${userId} удален из adminUsers`)
    
    return {
      success: true,
      userId
    }
    
  } catch (error) {
    console.error('❌ Ошибка удаления из adminUsers:', error)
    return {
      success: false,
      error: error.message,
      userId
    }
  }
}

// Получение списка всех пользователей для выбора
export async function getAllUsersForDeletion() {
  try {
    console.log('📋 Получение списка всех пользователей...')
    
    const usersSnapshot = await getDocs(collection(db, 'adminUsers'))
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email || 'no email',
      firstName: doc.data().firstName || '',
      lastName: doc.data().lastName || '',
      garageName: doc.data().garageName || '',
      carCount: doc.data().carCount || 0,
      totalExpenses: doc.data().totalExpenses || 0,
      createdAt: doc.data().createdAt || ''
    }))
    
    console.log(`📋 Найдено ${users.length} пользователей`)
    
    return users
  } catch (error) {
    console.error('❌ Ошибка получения списка пользователей:', error)
    return []
  }
}

// Массовое удаление неактивных пользователей
export async function deleteInactiveUsers(daysInactive: number = 180) {
  try {
    console.log(`🗑️ Удаление неактивных пользователей (более ${daysInactive} дней)...`)
    
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
    } else {
      console.log(`ℹ️ Неактивных пользователей не найдено`)
    }
    
    return {
      success: true,
      deletedCount
    }
    
  } catch (error) {
    console.error('❌ Ошибка удаления неактивных пользователей:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    deleteUserCompletely: typeof deleteUserCompletely
    deleteUserFromAdmin: typeof deleteUserFromAdmin
    getAllUsersForDeletion: typeof getAllUsersForDeletion
    deleteInactiveUsers: typeof deleteInactiveUsers
  }
}

if (typeof window !== 'undefined') {
  window.deleteUserCompletely = deleteUserCompletely
  window.deleteUserFromAdmin = deleteUserFromAdmin
  window.getAllUsersForDeletion = getAllUsersForDeletion
  window.deleteInactiveUsers = deleteInactiveUsers
}
