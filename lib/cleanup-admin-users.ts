import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ADMIN_USERS } from '@/lib/user-roles'

// Очистка adminUsers - оставить только администраторов
export async function cleanupAdminUsers() {
  try {
    console.log('🧹 Очистка adminUsers - оставляем только администраторов...')
    
    // Получаем все документы из adminUsers
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`📋 Найдено ${adminUsersSnapshot.docs.length} записей в adminUsers`)
    
    const batch = writeBatch(db)
    let deletedCount = 0
    let keptCount = 0
    
    for (const adminDoc of adminUsersSnapshot.docs) {
      const userId = adminDoc.id
      const userData = adminDoc.data()
      const userEmail = userData.email || ''
      
      console.log(`🔍 Проверяем пользователя: ${userEmail} (${userId})`)
      
      // Проверяем является ли пользователь администратором
      if (ADMIN_USERS.includes(userEmail)) {
        console.log(`✅ Администратор ${userEmail} - оставляем в adminUsers`)
        keptCount++
      } else {
        console.log(`🗑️ Обычный пользователь ${userEmail} - удаляем из adminUsers`)
        batch.delete(adminDoc.ref)
        deletedCount++
      }
    }
    
    // Выполняем пакетное удаление
    if (deletedCount > 0) {
      await batch.commit()
      console.log(`✅ Удалено ${deletedCount} обычных пользователей из adminUsers`)
    } else {
      console.log(`ℹ️ Нечего удалять - все пользователи в adminUsers администраторы`)
    }
    
    console.log(`📊 Результат очистки adminUsers:`)
    console.log(`  🗑️ Удалено: ${deletedCount}`)
    console.log(`  ✅ Оставлено: ${keptCount}`)
    
    return {
      success: true,
      deletedCount,
      keptCount,
      message: `Очистка завершена. Удалено: ${deletedCount}, оставлено: ${keptCount}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка очистки adminUsers:', error)
    return {
      success: false,
      deletedCount: 0,
      keptCount: 0,
      message: `Ошибка очистки: ${(error as Error).message}`
    }
  }
}

// Проверка текущего состояния adminUsers
export async function checkAdminUsersStatus() {
  try {
    console.log('🔍 Проверка текущего состояния adminUsers...')
    
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    const usersSnapshot = await getDocs(collection(db, 'users'))
    
    console.log(`📊 Текущее состояние:`)
    console.log(`  👥 Всего пользователей в users: ${usersSnapshot.docs.length}`)
    console.log(`  👥 Всего записей в adminUsers: ${adminUsersSnapshot.docs.length}`)
    
    const adminUsersList = []
    const regularUsersInAdmin = []
    
    for (const adminDoc of adminUsersSnapshot.docs) {
      const userData = adminDoc.data()
      const userEmail = userData.email || ''
      
      if (ADMIN_USERS.includes(userEmail)) {
        adminUsersList.push(userEmail)
        console.log(`  ✅ Администратор: ${userEmail}`)
      } else {
        regularUsersInAdmin.push(userEmail)
        console.log(`  ❌ Обычный пользователь в adminUsers: ${userEmail}`)
      }
    }
    
    console.log(`\n📋 Итоги:`)
    console.log(`  ✅ Настоящие администраторы: ${adminUsersList.length}`)
    console.log(`  ❌ Обычные пользователи в adminUsers: ${regularUsersInAdmin.length}`)
    
    return {
      success: true,
      totalUsers: usersSnapshot.docs.length,
      totalAdminUsers: adminUsersSnapshot.docs.length,
      realAdmins: adminUsersList.length,
      regularUsersInAdmin: regularUsersInAdmin.length,
      adminUsersList,
      regularUsersInAdmin
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки состояния:', error)
    return {
      success: false,
      message: `Ошибка проверки: ${(error as Error).message}`
    }
  }
}

// Пересоздание adminUsers только для администраторов
export async function rebuildAdminUsers() {
  try {
    console.log('🔄 Пересоздание adminUsers только для администраторов...')
    
    // Сначала очищаем adminUsers
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    const batch = writeBatch(db)
    
    for (const adminDoc of adminUsersSnapshot.docs) {
      batch.delete(adminDoc.ref)
    }
    
    await batch.commit()
    console.log('🗑️ Старые записи adminUsers удалены')
    
    // Получаем всех пользователей из users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`👥 Найдено ${usersSnapshot.docs.length} пользователей в users`)
    
    const newBatch = writeBatch(db)
    let addedCount = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      
      // Проверяем профиль пользователя
      try {
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        const profileSnap = await getDoc(profileRef)
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data()
          const userEmail = profileData.email || ''
          
          // Если пользователь администратор, добавляем в adminUsers
          if (ADMIN_USERS.includes(userEmail)) {
            const adminUserRef = doc(db, 'adminUsers', userId)
            const adminUserData = {
              ...profileData,
              role: 'admin',
              isActive: true,
              promotedAt: new Date().toISOString(),
              promotedBy: 'system'
            }
            
            newBatch.set(adminUserRef, adminUserData)
            addedCount++
            console.log(`✅ Добавлен администратор: ${userEmail}`)
          }
        }
      } catch (profileError) {
        console.log(`❌ Ошибка получения профиля для ${userId}: ${profileError}`)
      }
    }
    
    if (addedCount > 0) {
      await newBatch.commit()
      console.log(`✅ Добавлено ${addedCount} администраторов в adminUsers`)
    } else {
      console.log(`ℹ️ Администраторы не найдены`)
    }
    
    return {
      success: true,
      addedCount,
      message: `Пересоздание завершено. Добавлено администраторов: ${addedCount}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка пересоздания adminUsers:', error)
    return {
      success: false,
      addedCount: 0,
      message: `Ошибка пересоздания: ${(error as Error).message}`
    }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    cleanupAdminUsers: typeof cleanupAdminUsers
    checkAdminUsersStatus: typeof checkAdminUsersStatus
    rebuildAdminUsers: typeof rebuildAdminUsers
  }
}

if (typeof window !== 'undefined') {
  window.cleanupAdminUsers = cleanupAdminUsers
  window.checkAdminUsersStatus = checkAdminUsersStatus
  window.rebuildAdminUsers = rebuildAdminUsers
}
