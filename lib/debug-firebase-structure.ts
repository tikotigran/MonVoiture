import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Проверка структуры данных в Firebase
export async function debugFirebaseStructure() {
  try {
    console.log('🔍 Проверка структуры данных Firebase...')
    
    // 1. Проверяем корневые коллекции
    console.log('📁 Проверка корневых коллекций:')
    
    try {
      const usersRoot = await getDocs(collection(db, 'users'))
      console.log(`👥 Корневая users: ${usersRoot.docs.length} документов`)
      if (usersRoot.docs.length > 0) {
        console.log('📝 Пример пользователя из корня:', usersRoot.docs[0].data())
      }
    } catch (error) {
      console.log('❌ Нет доступа к корневой users:', error.message)
    }
    
    try {
      const carsRoot = await getDocs(collection(db, 'cars'))
      console.log(`🚗 Корневая cars: ${carsRoot.docs.length} документов`)
      if (carsRoot.docs.length > 0) {
        console.log('📝 Пример машины из корня:', carsRoot.docs[0].data())
      }
    } catch (error) {
      console.log('❌ Нет доступа к корневой cars:', error.message)
    }
    
    try {
      const expensesRoot = await getDocs(collection(db, 'expenses'))
      console.log(`💰 Корневая expenses: ${expensesRoot.docs.length} документов`)
      if (expensesRoot.docs.length > 0) {
        console.log('📝 Пример расхода из корня:', expensesRoot.docs[0].data())
      }
    } catch (error) {
      console.log('❌ Нет доступа к корневой expenses:', error.message)
    }
    
    // 2. Проверяем вложенную структуру
    console.log('\n📁 Проверка вложенной структуры:')
    
    const usersRoot = await getDocs(collection(db, 'users'))
    console.log(`👥 Всего пользователей: ${usersRoot.docs.length}`)
    
    if (usersRoot.docs.length > 0) {
      const firstUserId = usersRoot.docs[0].id
      console.log(`🔍 Проверяем пользователя: ${firstUserId}`)
      
      // Проверяем машины пользователя
      try {
        const userCars = await getDocs(collection(db, 'users', firstUserId, 'cars'))
        console.log(`🚗 Машин у пользователя ${firstUserId}: ${userCars.docs.length}`)
        if (userCars.docs.length > 0) {
          console.log('📝 Пример машины:', userCars.docs[0].data())
          
          // Проверяем расходы машины
          const firstCarId = userCars.docs[0].id
          try {
            const carExpenses = await getDocs(collection(db, 'users', firstUserId, 'cars', firstCarId, 'expenses'))
            console.log(`💰 Расходов у машины ${firstCarId}: ${carExpenses.docs.length}`)
            if (carExpenses.docs.length > 0) {
              console.log('📝 Пример расхода:', carExpenses.docs[0].data())
            }
          } catch (error) {
            console.log('❌ Нет доступа к расходам машины:', error.message)
          }
        }
      } catch (error) {
        console.log('❌ Нет доступа к машинам пользователя:', error.message)
      }
      
      // Проверяем документы пользователя
      try {
        const userDocs = await getDocs(collection(db, 'users', firstUserId, 'documents'))
        console.log(`📄 Документов у пользователя ${firstUserId}: ${userDocs.docs.length}`)
        if (userDocs.docs.length > 0) {
          console.log('📝 Пример документа:', userDocs.docs[0].data())
        }
      } catch (error) {
        console.log('❌ Нет доступа к документам пользователя:', error.message)
      }
    } else {
      console.log('❌ Пользователей не найдено!')
    }
    
    return true
  } catch (error) {
    console.error('❌ Ошибка проверки структуры:', error)
    return false
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    debugFirebaseStructure: typeof debugFirebaseStructure
  }
}

if (typeof window !== 'undefined') {
  window.debugFirebaseStructure = debugFirebaseStructure
}
