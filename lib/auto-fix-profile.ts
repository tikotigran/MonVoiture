import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Автоматическое исправление профиля - копирует из profile/doc в settings/userInfo
export async function autoFixProfile() {
  try {
    console.log('🔧 Автоматическое исправление профиля...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    console.log(`👤 Пользователь: ${currentUser.email}`)
    
    // Проверяем profile/doc
    const profileRef = doc(db, 'users', userId, 'profile', 'doc')
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      const profileData = profileSnap.data()
      console.log('✅ Найден профиль в profile/doc:', profileData)
      
      // Копируем в settings/userInfo
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      await setDoc(userInfoRef, profileData)
      
      console.log('✅ Профиль автоматически скопирован в settings/userInfo!')
      console.log(`👤 Имя: ${profileData.firstName}`)
      console.log(`📧 Email: ${profileData.email}`)
      console.log(`🏢 Гараж: ${profileData.garageName}`)
      console.log('')
      console.log('⚡ Перезагрузите страницу!')
      
      return { success: true, profileData }
    } else {
      console.log('❌ Профиль не найден в profile/doc')
      return { success: false, error: 'Профиль не найден' }
    }
    
  } catch (error) {
    console.error('❌ Ошибка автоматического исправления:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    autoFixProfile: typeof autoFixProfile
  }
}

if (typeof window !== 'undefined') {
  window.autoFixProfile = autoFixProfile
}
