import { collection, getDocs, doc, deleteDoc, writeBatch, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

// Функция для создания запроса на удаление из Authentication
export async function requestAuthUserDeletion(userEmail: string): Promise<{success: boolean, message: string, deletionId?: string}> {
  try {
    console.log(`📝 Создание запроса на удаление из Authentication для ${userEmail}...`)
    
    // Создаем специальную коллекцию для запросов на удаление
    const deletionRequestRef = doc(collection(db, 'authDeletionRequests'))
    const deletionId = deletionRequestRef.id
    
    await setDoc(deletionRequestRef, {
      id: deletionId,
      email: userEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestedBy: auth.currentUser?.email || 'admin',
      processedAt: null,
      result: null
    })
    
    console.log(`✅ Запрос создан: ${deletionId}`)
    
    return {
      success: true,
      message: `Запрос на удаление из Authentication создан. ID: ${deletionId}. Для выполнения удаления используйте Firebase Console или Admin SDK.`,
      deletionId
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания запроса:', error)
    return {
      success: false,
      message: `Ошибка создания запроса: ${(error as Error).message}`
    }
  }
}

// Функция для проверки статуса удаления
export async function checkDeletionStatus(deletionId: string): Promise<{success: boolean, status: string, message: string}> {
  try {
    const deletionRef = doc(db, 'authDeletionRequests', deletionId)
    const deletionSnap = await getDoc(deletionRef)
    
    if (!deletionSnap.exists()) {
      return {
        success: false,
        status: 'not_found',
        message: 'Запрос на удаление не найден'
      }
    }
    
    const data = deletionSnap.data()
    
    return {
      success: true,
      status: data.status,
      message: `Статус: ${data.status}. Создан: ${data.createdAt}. Обработан: ${data.processedAt || 'еще не обработан'}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки статуса:', error)
    return {
      success: false,
      status: 'error',
      message: `Ошибка проверки статуса: ${(error as Error).message}`
    }
  }
}

// Функция для немедленного выхода пользователя
export async function forceLogoutUser() {
  try {
    console.log('🚪 Принудительный выход пользователя...')
    await signOut(auth)
    console.log('✅ Пользователь вышел из системы')
    return true
  } catch (error) {
    console.error('❌ Ошибка выхода:', error)
    return false
  }
}

// Функция для проверки существует ли пользователь в Authentication
export async function checkIfUserExistsInAuth(userEmail: string): Promise<{exists: boolean, message: string}> {
  try {
    // В клиентском коде нет прямого способа проверить существование пользователя
    // Но можно попробовать войти и проверить ошибку
    
    console.log(`🔍 Проверка существования пользователя ${userEmail} в Authentication...`)
    
    // Это только для проверки - не реальный вход
    // В реальном приложении нужен бэкенд с Admin SDK
    
    return {
      exists: true, // Предполагаем что существует, если не знаем точно
      message: 'Проверка требует Firebase Admin SDK. Используйте Firebase Console для точной проверки.'
    }
    
  } catch (error) {
    return {
      exists: false,
      message: `Ошибка проверки: ${(error as Error).message}`
    }
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    requestAuthUserDeletion: typeof requestAuthUserDeletion
    checkDeletionStatus: typeof checkDeletionStatus
    forceLogoutUser: typeof forceLogoutUser
    checkIfUserExistsInAuth: typeof checkIfUserExistsInAuth
  }
}

if (typeof window !== 'undefined') {
  window.requestAuthUserDeletion = requestAuthUserDeletion
  window.checkDeletionStatus = checkDeletionStatus
  window.forceLogoutUser = forceLogoutUser
  window.checkIfUserExistsInAuth = checkIfUserExistsInAuth
}
