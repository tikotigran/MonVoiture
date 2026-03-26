import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Глубокая диагностика с разными подходами
export async function deepDiagnoseFirestore() {
  try {
    console.log('🔍 Глубокая диагностика Firestore...')
    
    // 1. Проверяем базовый доступ к коллекции
    console.log('\n📋 1. Базовый доступ к collections:')
    try {
      const basicUsers = await getDocs(collection(db, 'users'))
      console.log(`  ✅ users (базовый): ${basicUsers.docs.length} документов`)
      
      if (basicUsers.docs.length > 0) {
        basicUsers.docs.slice(0, 3).forEach(doc => {
          console.log(`    📄 ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 100)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка базового доступа users: ${error}`)
    }
    
    try {
      const basicAdmin = await getDocs(collection(db, 'adminUsers'))
      console.log(`  ✅ adminUsers (базовый): ${basicAdmin.docs.length} документов`)
    } catch (error) {
      console.log(`  ❌ Ошибка базового доступа adminUsers: ${error}`)
    }
    
    // 2. Проверяем с query
    console.log('\n🔍 2. Доступ через query:')
    try {
      const queryUsers = await getDocs(query(collection(db, 'users'), limit(10)))
      console.log(`  ✅ users (query): ${queryUsers.docs.length} документов`)
      
      if (queryUsers.docs.length > 0) {
        queryUsers.docs.forEach(doc => {
          console.log(`    📄 ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 80)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка query users: ${error}`)
    }
    
    // 3. Проверяем конкретные документы если знаем ID
    console.log('\n🎯 3. Проверяем конкретные пути:')
    
    // Попробуем разные возможные ID
    const possibleIds = [
      'tikjan1983@gmail.com',
      'admin',
      'user',
      '1',
      '123'
    ]
    
    for (const id of possibleIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', id))
        if (userDoc.exists()) {
          console.log(`  ✅ Найден пользователь: users/${id}`)
          console.log(`    📄 Данные: ${JSON.stringify(userDoc.data()).slice(0, 100)}...`)
        }
      } catch (error) {
        console.log(`  ❌ Ошибка проверки users/${id}: ${error}`)
      }
    }
    
    // 4. Проверяем вложенные коллекции
    console.log('\n📁 4. Проверяем вложенные коллекции:')
    
    // Если есть пользователи, проверяем их структуру
    try {
      const usersCheck = await getDocs(query(collection(db, 'users'), limit(1)))
      if (usersCheck.docs.length > 0) {
        const userId = usersCheck.docs[0].id
        console.log(`  🔍 Проверяем пользователя: ${userId}`)
        
        const subcollections = ['profile', 'cars', 'documents', 'settings', 'notifications']
        
        for (const subcoll of subcollections) {
          try {
            const subcollRef = collection(db, 'users', userId, subcoll)
            const subcollSnapshot = await getDocs(query(subcollRef, limit(5)))
            console.log(`    📁 ${subcoll}: ${subcollSnapshot.docs.length} документов`)
            
            if (subcollSnapshot.docs.length > 0) {
              subcollSnapshot.docs.slice(0, 2).forEach(doc => {
                console.log(`      📄 ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 60)}...`)
              })
            }
          } catch (error) {
            console.log(`    ❌ Ошибка ${subcoll}: ${error}`)
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Ошибка проверки вложенных коллекций: ${error}`)
    }
    
    // 5. Проверяем альтернативные структуры
    console.log('\n🔀 5. Проверяем альтернативные структуры:')
    
    const alternativePaths = [
      'user',
      'profiles', 
      'garages',
      'cars',
      'app-users'
    ]
    
    for (const path of alternativePaths) {
      try {
        const altSnapshot = await getDocs(query(collection(db, path), limit(5)))
        if (altSnapshot.docs.length > 0) {
          console.log(`  ✅ Найдена коллекция ${path}: ${altSnapshot.docs.length} документов`)
        }
      } catch (error) {
        // Игнорируем - коллекции может не существовать
      }
    }
    
    // 6. Проверяем права доступа
    console.log('\n🔐 6. Проверяем права доступа:')
    
    const currentUser = db.app.auth().currentUser
    console.log(`  👤 Текущий пользователь: ${currentUser?.email || 'Не авторизован'}`)
    console.log(`  🆔 UID: ${currentUser?.uid || 'Нет UID'}`)
    
    if (!currentUser) {
      console.log(`  ⚠️ Пользователь не авторизован - это может быть причиной проблемы!`)
    }
    
    return {
      success: true,
      message: 'Диагностика завершена'
    }
    
  } catch (error) {
    console.error('❌ Ошибка глубокой диагностики:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

// Простая проверка с прямым доступом
export async function simpleCheck() {
  try {
    console.log('⚡ Простая проверка доступа...')
    
    // 1. Пробуем users
    console.log('\n👥 Проверка users:')
    try {
      const usersRef = collection(db, 'users')
      console.log('  📍 Путь к users:', usersRef.path)
      
      const snapshot = await getDocs(usersRef)
      console.log(`  📊 Результат: ${snapshot.docs.length} документов`)
      
      if (snapshot.docs.length > 0) {
        console.log('  📄 Первые документы:')
        snapshot.docs.slice(0, 3).forEach((doc, index) => {
          console.log(`    ${index + 1}. ${doc.id}`)
          console.log(`       Данные: ${JSON.stringify(doc.data()).slice(0, 80)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error}`)
    }
    
    // 2. Пробуем adminUsers  
    console.log('\n👨‍💼 Проверка adminUsers:')
    try {
      const adminRef = collection(db, 'adminUsers')
      console.log('  📍 Путь к adminUsers:', adminRef.path)
      
      const adminSnapshot = await getDocs(adminRef)
      console.log(`  📊 Результат: ${adminSnapshot.docs.length} документов`)
      
      if (adminSnapshot.docs.length > 0) {
        console.log('  📄 Первые документы:')
        adminSnapshot.docs.slice(0, 3).forEach((doc, index) => {
          console.log(`    ${index + 1}. ${doc.id}`)
          console.log(`       Данные: ${JSON.stringify(doc.data()).slice(0, 80)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error}`)
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ Ошибка простой проверки:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    deepDiagnoseFirestore: typeof deepDiagnoseFirestore
    simpleCheck: typeof simpleCheck
  }
}

if (typeof window !== 'undefined') {
  window.deepDiagnoseFirestore = deepDiagnoseFirestore
  window.simpleCheck = simpleCheck
}
