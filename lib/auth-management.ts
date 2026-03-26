import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from '@/lib/firebase'

// Инициализация Firebase Functions
const functions = getFunctions(undefined, 'europe-west1') // Укажите ваш регион

// Удаление пользователя из Authentication через Cloud Function
export async function deleteAuthUserFromAdmin(email: string): Promise<{success: boolean, message: string, uid?: string}> {
  try {
    console.log(`🔐 Удаление пользователя ${email} из Authentication через Cloud Function...`)
    
    const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
    const result = await deleteAuthUser({ email });
    
    console.log('✅ Результат удаления из Authentication:', result.data);
    
    return result.data as {success: boolean, message: string, uid?: string};
    
  } catch (error) {
    console.error('❌ Ошибка удаления из Authentication:', error);
    
    // Обработка ошибок Firebase Functions
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return {
          success: false,
          message: 'Отказано в доступе. Только администратор может удалять пользователей.'
        };
      } else if (error.message.includes('not-found')) {
        return {
          success: false,
          message: 'Пользователь не найден в Authentication.'
        };
      }
    }
    
    return {
      success: false,
      message: `Ошибка удаления: ${(error as Error).message}`
    };
  }
}

// Проверка существует ли пользователь в Authentication
export async function checkAuthUserExists(email: string): Promise<{success: boolean, exists: boolean, message?: string, user?: any}> {
  try {
    console.log(`🔍 Проверка пользователя ${email} в Authentication...`)
    
    const checkAuthUser = httpsCallable(functions, 'checkAuthUser');
    const result = await checkAuthUser({ email });
    
    console.log('✅ Результат проверки:', result.data);
    
    return result.data as {success: boolean, exists: boolean, message?: string, user?: any};
    
  } catch (error) {
    console.error('❌ Ошибка проверки пользователя:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return {
          success: false,
          exists: false,
          message: 'Отказано в доступе. Только администратор может проверять пользователей.'
        };
      }
    }
    
    return {
      success: false,
      exists: false,
      message: `Ошибка проверки: ${(error as Error).message}`
    };
  }
}

// Получение списка всех пользователей в Authentication
export async function getAllAuthUsers(): Promise<{success: boolean, users?: any[], message?: string}> {
  try {
    console.log('📋 Получение списка всех пользователей Authentication...')
    
    const listAuthUsers = httpsCallable(functions, 'listAuthUsers');
    const result = await listAuthUsers();
    
    console.log('✅ Получен список пользователей:', result.data);
    
    return result.data as {success: boolean, users?: any[], message?: string};
    
  } catch (error) {
    console.error('❌ Ошибка получения списка пользователей:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return {
          success: false,
          message: 'Отказано в доступе. Только администратор может просматривать пользователей.'
        };
      }
    }
    
    return {
      success: false,
      message: `Ошибка получения списка: ${(error as Error).message}`
    };
  }
}

// ПОЛНОЕ удаление пользователя (Firestore + Authentication)
export async function deleteUserCompletelyFromAdmin(userEmail: string): Promise<{success: boolean, message: string, details?: any}> {
  try {
    console.log(`🗑️ ПОЛНОЕ удаление пользователя ${userEmail} из всех мест...`)
    
    const details = {
      firestoreDeleted: false,
      authDeleted: false,
      firestoreItems: 0,
      authUid: null
    };
    
    // Шаг 1: Удаляем из Firestore
    try {
      const result = await (window as any).deleteUserCompletelyEverywhere(userEmail);
      if (result.success) {
        details.firestoreDeleted = true;
        details.firestoreItems = result.deletedItems;
        console.log(`✅ Удалено из Firestore: ${result.deletedItems} элементов`);
      } else {
        console.log(`❌ Ошибка удаления из Firestore: ${result.message}`);
      }
    } catch (firestoreError) {
      console.log(`❌ Ошибка Firestore: ${firestoreError}`);
    }
    
    // Шаг 2: Удаляем из Authentication
    try {
      const authResult = await deleteAuthUserFromAdmin(userEmail);
      if (authResult.success) {
        details.authDeleted = true;
        details.authUid = authResult.uid;
        console.log(`✅ Удален из Authentication: ${authResult.uid}`);
      } else {
        console.log(`❌ Ошибка удаления из Authentication: ${authResult.message}`);
      }
    } catch (authError) {
      console.log(`❌ Ошибка Authentication: ${authError}`);
    }
    
    // Шаг 3: Результат
    const success = details.firestoreDeleted && details.authDeleted;
    
    const message = success 
      ? `✅ Пользователь ${userEmail} ПОЛНОСТЬЮ удален из всех мест!\n\n📊 Firestore: ${details.firestoreItems} элементов\n🔐 Authentication: ${details.authUid}`
      : `⚠️ Частичное удаление пользователя ${userEmail}:\n\n📊 Firestore: ${details.firestoreDeleted ? 'Да' : 'Нет'} (${details.firestoreItems} элементов)\n🔐 Authentication: ${details.authDeleted ? 'Да' : 'Нет'}\n\n${details.authDeleted ? '' : '\n💡 Для удаления из Authentication используйте Firebase Console'}`;
    
    return {
      success,
      message,
      details
    };
    
  } catch (error) {
    console.error('❌ Ошибка полного удаления:', error);
    return {
      success: false,
      message: `Ошибка полного удаления: ${(error as Error).message}`
    };
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    deleteAuthUserFromAdmin: typeof deleteAuthUserFromAdmin
    checkAuthUserExists: typeof checkAuthUserExists
    getAllAuthUsers: typeof getAllAuthUsers
    deleteUserCompletelyFromAdmin: typeof deleteUserCompletelyFromAdmin
  }
}

if (typeof window !== 'undefined') {
  window.deleteAuthUserFromAdmin = deleteAuthUserFromAdmin
  window.checkAuthUserExists = checkAuthUserExists
  window.getAllAuthUsers = getAllAuthUsers
  window.deleteUserCompletelyFromAdmin = deleteUserCompletelyFromAdmin
}
