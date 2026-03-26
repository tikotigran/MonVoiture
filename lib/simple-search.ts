import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Простой поиск ваших данных в Firebase
export async function simpleSearch() {
  try {
    console.log('🔍 Простой поиск данных в Firebase...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Email: ${email}`)
    console.log(`🆔 UID: ${userId}`)
    
    // 1. Ищем в корневой users по UID
    console.log('\n📋 Ищем в users по UID:')
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        console.log('✅ НАЙДЕНО в users по UID:', data)
        console.log(`👤 Имя: ${data.firstName || data.name || 'Нет имени'}`)
        console.log(`📧 Email: ${data.email || 'Нет email'}`)
        console.log(`🏢 Гараж: ${data.garageName || 'Нет гаража'}`)
        return { found: true, data, location: `users/${userId}` }
      } else {
        console.log('❌ Не найдено по UID')
      }
    } catch (error) {
      console.log('❌ Ошибка поиска по UID:', error)
    }
    
    // 2. Ищем в корневой users по email
    console.log('\n📋 Ищем в users по email:')
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data()
        if (data.email === email) {
          console.log('✅ НАЙДЕНО в users по email:', data)
          console.log(`📄 Документ ID: ${userDoc.id}`)
          console.log(`👤 Имя: ${data.firstName || data.name || 'Нет имени'}`)
          console.log(`📧 Email: ${data.email || 'Нет email'}`)
          console.log(`🏢 Гараж: ${data.garageName || 'Нет гаража'}`)
          return { found: true, data, location: `users/${userDoc.id}` }
        }
      }
      console.log('❌ Не найдено по email')
    } catch (error) {
      console.log('❌ Ошибка поиска по email:', error)
    }
    
    // 3. Ищем в users/{userId}/profile/doc
    console.log('\n📁 Ищем в profile/doc:')
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        console.log('✅ НАЙДЕНО в profile/doc:', data)
        console.log(`👤 Имя: ${data.firstName || data.name || 'Нет имени'}`)
        console.log(`📧 Email: ${data.email || 'Нет email'}`)
        console.log(`🏢 Гараж: ${data.garageName || 'Нет гаража'}`)
        return { found: true, data, location: `users/${userId}/profile/doc` }
      } else {
        console.log('❌ Не найдено в profile/doc')
      }
    } catch (error) {
      console.log('❌ Ошибка поиска в profile/doc:', error)
    }
    
    // 4. Ищем в settings/userInfo
    console.log('\n⚙️ Ищем в settings/userInfo:')
    try {
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      const userInfoSnap = await getDoc(userInfoRef)
      
      if (userInfoSnap.exists()) {
        const data = userInfoSnap.data()
        console.log('✅ НАЙДЕНО в settings/userInfo:', data)
        console.log(`👤 Имя: ${data.firstName || data.name || 'Нет имени'}`)
        console.log(`📧 Email: ${data.email || 'Нет email'}`)
        console.log(`🏢 Гараж: ${data.garageName || 'Нет гаража'}`)
        return { found: true, data, location: `users/${userId}/settings/userInfo` }
      } else {
        console.log('❌ Не найдено в settings/userInfo')
      }
    } catch (error) {
      console.log('❌ Ошибка поиска в settings/userInfo:', error)
    }
    
    console.log('\n❌ ДАННЫЕ НЕ НАЙДЕНЫ НИГДЕ!')
    console.log('🤝 Нужно создать новый профиль')
    
    return { found: false, data: null, location: null }
    
  } catch (error) {
    console.error('❌ Ошибка поиска:', error)
    return { found: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    simpleSearch: typeof simpleSearch
  }
}

if (typeof window !== 'undefined') {
  window.simpleSearch = simpleSearch
}
