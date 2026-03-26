import { getFirestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Проверка проекта Firebase
export async function checkFirebaseProject() {
  try {
    console.log('🔍 Проверка проекта Firebase:')
    console.log('📦 Project ID:', db.app.options.projectId)
    console.log('🌐 App Name:', db.app.name)
    console.log('🔗 Database URL:', `https://${db.app.options.projectId}.firebaseio.com`)
    
    // Проверяем доступ к коллекции users
    console.log('🔍 Тест доступа к users...')
    const usersRef = collection(db, 'users')
    console.log('📁 Users collection reference:', usersRef)
    
    // Проверяем путь к базе
    console.log('🗄️ Database path:', db._databaseId?.databaseId || 'default')
    
    return {
      projectId: db.app.options.projectId,
      appName: db.app.name,
      databaseId: db._databaseId?.databaseId || 'default'
    }
  } catch (error) {
    console.error('❌ Ошибка проверки проекта:', error)
    return { error: error.message }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    checkFirebaseProject: typeof checkFirebaseProject
  }
}

if (typeof window !== 'undefined') {
  window.checkFirebaseProject = checkFirebaseProject
}
