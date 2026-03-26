import { doc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Восстановить недостающие настройки после регистрации
export async function fixRegistrationSettings() {
  try {
    console.log('🔧 Восстанавливаем настройки после регистрации...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return
    }
    
    const userId = currentUser.uid
    const email = currentUser.email
    console.log(`👤 Пользователь: ${email}`)
    console.log(`🆔 UID: ${userId}`)
    
    // Создаем все недостающие настройки
    
    // 1. Currency
    console.log('💰 Сохраняем currency...')
    await setDoc(doc(db, 'users', userId, 'settings', 'currency'), {
      currency: '€'
    })
    
    // 2. Language
    console.log('🌐 Сохраняем language...')
    await setDoc(doc(db, 'users', userId, 'settings', 'language'), {
      language: 'ru'
    })
    
    // 3. Theme
    console.log('🎨 Сохраняем theme...')
    await setDoc(doc(db, 'users', userId, 'settings', 'theme'), {
      theme: 'system'
    })
    
    // 4. Features
    console.log('⚙️ Сохраняем features...')
    await setDoc(doc(db, 'users', userId, 'settings', 'features'), {
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
      }
    })
    
    // 5. AppName (если нет)
    console.log('📝 Сохраняем appName...')
    await setDoc(doc(db, 'users', userId, 'settings', 'appName'), {
      appName: 'MyGarage'
    })
    
    console.log('✅ Все настройки сохранены!')
    console.log('⚡ Перезагрузите страницу чтобы применить изменения')
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ Ошибка восстановления настроек:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    fixRegistrationSettings: typeof fixRegistrationSettings
  }
}

if (typeof window !== 'undefined') {
  window.fixRegistrationSettings = fixRegistrationSettings
}
