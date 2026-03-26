import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Диагностика загрузки профиля
export async function diagnoseProfileLoading() {
  try {
    console.log('🔍 Диагностируем загрузку профиля...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Пользователь: ${email}`)
    console.log(`🆔 UID: ${userId}`)
    
    console.log('\n📋 Проверяем все возможные места хранения:')
    
    // 1. Проверяем profile/doc
    console.log('\n1️⃣ Проверяем profile/doc:')
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'doc')
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        console.log('✅ НАЙДЕНО в profile/doc:', profileData)
        console.log(`👤 Имя: ${profileData.firstName}`)
        console.log(`📧 Email: ${profileData.email}`)
      } else {
        console.log('❌ Пусто в profile/doc')
      }
    } catch (error) {
      console.log('❌ Ошибка profile/doc:', error)
    }
    
    // 2. Проверяем settings/userInfo
    console.log('\n2️⃣ Проверяем settings/userInfo:')
    try {
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      const userInfoSnap = await getDoc(userInfoRef)
      
      if (userInfoSnap.exists()) {
        const userInfoData = userInfoSnap.data()
        console.log('✅ НАЙДЕНО в settings/userInfo:', userInfoData)
        console.log(`👤 Имя: ${userInfoData.firstName}`)
        console.log(`📧 Email: ${userInfoData.email}`)
      } else {
        console.log('❌ Пусто в settings/userInfo')
      }
    } catch (error) {
      console.log('❌ Ошибка settings/userInfo:', error)
    }
    
    // 3. Проверяем корневую users
    console.log('\n3️⃣ Проверяем корневую users:')
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const userData = userSnap.data()
        console.log('✅ НАЙДЕНО в users:', userData)
        console.log(`👤 Имя: ${userData.firstName}`)
        console.log(`📧 Email: ${userData.email}`)
      } else {
        console.log('❌ Пусто в users')
      }
    } catch (error) {
      console.log('❌ Ошибка users:', error)
    }
    
    // 4. Проверяем localStorage
    console.log('\n4️⃣ Проверяем localStorage:')
    try {
      const storageKey = `monvoiture:settings:${userId}`
      const localSettings = localStorage.getItem(storageKey)
      
      if (localSettings) {
        const settings = JSON.parse(localSettings)
        console.log('✅ НАЙДЕНО в localStorage:', settings)
        console.log('👤 userInfo из localStorage:', settings.userInfo)
      } else {
        console.log('❌ Пусто в localStorage')
      }
    } catch (error) {
      console.log('❌ Ошибка localStorage:', error)
    }
    
    console.log('\n🎯 АНАЛИЗ ПРОБЛЕМЫ:')
    console.log('❓ Где есть данные? Где нет данных?')
    console.log('❓ Данные есть в Firebase но не загружаются в UI?')
    console.log('❓ Данные есть в UI но не сохраняются в Firebase?')
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    diagnoseProfileLoading: typeof diagnoseProfileLoading
  }
}

if (typeof window !== 'undefined') {
  window.diagnoseProfileLoading = diagnoseProfileLoading
}
