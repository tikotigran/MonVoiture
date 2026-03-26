import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { deleteUser as deleteAuthUser } from 'firebase/auth'

// ПОЛНОЕ удаление пользователя из ВСЕХ мест
export async function deleteUserCompletelyEverywhere(userEmail: string) {
  try {
    console.log(`🗑️ ПОЛНОЕ удаление пользователя ${userEmail} из ВСЕХ мест...`)
    
    let deletedItems = 0
    let authDeleted = false
    let userId = null
    
    // Шаг 1: Находим ID пользователя в adminUsers
    try {
      const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
      const userDoc = adminUsersSnapshot.docs.find(doc => 
        doc.data().email === userEmail
      )
      
      if (userDoc) {
        userId = userDoc.id
        console.log(`🔍 Найден пользователь в adminUsers: ${userId}`)
      } else {
        console.log(`❌ Пользователь ${userEmail} не найден в adminUsers`)
      }
    } catch (error) {
      console.log(`❌ Ошибка поиска в adminUsers: ${error}`)
    }
    
    // Шаг 2: Если не нашли в adminUsers, ищем в users по профилю
    if (!userId) {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        for (const userDoc of usersSnapshot.docs) {
          try {
            const profileRef = doc(db, 'users', userDoc.id, 'profile', 'doc')
            const profileSnap = await getDoc(profileRef)
            
            if (profileSnap.exists() && profileSnap.data().email === userEmail) {
              userId = userDoc.id
              console.log(`🔍 Найден пользователь в users: ${userId}`)
              break
            }
          } catch (profileError) {
            // Продолжаем поиск
          }
        }
        
        if (!userId) {
          return {
            success: false,
            message: `Пользователь ${userEmail} не найден ни в adminUsers, ни в users`
          }
        }
      } catch (error) {
        console.log(`❌ Ошибка поиска в users: ${error}`)
      }
    }
    
    console.log(`🎯 Начинаем полное удаление пользователя ${userId} (${userEmail})`)
    
    const batch = writeBatch(db)
    
    // Шаг 3: Удаляем из adminUsers
    try {
      const adminUserRef = doc(db, 'adminUsers', userId)
      batch.delete(adminUserRef)
      deletedItems++
      console.log(`  🗑️ Будет удален из adminUsers`)
    } catch (error) {
      console.log(`  ❌ Ошибка удаления из adminUsers: ${error}`)
    }
    
    // Шаг 4: Удаляем профиль пользователя
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      batch.delete(profileRef)
      deletedItems++
      console.log(`  🗑️ Будет удален профиль`)
    } catch (error) {
      console.log(`  ❌ Ошибка удаления профиля: ${error}`)
    }
    
    // Шаг 5: Удаляем все машины пользователя
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
    
    // Шаг 6: Удаляем документы пользователя
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
    
    // Шаг 7: Удаляем настройки пользователя
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
    
    // Шаг 8: Удаляем уведомления пользователя
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications')
      const notificationsSnapshot = await getDocs(notificationsRef)
      
      for (const notifDoc of notificationsSnapshot.docs) {
        batch.delete(notifDoc.ref)
        deletedItems++
        console.log(`  🗑️ Будет удалено уведомление: ${notifDoc.id}`)
      }
    } catch (error) {
      console.log(`  ❌ Ошибка удаления уведомлений: ${error}`)
    }
    
    // Шаг 9: Выполняем пакетное удаление из Firestore
    await batch.commit()
    console.log(`✅ Удалено из Firestore: ${deletedItems} элементов`)
    
    // Шаг 10: Удаляем из Firebase Authentication
    try {
      // Сначала нужно получить пользователя по email
      const currentUser = auth.currentUser
      if (currentUser && currentUser.email === userEmail) {
        // Нельзя удалить текущего авторизованного пользователя
        console.log(`⚠️ Нельзя удалить текущего авторизованного пользователя ${userEmail}`)
        return {
          success: false,
          message: `Нельзя удалить текущего авторизованного пользователя. Выйдите из аккаунта и попробуйте снова.`,
          deletedItems,
          authDeleted: false
        }
      }
      
      // Для удаления другого пользователя нужны права админа
      // Это сложный процесс, требующий Admin SDK
      console.log(`⚠️ Удаление из Authentication требует Firebase Admin SDK`)
      console.log(`📝 Пользователь удален из Firestore, но не из Authentication`)
      console.log(`🔧 Для полного удаления используйте Firebase Console → Authentication`)
      
      authDeleted = false
      
    } catch (authError) {
      console.log(`❌ Ошибка удаления из Authentication: ${authError}`)
      authDeleted = false
    }
    
    console.log(`🎉 Удаление завершено!`)
    console.log(`📊 Удалено из Firestore: ${deletedItems} элементов`)
    console.log(`🔐 Удален из Authentication: ${authDeleted ? 'Да' : 'Нет (требует Firebase Console)'}`)
    
    return {
      success: true,
      message: `Пользователь ${userEmail} полностью удален из Firestore (${deletedItems} элементов). Для удаления из Authentication используйте Firebase Console.`,
      deletedItems,
      authDeleted,
      userId
    }
    
  } catch (error) {
    console.error('❌ Ошибка полного удаления пользователя:', error)
    return {
      success: false,
      message: `Ошибка удаления: ${(error as Error).message}`,
      deletedItems: 0,
      authDeleted: false
    }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    deleteUserCompletelyEverywhere: typeof deleteUserCompletelyEverywhere
  }
}

if (typeof window !== 'undefined') {
  window.deleteUserCompletelyEverywhere = deleteUserCompletelyEverywhere
}
