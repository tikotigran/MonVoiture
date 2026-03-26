import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Найти где лежит профиль пользователя
export async function findMyProfile() {
  try {
    console.log('🔍 Ищем профиль пользователя...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Пользователь: ${email}`)
    console.log(`🆔 UID: ${userId}`)
    
    // 1. Проверяем все возможные пути для профиля
    const profilePaths = [
      `users/${userId}/profile/doc`,
      `users/${userId}/profile`,
      `users/${userId}`,
      `users/${userId}/settings/userInfo`,
      `users/${userId}/settings/profile`,
      `users/${userId}/info`,
      `users/${userId}/data`
    ]
    
    console.log('\n📁 Проверяем пути профиля:')
    let foundProfile = null
    let foundPath = null
    
    for (const path of profilePaths) {
      try {
        const parts = path.split('/')
        if (parts.length < 2) continue
        const ref = doc(db, parts[0], parts[1], ...parts.slice(2))
        const snap = await getDoc(ref)
        
        if (snap.exists()) {
          const data = snap.data()
          console.log(`✅ Найден в ${path}:`, data)
          
          // Проверяем есть ли имя/фамилия
          if (data.firstName || data.lastName || data.name || data.email) {
            foundProfile = data
            foundPath = path
            console.log(`🎯 Это профиль пользователя!`)
            break
          }
        } else {
          console.log(`❌ Пусто в ${path}`)
        }
      } catch (error) {
        console.log(`❌ Ошибка в ${path}: ${error}`)
      }
    }
    
    // 2. Ищем в корневой коллекции users
    console.log('\n📋 Проверяем корневую коллекцию users:')
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      console.log(`📊 Всего документов в users: ${usersSnapshot.docs.length}`)
      
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data()
        console.log(`📄 Документ ${userDoc.id}:`, data)
        
        // Ищем документ с нашим email или uid
        if (userDoc.id === userId || data.email === email) {
          console.log(`🎯 НАШЕЛ ПРОФИЛЬ в users/${userDoc.id}!`)
          foundProfile = data
          foundPath = `users/${userDoc.id}`
          break
        }
      }
    } catch (error) {
      console.log(`❌ Ошибка проверки users: ${error}`)
    }
    
    // 3. Результат
    if (foundProfile) {
      console.log('\n🎉 ПРОФИЛЬ НАЙДЕН!')
      console.log(`📍 Путь: ${foundPath}`)
      console.log(`📝 Данные:`, foundProfile)
      console.log(`👤 Имя:`, foundProfile.firstName || foundProfile.name || 'Нет имени')
      console.log(`📧 Email:`, foundProfile.email)
      console.log(`🏢 Гараж:`, foundProfile.garageName || 'Нет гаража')
      
      // Копируем в правильное место
      console.log('\n🔄 Копируем в settings/userInfo...')
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      await setDoc(userInfoRef, foundProfile)
      console.log('✅ Скопировано в settings/userInfo')
      
      return { success: true, profile: foundProfile, path: foundPath }
    } else {
      console.log('\n❌ ПРОФИЛЬ НЕ НАЙДЕНИН!')
      console.log('🤔 Нужно создать новый профиль')
      return { success: false, profile: null, path: null }
    }
    
  } catch (error) {
    console.error('❌ Ошибка поиска профиля:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    findMyProfile: typeof findMyProfile
  }
}

if (typeof window !== 'undefined') {
  window.findMyProfile = findMyProfile
}
