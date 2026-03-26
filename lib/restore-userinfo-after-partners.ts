import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Восстановить userInfo после добавления партнеров
export async function restoreUserInfoAfterPartners() {
  try {
    console.log('🔄 Восстанавливаем userInfo после добавления партнеров...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    console.log(`👤 Пользователь: ${currentUser.email}`)
    
    // 1. Ищем userInfo в profile/doc
    let userInfo = null
    
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        userInfo = profileSnap.data()
        console.log('✅ Найден userInfo в profile:', userInfo)
      }
    } catch (error) {
      console.log('❌ Ошибка поиска в profile:', error)
    }
    
    // 2. Если не нашли, ищем в корневой users
    if (!userInfo) {
      try {
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          userInfo = userSnap.data()
          console.log('✅ Найден userInfo в users:', userInfo)
        }
      } catch (error) {
        console.log('❌ Ошибка поиска в users:', error)
      }
    }
    
    // 3. Если нашли, сохраняем в settings/userInfo
    if (userInfo) {
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      await setDoc(userInfoRef, userInfo)
      
      console.log('✅ userInfo восстановлен в settings/userInfo!')
      console.log(`👤 Имя: ${userInfo.firstName}`)
      console.log(`📧 Email: ${userInfo.email}`)
      console.log(`🏢 Гараж: ${userInfo.garageName}`)
      console.log('')
      console.log('⚡ Перезагрузите страницу!')
      
      return { success: true, userInfo }
    } else {
      console.log('❌ userInfo не найден нигде!')
      return { success: false, error: 'userInfo не найден' }
    }
    
  } catch (error) {
    console.error('❌ Ошибка восстановления userInfo:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    restoreUserInfoAfterPartners: typeof restoreUserInfoAfterPartners
  }
}

if (typeof window !== 'undefined') {
  window.restoreUserInfoAfterPartners = restoreUserInfoAfterPartners
}
