import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auth } from '@/lib/firebase'

// Функция для проверки загружен ли userInfo
export async function debugUserInfo() {
  try {
    console.log('🔍 Проверка userInfo...')
    
    // Проверяем авторизацию
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    console.log(`👤 Текущий пользователь: ${currentUser.email}`)
    console.log(`🆔 UID: ${currentUser.uid}`)
    
    // Проверяем userInfo в settings
    const userInfoRef = doc(db, 'users', currentUser.uid, 'settings', 'userInfo')
    const userInfoSnap = await getDoc(userInfoRef)
    
    console.log('📁 Путь к userInfo:', userInfoRef.path)
    console.log('📄 userInfo существует:', userInfoSnap.exists())
    
    if (userInfoSnap.exists()) {
      const userInfo = userInfoSnap.data()
      console.log('✅ Данные userInfo:', userInfo)
      console.log('📝 Имя:', userInfo.firstName)
      console.log('📝 Фамилия:', userInfo.lastName)
      console.log('📝 Email:', userInfo.email)
      console.log('📝 Название гаража:', userInfo.garageName)
    } else {
      console.log('❌ userInfo не найден в settings')
      
      // Проверяем в profile
      console.log('🔍 Проверяем profile...')
      const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      
      console.log('📄 profile существует:', profileSnap.exists())
      
      if (profileSnap.exists()) {
        const profile = profileSnap.data()
        console.log('✅ Данные profile:', profile)
        console.log('📝 Имя из profile:', profile.firstName)
        console.log('📝 Фамилия из profile:', profile.lastName)
        console.log('📝 Email из profile:', profile.email)
        console.log('📝 Название гаража из profile:', profile.garageName)
        
        // Копируем данные из profile в settings
        console.log('🔄 Копируем данные из profile в settings...')
        await setDoc(userInfoRef, profile)
        console.log('✅ Данные скопированы в settings/userInfo')
      }
    }
    
    // Проверяем localStorage
    console.log('🔍 Проверяем localStorage...')
    const storageKey = `monvoiture:settings:${currentUser.uid}`
    const localSettings = localStorage.getItem(storageKey)
    
    if (localSettings) {
      const settings = JSON.parse(localSettings)
      console.log('📦 Настройки из localStorage:', settings)
      console.log('👤 userInfo из localStorage:', settings.userInfo)
    } else {
      console.log('❌ Настройки не найдены в localStorage')
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки userInfo:', error)
  }
}

// Добавляем в window
declare global {
  interface Window {
    debugUserInfo: typeof debugUserInfo
  }
}

if (typeof window !== 'undefined') {
  window.debugUserInfo = debugUserInfo
}
