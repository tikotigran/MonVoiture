import { collection, getDocs, doc, getDoc, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function debugFirestoreStructure() {
  console.log('=== DEBUG FIRESTORE STRUCTURE ===')
  
  try {
    // Проверяем коллекцию users
    console.log('\n1. Checking collection "users":')
    const usersSnap = await getDocs(collection(db, 'users'))
    console.log(`   Total documents in "users": ${usersSnap.docs.length}`)
    if (usersSnap.docs.length > 0) {
      console.log('   First user ID:', usersSnap.docs[0].id)
      console.log('   First user data:', usersSnap.docs[0].data())
    }

    // Пытаемся найти userInfo документ
    console.log('\n2. Looking for userInfo in first user folder:')
    if (usersSnap.docs.length > 0) {
      const firstUserId = usersSnap.docs[0].id
      try {
        const userInfoSnap = await getDoc(doc(db, 'users', firstUserId, 'settings', 'userInfo'))
        console.log(`   Found userInfo: ${userInfoSnap.exists()}`)
        if (userInfoSnap.exists()) {
          console.log('   UserInfo data:', userInfoSnap.data())
        }
      } catch (e) {
        console.log('   Error reading userInfo:', (e as Error).message)
      }

      // Пытаемся найти profile документ
      try {
        const profileSnap = await getDoc(doc(db, 'users', firstUserId, 'profile', 'doc'))
        console.log(`   Found profile: ${profileSnap.exists()}`)
        if (profileSnap.exists()) {
          console.log('   Profile data:', profileSnap.data())
        }
      } catch (e) {
        console.log('   Error reading profile:', (e as Error).message)
      }

      // Пытаемся найти cars
      try {
        const carsSnap = await getDocs(collection(db, 'users', firstUserId, 'cars'))
        console.log(`   Found ${carsSnap.docs.length} cars`)
        if (carsSnap.docs.length > 0) {
          console.log('   First car:', carsSnap.docs[0].data())
        }
      } catch (e) {
        console.log('   Error reading cars:', (e as Error).message)
      }
    }

    // Проверяем если есть коллекция userInfo (может быть на корневом уровне)
    console.log('\n3. Checking collection "userInfo" at root:')
    try {
      const userInfoRootSnap = await getDocs(collection(db, 'userInfo'))
      console.log(`   Total documents in "userInfo": ${userInfoRootSnap.docs.length}`)
      if (userInfoRootSnap.docs.length > 0) {
        console.log('   First userInfo ID:', userInfoRootSnap.docs[0].id)
        console.log('   First userInfo data:', userInfoRootSnap.docs[0].data())
      }
    } catch (e) {
      console.log('   Collection does not exist or access denied:', (e as Error).message)
    }

    // Проверяем если есть коллекция users на корневом уровне но как документы с вложениями
    console.log('\n4. Checking for auth data:')
    try {
      const authCollSnap = await getDocs(collection(db, 'auth'))
      console.log(`   Total documents in "auth": ${authCollSnap.docs.length}`)
      if (authCollSnap.docs.length > 0) {
        console.log('   First auth ID:', authCollSnap.docs[0].id)
      }
    } catch (e) {
      console.log('   Collection does not exist or access denied')
    }

    console.log('\n=== END DEBUG ===')
  } catch (error) {
    console.error('Error during debug:', error)
  }
}

// Экспортируем в глобальный скоуп для удобства
if (typeof window !== 'undefined') {
  (window as any).debugFirestoreStructure = debugFirestoreStructure
}
