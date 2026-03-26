import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Проверка авторизации и данных в Firebase
export async function checkFirebaseAuth() {
  try {
    console.log('🔍 Проверка авторизации Firebase...')
    
    // Проверяем текущего пользователя
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        console.log('👤 Пользователь в localStorage:', user)
      } else {
        console.log('❌ Нет пользователя в localStorage')
        return { authenticated: false, error: 'No user in localStorage' }
      }
    }

    // Проверяем доступ к данным
    console.log('🔍 Проверка доступа к данным...')
    
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log('👥 Всего пользователей в Firestore:', usersSnapshot.docs.length)
    
    const carsSnapshot = await getDocs(collection(db, 'cars'))
    console.log('🚗 Всего машин в Firestore:', carsSnapshot.docs.length)
    
    const expensesSnapshot = await getDocs(collection(db, 'expenses'))
    console.log('💰 Всего расходов в Firestore:', expensesSnapshot.docs.length)

    // Показываем примеры данных
    if (usersSnapshot.docs.length > 0) {
      console.log('📝 Пример пользователя:', usersSnapshot.docs[0].data())
    }
    
    if (carsSnapshot.docs.length > 0) {
      console.log('🚗 Пример машины:', carsSnapshot.docs[0].data())
    }

    return {
      authenticated: true,
      usersCount: usersSnapshot.docs.length,
      carsCount: carsSnapshot.docs.length,
      expensesCount: expensesSnapshot.docs.length
    }
  } catch (error) {
    console.error('❌ Ошибка проверки Firebase:', error)
    return { authenticated: false, error: error.message }
  }
}

// Добавляем функцию в window для вызова из консоли
declare global {
  interface Window {
    checkFirebaseAuth: typeof checkFirebaseAuth
  }
}

if (typeof window !== 'undefined') {
  window.checkFirebaseAuth = checkFirebaseAuth
}
