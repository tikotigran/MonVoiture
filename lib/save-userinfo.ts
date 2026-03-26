import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Сохранить userInfo из существующих данных
export async function saveUserInfo() {
  try {
    console.log('💾 Сохраняем userInfo...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Пользователь: ${email}`)
    
    // Ищем существующие данные
    let userData = null
    
    // 1. Проверяем profile/doc
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        userData = profileSnap.data()
        console.log('✅ Найдены данные в profile/doc:', userData)
      }
    } catch (error) {
      console.log('❌ Ошибка поиска в profile:', error)
    }
    
    // 2. Проверяем корневую users
    if (!userData) {
      try {
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          userData = userSnap.data()
          console.log('✅ Найдены данные в users:', userData)
        }
      } catch (error) {
        console.log('❌ Ошибка поиска в users:', error)
      }
    }
    
    // 3. Если данных нет, создаем базовые
    if (!userData) {
      userData = {
        firstName: email?.split('@')[0] || 'Пользователь',
        lastName: '',
        garageName: `${email?.split('@')[0]}'s Garage` || 'MyGarage',
        email: email,
        createdAt: new Date().toISOString()
      }
      console.log('📝 Созданы базовые данные:', userData)
    }
    
    // Сохраняем в settings/userInfo
    const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
    await setDoc(userInfoRef, userData)
    
    console.log('✅ userInfo сохранен в settings/userInfo!')
    console.log(`👤 Имя: ${userData.firstName}`)
    console.log(`📧 Email: ${userData.email}`)
    console.log(`🏢 Гараж: ${userData.garageName}`)
    console.log('')
    console.log('⚡ Перезагрузите страницу!')
    
    return { success: true, userData }
    
  } catch (error) {
    console.error('❌ Ошибка сохранения userInfo:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    saveUserInfo: typeof saveUserInfo
  }
}

if (typeof window !== 'undefined') {
  window.saveUserInfo = saveUserInfo
}
