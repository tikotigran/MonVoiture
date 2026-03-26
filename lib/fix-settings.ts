import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Исправить загрузку данных в настройках
export async function fixSettings() {
  try {
    console.log('🔧 Исправляем настройки...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Пользователь: ${email}`)
    console.log(`🆔 UID: ${userId}`)
    
    // 1. Ищем профиль в разных местах
    let profileData = null
    
    // Проверяем корневую коллекцию users
    console.log('\n📋 Ищем в корневой users:')
    try {
      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        profileData = userDocSnap.data()
        console.log('✅ Профиль найден в users:', profileData)
      } else {
        console.log('❌ Не найден в users')
      }
    } catch (error) {
      console.log('❌ Ошибка поиска в users:', error)
    }
    
    // Проверяем profile/doc
    if (!profileData) {
      console.log('\n📁 Ищем в profile/doc:')
      try {
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        const profileSnap = await getDoc(profileRef)
        
        if (profileSnap.exists()) {
          profileData = profileSnap.data()
          console.log('✅ Профиль найден в profile/doc:', profileData)
        } else {
          console.log('❌ Не найден в profile/doc')
        }
      } catch (error) {
        console.log('❌ Ошибка поиска в profile/doc:', error)
      }
    }
    
    // 2. Если нашли профиль, сохраняем его в settings
    if (profileData) {
      console.log('\n💾 Сохраняем профиль в settings:')
      
      // Сохраняем в settings/userInfo
      const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      await setDoc(userInfoRef, profileData)
      console.log('✅ Сохранено в settings/userInfo')
      
      // Обновляем localStorage
      const storageKey = `monvoiture:settings:${userId}`
      const existingSettings = localStorage.getItem(storageKey)
      
      if (existingSettings) {
        const settings = JSON.parse(existingSettings)
        settings.userInfo = profileData
        localStorage.setItem(storageKey, JSON.stringify(settings))
        console.log('✅ Обновлен localStorage')
      } else {
        // Создаем базовые настройки с профилем
        const defaultSettings = {
          partners: [],
          currency: '€',
          language: 'ru',
          theme: 'system',
          appName: profileData.garageName || 'MyGarage',
          features: {
            sorting: true,
            purchaseDate: true,
            licensePlate: true,
            search: true,
            documents: true,
            km: true,
            year: true,
            partnership: true,
            dashboard: true,
          },
          userInfo: profileData
        }
        localStorage.setItem(storageKey, JSON.stringify(defaultSettings))
        console.log('✅ Созданы новые настройки в localStorage')
      }
      
      console.log('\n🎉 Настройки исправлены!')
      console.log(`👤 Имя: ${profileData.firstName || 'Нет имени'}`)
      console.log(`📧 Email: ${profileData.email || 'Нет email'}`)
      console.log(`🏢 Гараж: ${profileData.garageName || 'Нет гаража'}`)
      console.log('')
      console.log('⚡ Перезагрузите страницу!')
      
      return { success: true, profile: profileData }
      
    } else {
      console.log('\n❌ Профиль не найден нигде!')
      console.log('🤝 Нужно создать профиль')
      return { success: false, error: 'Профиль не найден' }
    }
    
  } catch (error) {
    console.error('❌ Ошибка исправления настроек:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Принудительно перезагрузить настройки
export async function forceReloadSettings() {
  try {
    console.log('🔄 Принудительная перезагрузка настроек...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    
    // Очищаем localStorage
    const storageKey = `monvoiture:settings:${userId}`
    localStorage.removeItem(storageKey)
    console.log('🗑️ localStorage очищен')
    
    // Перезагружаем страницу
    console.log('🔄 Перезагрузка страницы через 1 секунду...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('❌ Ошибка перезагрузки:', error)
  }
}

// Добавляем в window
declare global {
  interface Window {
    fixSettings: typeof fixSettings
    forceReloadSettings: typeof forceReloadSettings
  }
}

if (typeof window !== 'undefined') {
  window.fixSettings = fixSettings
  window.forceReloadSettings = forceReloadSettings
}
