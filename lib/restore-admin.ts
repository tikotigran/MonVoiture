import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Восстановление администратора в adminUsers
export async function restoreAdminUser() {
  try {
    console.log('🔄 Восстановление администратора в adminUsers...')
    
    const currentUser = auth.currentUser
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован')
      return { success: false, message: 'Пользователь не авторизован' }
    }
    
    console.log(`✅ Текущий пользователь: ${currentUser.email}`)
    
    // Проверяем является ли пользователь администратором
    if (currentUser.email !== 'tikjan1983@gmail.com') {
      console.log('❌ Текущий пользователь не администратор')
      return { success: false, message: 'Только tikjan1983@gmail.com может восстановить доступ' }
    }
    
    // Проверяем есть ли профиль пользователя
    const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'doc')
    const profileSnap = await getDoc(profileRef)
    
    let userData = {
      email: currentUser.email,
      firstName: 'Admin',
      lastName: 'User',
      garageName: 'Admin Garage',
      createdAt: new Date().toISOString()
    }
    
    if (profileSnap.exists()) {
      userData = { ...userData, ...profileSnap.data() }
      console.log('✅ Найден профиль пользователя')
    } else {
      console.log('ℹ️ Профиль не найден, используем базовые данные')
    }
    
    // Создаем запись в adminUsers
    const adminUserRef = doc(db, 'adminUsers', currentUser.uid)
    const adminUserData = {
      ...userData,
      role: 'admin',
      isActive: true,
      promotedAt: new Date().toISOString(),
      promotedBy: 'self-restore'
    }
    
    await setDoc(adminUserRef, adminUserData)
    console.log('✅ Администратор восстановлен в adminUsers')
    
    return {
      success: true,
      message: 'Администратор успешно восстановлен в adminUsers. Обновите страницу.'
    }
    
  } catch (error) {
    console.error('❌ Ошибка восстановления администратора:', error)
    return {
      success: false,
      message: `Ошибка восстановления: ${(error as Error).message}`
    }
  }
}

// Быстрая проверка и восстановление
export async function quickRestore() {
  try {
    console.log('⚡ Быстрое восстановление доступа...')
    
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.email !== 'tikjan1983@gmail.com') {
      return { success: false, message: 'Нужен аккаунт tikjan1983@gmail.com' }
    }
    
    // Создаем минимальную запись в adminUsers
    const adminUserRef = doc(db, 'adminUsers', currentUser.uid)
    await setDoc(adminUserRef, {
      email: currentUser.email,
      firstName: 'Admin',
      lastName: 'User',
      garageName: 'Admin Garage',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      promotedAt: new Date().toISOString(),
      promotedBy: 'quick-restore'
    })
    
    console.log('✅ Быстрое восстановление завершено')
    
    return {
      success: true,
      message: 'Доступ к админке восстановлен! Обновите страницу.'
    }
    
  } catch (error) {
    console.error('❌ Ошибка быстрого восстановления:', error)
    return {
      success: false,
      message: `Ошибка: ${(error as Error).message}`
    }
  }
}

// Добавляем в window
declare global {
  interface Window {
    restoreAdminUser: typeof restoreAdminUser
    quickRestore: typeof quickRestore
  }
}

if (typeof window !== 'undefined') {
  window.restoreAdminUser = restoreAdminUser
  window.quickRestore = quickRestore
}
