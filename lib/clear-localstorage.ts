// Полная очистка localStorage
export async function clearAllLocalStorage() {
  try {
    console.log('🗑️ Очищаем весь localStorage...')
    
    // Находим все ключи monvoiture
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('monvoiture')) {
        keysToRemove.push(key)
      }
    }
    
    // Удаляем все ключи monvoiture
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ Удален ключ: ${key}`)
    })
    
    console.log(`✅ Удалено ${keysToRemove.length} ключей localStorage`)
    console.log('⚡ Теперь все данные будут загружаться только из Firebase')
    console.log('🔄 Перезагрузите страницу!')
    
    return { success: true, removedKeys: keysToRemove.length }
    
  } catch (error) {
    console.error('❌ Ошибка очистки localStorage:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Добавляем в window
declare global {
  interface Window {
    clearAllLocalStorage: typeof clearAllLocalStorage
  }
}

if (typeof window !== 'undefined') {
  window.clearAllLocalStorage = clearAllLocalStorage
}
