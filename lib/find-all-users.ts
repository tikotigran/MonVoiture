import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Поиск всех пользователей в разных местах Firebase
export async function findAllUsers() {
  try {
    console.log('🔍 Поиск всех пользователей в Firebase...')
    
    const currentUser = { uid: 'TmO9nN9VzPcL07HA79vAgJYBWig2' }
    console.log('🔍 Текущий пользователь:', currentUser.uid)
    
    // 1. Проверяем корневую коллекцию users
    console.log('\n📁 1. Корневая коллекция users:')
    try {
      const usersRoot = await getDocs(collection(db, 'users'))
      console.log(`👥 Корневая users: ${usersRoot.docs.length} документов`)
      if (usersRoot.docs.length > 0) {
        usersRoot.docs.slice(0, 3).forEach(doc => {
          console.log(`  - ${doc.id}:`, Object.keys(doc.data()))
        })
      }
    } catch (error) {
      console.log('❌ Ошибка доступа к корневой users:', error.message)
    }
    
    // 2. Проверяем профиль текущего пользователя
    console.log('\n📁 2. Профиль текущего пользователя:')
    try {
      const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      console.log(`👤 Профиль ${currentUser.uid}:`, profileSnap.exists() ? 'найден' : 'не найден')
      if (profileSnap.exists()) {
        console.log('  Данные профиля:', Object.keys(profileSnap.data()))
      }
    } catch (error) {
      console.log('❌ Ошибка доступа к профилю:', error.message)
    }
    
    // 3. Проверяем машины текущего пользователя
    console.log('\n📁 3. Машины текущего пользователя:')
    try {
      const carsRef = collection(db, 'users', currentUser.uid, 'cars')
      const carsSnap = await getDocs(carsRef)
      console.log(`🚗 Машин ${currentUser.uid}: ${carsSnap.docs.length} документов`)
      if (carsSnap.docs.length > 0) {
        carsSnap.forEach(doc => {
          console.log(`  - ${doc.id}:`, Object.keys(doc.data()))
        })
      }
    } catch (error) {
      console.log('❌ Ошибка доступа к машинам:', error.message)
    }
    
    // 4. Проверяем все возможные пути с UID пользователей
    const userUIDs = [
      'E23mg5WspcbCbO97LYP5x5UqXcu1',
      'EXhH3I8UAlXDWGGjs3Vgolyep393', 
      'FrGuazyEbyZdHvlWmKyImuuffU62',
      'TmO9nN9VzPcL07HA79vAgJYBWig2'
    ]
    
    console.log('\n📁 4. Проверка конкретных пользователей:')
    for (const uid of userUIDs) {
      console.log(`\n🔍 Проверяем пользователя: ${uid}`)
      
      // Проверяем машины
      try {
        const carsRef = collection(db, 'users', uid, 'cars')
        const carsSnap = await getDocs(carsRef)
        console.log(`  🚗 Машин: ${carsSnap.docs.length}`)
        if (carsSnap.docs.length > 0) {
          carsSnap.forEach(doc => {
            console.log(`    - ${doc.id}:`, Object.keys(doc.data()))
          })
        }
      } catch (error) {
        console.log(`  ❌ Нет доступа к машинам: ${error.message}`)
      }
      
      // Проверяем профиль
      try {
        const profileRef = doc(db, 'users', uid, 'profile', 'doc')
        const profileSnap = await getDoc(profileRef)
        console.log(`  👤 Профиль: ${profileSnap.exists() ? 'найден' : 'не найден'}`)
        if (profileSnap.exists()) {
          console.log(`    Данные:`, Object.keys(profileSnap.data()))
        }
      } catch (error) {
        console.log(`  ❌ Нет доступа к профилю: ${error.message}`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Ошибка поиска пользователей:', error)
    return false
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    findAllUsers: typeof findAllUsers
  }
}

if (typeof window !== 'undefined') {
  window.findAllUsers = findAllUsers
}
