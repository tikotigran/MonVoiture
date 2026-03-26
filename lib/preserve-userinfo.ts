import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Сохранить userInfo перед перезагрузкой и восстановить после
export async function preserveUserInfoDuringReload() {
  try {
    console.log('🔒 Сохраняем userInfo перед перезагрузкой...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return null
    }
    
    const userId = currentUser.uid
    
    // Сохраняем текущий userInfo из localStorage
    const storageKey = `monvoiture:settings:${userId}`
    const localSettings = localStorage.getItem(storageKey)
    
    if (localSettings) {
      const settings = JSON.parse(localSettings)
      const userInfo = settings.userInfo
      
      if (userInfo) {
        console.log('✅ userInfo сохранен из localStorage:', userInfo)
        
        // Восстанавливаем через 2 секунды после перезагрузки
        setTimeout(async () => {
          try {
            const { setDoc } = await import('firebase/firestore')
            const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
            await setDoc(userInfoRef, userInfo)
            console.log('✅ userInfo восстановлен после перезагрузки')
          } catch (error) {
            console.error('❌ Ошибка восстановления userInfo:', error)
          }
        }, 2000)
        
        return userInfo
      }
    }
    
    console.log('❌ userInfo не найден в localStorage')
    return null
    
  } catch (error) {
    console.error('❌ Ошибка сохранения userInfo:', error)
    return null
  }
}

// Добавляем в window
declare global {
  interface Window {
    preserveUserInfoDuringReload: typeof preserveUserInfoDuringReload
  }
}

if (typeof window !== 'undefined') {
  window.preserveUserInfoDuringReload = preserveUserInfoDuringReload
}
