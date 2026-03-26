import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Быстрое исправление userInfo
export async function quickFixUserInfo() {
  try {
    console.log('🔧 Быстрое исправление userInfo...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    console.log(`👤 Пользователь: ${currentUser.email}`)
    
    // Проверяем profile
    const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      const profileData = profileSnap.data()
      console.log('✅ Найден профиль:', profileData)
      
      // Копируем в settings/userInfo
      const userInfoRef = doc(db, 'users', currentUser.uid, 'settings', 'userInfo')
      await setDoc(userInfoRef, profileData)
      console.log('✅ userInfo скопирован в settings')
      
      // Обновляем localStorage
      const storageKey = `monvoiture:settings:${currentUser.uid}`
      const existingSettings = localStorage.getItem(storageKey)
      
      if (existingSettings) {
        const settings = JSON.parse(existingSettings)
        settings.userInfo = profileData
        localStorage.setItem(storageKey, JSON.stringify(settings))
        console.log('✅ localStorage обновлен')
      }
      
      console.log('🎉 userInfo исправлен! Перезагрузите страницу.')
      
    } else {
      console.log('❌ Профиль не найден')
    }
    
  } catch (error) {
    console.error('❌ Ошибка исправления userInfo:', error)
  }
}

// Добавляем в window
declare global {
  interface Window {
    quickFixUserInfo: typeof quickFixUserInfo
  }
}

if (typeof window !== 'undefined') {
  window.quickFixUserInfo = quickFixUserInfo
}
