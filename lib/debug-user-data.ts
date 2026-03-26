import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Проверка где находятся данные пользователя
export async function debugUserData() {
  try {
    console.log('🔍 Проверка данных пользователя...')
    
    const currentUser = { uid: 'TmO9nN9VzPcL07HA79vAgJYBWig2' }
    console.log('🔍 User ID:', currentUser.uid)
    
    // 1. Проверяем корневую коллекцию users
    console.log('\n📁 Проверка корневой коллекции users:')
    try {
      const usersRoot = await getDocs(collection(db, 'users'))
      console.log(`👥 Корневая users: ${usersRoot.docs.length} документов`)
      usersRoot.docs.forEach(doc => {
        console.log(`  - ${doc.id}:`, doc.data())
      })
    } catch (error) {
      console.log('❌ Ошибка доступа к корневой users:', error.message)
    }
    
    // 2. Проверяем профиль пользователя
    console.log('\n📁 Проверка профиля пользователя:')
    try {
      const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      console.log(`👤 Профиль ${currentUser.uid}:`, profileSnap.exists() ? profileSnap.data() : 'не найден')
    } catch (error) {
      console.log('❌ Ошибка доступа к профилю:', error.message)
    }
    
    // 3. Проверяем машины пользователя
    console.log('\n📁 Проверка машин пользователя:')
    try {
      const carsRef = collection(db, 'users', currentUser.uid, 'cars')
      const carsSnap = await getDocs(carsRef)
      console.log(`🚗 Машин ${currentUser.uid}: ${carsSnap.docs.length} документов`)
      carsSnap.docs.forEach(doc => {
        console.log(`  - ${doc.id}:`, doc.data())
      })
    } catch (error) {
      console.log('❌ Ошибка доступа к машинам:', error.message)
    }
    
    // 4. Проверяем документы пользователя
    console.log('\n📁 Проверка документов пользователя:')
    try {
      const docsRef = collection(db, 'users', currentUser.uid, 'documents')
      const docsSnap = await getDocs(docsRef)
      console.log(`📄 Документов ${currentUser.uid}: ${docsSnap.docs.length} документов`)
      docsSnap.docs.forEach(doc => {
        console.log(`  - ${doc.id}:`, doc.data())
      })
    } catch (error) {
      console.log('❌ Ошибка доступа к документам:', error.message)
    }
    
    return true
  } catch (error) {
    console.error('❌ Ошибка проверки данных пользователя:', error)
    return false
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    debugUserData: typeof debugUserData
  }
}

if (typeof window !== 'undefined') {
  window.debugUserData = debugUserData
}
