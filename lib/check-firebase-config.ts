// Проверка конфигурации Firebase
export function checkFirebaseConfig() {
  console.log('🔍 Проверка конфигурации Firebase:')
  console.log('🔑 API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Есть' : '❌ Нет')
  console.log('🌐 Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Нет')
  console.log('📦 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Нет')
  console.log('📱 App ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Есть' : '❌ Нет')
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error('❌ ОШИБКА: NEXT_PUBLIC_FIREBASE_PROJECT_ID не найден!')
    console.log('📝 Проверьте файл .env.local')
    return false
  }
  
  console.log('✅ Конфигурация Firebase корректна')
  return true
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    checkFirebaseConfig: typeof checkFirebaseConfig
  }
}

if (typeof window !== 'undefined') {
  window.checkFirebaseConfig = checkFirebaseConfig
}
