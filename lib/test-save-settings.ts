import { doc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Тестовое сохранение настроек
export async function testSaveSettings() {
  try {
    console.log('🧪 Тестируем сохранение настроек...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    console.log(`👤 Пользователь: ${currentUser.email}`)
    console.log(`🆔 UID: ${userId}`)
    
    // Тестовые данные
    const testUserInfo = {
      firstName: 'TestName',
      lastName: 'TestLast',
      email: currentUser.email,
      garageName: 'TestGarage',
      createdAt: new Date().toISOString()
    }
    
    console.log('📝 Тестовые данные:', testUserInfo)
    
    // Сохраняем в settings/userInfo
    const userInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
    await setDoc(userInfoRef, testUserInfo)
    
    console.log('✅ Тестовые данные сохранены!')
    console.log('⚡ Обновите страницу чтобы увидеть изменения')
    
    return { success: true, testUserInfo }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    testSaveSettings: typeof testSaveSettings
  }
}

if (typeof window !== 'undefined') {
  window.testSaveSettings = testSaveSettings
}
