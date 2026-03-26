import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Создание профиля из данных auth или создание базового профиля
export async function createProfile() {
  try {
    console.log('👤 Создание профиля пользователя...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    console.log(`👤 Пользователь: ${currentUser.email}`)
    console.log(`🆔 UID: ${currentUser.uid}`)
    
    // Создаем базовый профиль из email
    const email = currentUser.email || ''
    const firstName = email.split('@')[0] || 'Пользователь'
    const lastName = ''
    const garageName = `${firstName}'s Garage`
    
    const profileData = {
      firstName,
      lastName,
      email,
      garageName,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    
    console.log('📝 Данные профиля:', profileData)
    
    // Сохраняем в profile
    const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
    await setDoc(profileRef, profileData)
    console.log('✅ Профиль создан в profile')
    
    // Сохраняем в settings/userInfo
    const userInfoRef = doc(db, 'users', currentUser.uid, 'settings', 'userInfo')
    await setDoc(userInfoRef, profileData)
    console.log('✅ Профиль создан в settings/userInfo')
    
    // Обновляем localStorage
    const storageKey = `monvoiture:settings:${currentUser.uid}`
    const existingSettings = localStorage.getItem(storageKey)
    
    if (existingSettings) {
      const settings = JSON.parse(existingSettings)
      settings.userInfo = profileData
      localStorage.setItem(storageKey, JSON.stringify(settings))
      console.log('✅ localStorage обновлен')
    } else {
      // Создаем базовые настройки
      const defaultSettings = {
        partners: [],
        currency: '€',
        language: 'ru',
        theme: 'system',
        appName: 'MyGarage',
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
    
    console.log('🎉 Профиль успешно создан!')
    console.log('📝 Имя:', firstName)
    console.log('📧 Email:', email)
    console.log('🏢 Гараж:', garageName)
    console.log('')
    console.log('⚡ Перезагрузите страницу чтобы применить изменения!')
    
    return profileData
    
  } catch (error) {
    console.error('❌ Ошибка создания профиля:', error)
    return null
  }
}

// Добавляем в window
declare global {
  interface Window {
    createProfile: typeof createProfile
  }
}

if (typeof window !== 'undefined') {
  window.createProfile = createProfile
}
