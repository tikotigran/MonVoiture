import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Простая проверка доступа к Firestore
export async function testFirestoreAccess() {
  try {
    console.log('🔍 Проверка доступа к Firestore...')
    
    // Проверяем авторизацию
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return { success: false, message: 'Пользователь не авторизован' }
    }
    
    console.log(`✅ Пользователь авторизован: ${currentUser.email}`)
    
    // Проверяем доступ к users
    try {
      console.log('🔍 Проверка доступа к users...')
      const usersSnapshot = await getDocs(collection(db, 'users'))
      console.log(`✅ Доступ к users: ${usersSnapshot.docs.length} документов`)
    } catch (usersError) {
      console.log('❌ Ошибка доступа к users:', usersError)
      return { success: false, message: `Ошибка доступа к users: ${usersError.message}` }
    }
    
    // Проверяем доступ к adminUsers
    try {
      console.log('🔍 Проверка доступа к adminUsers...')
      const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
      console.log(`✅ Доступ к adminUsers: ${adminUsersSnapshot.docs.length} документов`)
    } catch (adminUsersError) {
      console.log('❌ Ошибка доступа к adminUsers:', adminUsersError)
      return { success: false, message: `Ошибка доступа к adminUsers: ${adminUsersError.message}` }
    }
    
    // Проверяем доступ к конкретному документу
    try {
      if (currentUser) {
        console.log('🔍 Проверка доступа к своему профилю...')
        const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
        const profileSnap = await getDoc(profileRef)
        console.log(`✅ Доступ к профилю: ${profileSnap.exists() ? 'существует' : 'не существует'}`)
      }
    } catch (profileError) {
      console.log('❌ Ошибка доступа к профилю:', profileError)
      return { success: false, message: `Ошибка доступа к профилю: ${profileError.message}` }
    }
    
    console.log('✅ Все проверки доступа пройдены успешно')
    return { success: true, message: 'Доступ к Firestore работает нормально' }
    
  } catch (error) {
    console.error('❌ Общая ошибка проверки доступа:', error)
    return { success: false, message: `Общая ошибка: ${(error as Error).message}` }
  }
}

// Простая очистка adminUsers
export async function simpleCleanupAdminUsers() {
  try {
    console.log('🧹 Простая очистка adminUsers...')
    
    // Получаем все документы из adminUsers
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`📋 Найдено ${adminUsersSnapshot.docs.length} записей в adminUsers`)
    
    const ADMIN_USERS = ['tikjan1983@gmail.com']
    let deletedCount = 0
    let keptCount = 0
    
    // Удаляем по одному (без batch)
    for (const adminDoc of adminUsersSnapshot.docs) {
      const userData = adminDoc.data()
      const userEmail = userData.email || ''
      
      console.log(`🔍 Проверяем: ${userEmail}`)
      
      if (ADMIN_USERS.includes(userEmail)) {
        console.log(`✅ Администратор ${userEmail} - оставляем`)
        keptCount++
      } else {
        console.log(`🗑️ Обычный пользователь ${userEmail} - удаляем`)
        try {
          await deleteDoc(adminDoc.ref)
          deletedCount++
        } catch (deleteError) {
          console.log(`❌ Ошибка удаления ${userEmail}:`, deleteError)
        }
      }
    }
    
    console.log(`📊 Результат: удалено ${deletedCount}, оставлено ${keptCount}`)
    
    return {
      success: true,
      deletedCount,
      keptCount,
      message: `Очистка завершена: удалено ${deletedCount}, оставлено ${keptCount}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка очистки:', error)
    return {
      success: false,
      deletedCount: 0,
      keptCount: 0,
      message: `Ошибка очистки: ${(error as Error).message}`
    }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    testFirestoreAccess: typeof testFirestoreAccess
    simpleCleanupAdminUsers: typeof simpleCleanupAdminUsers
  }
}

if (typeof window !== 'undefined') {
  window.testFirestoreAccess = testFirestoreAccess
  window.simpleCleanupAdminUsers = simpleCleanupAdminUsers
}
