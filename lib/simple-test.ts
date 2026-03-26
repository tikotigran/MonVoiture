import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Самый простой тест доступа
export async function simpleTest() {
  try {
    console.log('🔍 Простой тест доступа...')
    
    // Просто пробуем получить коллекцию
    const snapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`✅ Получено ${snapshot.docs.length} документов из adminUsers`)
    
    return { success: true, count: snapshot.docs.length }
  } catch (error) {
    console.error('❌ Ошибка простого теста:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Самая простая очистка
export async function simpleDelete() {
  try {
    console.log('🗑️ Простая очистка adminUsers...')
    
    const snapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`📋 Найдено ${snapshot.docs.length} документов`)
    
    let deleted = 0
    for (const docSnapshot of snapshot.docs) {
      const email = docSnapshot.data().email || 'no-email'
      console.log(`🔍 Проверяем: ${email}`)
      
      if (email !== 'tikjan1983@gmail.com') {
        console.log(`🗑️ Удаляем: ${email}`)
        await deleteDoc(docSnapshot.ref)
        deleted++
      } else {
        console.log(`✅ Оставляем: ${email}`)
      }
    }
    
    console.log(`✅ Удалено: ${deleted}`)
    return { success: true, deleted }
  } catch (error) {
    console.error('❌ Ошибка очистки:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    simpleTest: typeof simpleTest
    simpleDelete: typeof simpleDelete
  }
}

if (typeof window !== 'undefined') {
  window.simpleTest = simpleTest
  window.simpleDelete = simpleDelete
}
