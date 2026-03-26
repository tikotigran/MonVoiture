import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// Проверяем доступ к users с новыми правилами
export async function checkUsersAccess() {
  try {
    console.log('🔍 Проверяем доступ к users...')
    
    // Проверяем авторизацию
    const currentUser = auth.currentUser
    console.log(`👤 Текущий пользователь: ${currentUser?.email || 'Не авторизован'}`)
    console.log(`🆔 UID: ${currentUser?.uid || 'Нет UID'}`)
    
    if (!currentUser) {
      console.log('❌ Пользователь не авторизован!')
      return { success: false, message: 'Пользователь не авторизован' }
    }
    
    if (currentUser.email !== 'tikjan1983@gmail.com') {
      console.log('❌ Пользователь не администратор!')
      return { success: false, message: 'Только администратор может получить доступ' }
    }
    
    // Проверяем доступ к users
    console.log('\n📥 Проверяем доступ к users:')
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      console.log(`✅ Доступ к users получен! Найдено: ${usersSnapshot.docs.length} пользователей`)
      
      if (usersSnapshot.docs.length > 0) {
        console.log('📄 Первые 3 пользователя:')
        usersSnapshot.docs.slice(0, 3).forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 100)}...`)
        })
      }
      
      // Проверяем вложенные коллекции первого пользователя
      if (usersSnapshot.docs.length > 0) {
        const firstUserId = usersSnapshot.docs[0].id
        console.log(`\n🏗️ Проверяем структуру пользователя ${firstUserId}:`)
        
        const subcollections = ['profile', 'cars', 'documents', 'settings', 'notifications']
        
        for (const subcoll of subcollections) {
          try {
            const subcollRef = collection(db, 'users', firstUserId, subcoll)
            const subcollSnapshot = await getDocs(subcollRef)
            console.log(`  📁 ${subcoll}: ${subcollSnapshot.docs.length} документов`)
            
            if (subcollSnapshot.docs.length > 0 && subcoll === 'profile') {
              subcollSnapshot.docs.forEach(doc => {
                console.log(`    📄 Профиль: ${JSON.stringify(doc.data()).slice(0, 120)}...`)
              })
            }
            
            if (subcollSnapshot.docs.length > 0 && subcoll === 'cars') {
              console.log(`    🚗 Машины:`)
              subcollSnapshot.docs.slice(0, 2).forEach(doc => {
                console.log(`      - ${doc.data().name || 'Без имени'} (${doc.data().purchasePrice || 0} EUR)`)
              })
            }
          } catch (error) {
            console.log(`  ❌ Ошибка доступа к ${subcoll}: ${error}`)
          }
        }
      }
      
      return {
        success: true,
        usersCount: usersSnapshot.docs.length,
        message: 'Доступ к users работает!'
      }
      
    } catch (error) {
      console.log(`❌ Ошибка доступа к users: ${error}`)
      return {
        success: false,
        message: `Ошибка доступа к users: ${(error as Error).message}`
      }
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error)
    return {
      success: false,
      message: `Общая ошибка: ${(error as Error).message}`
    }
  }
}

// Проверяем доступ к adminUsers для сравнения
export async function checkAdminUsersAccess() {
  try {
    console.log('\n👨‍💼 Проверяем доступ к adminUsers:')
    
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`📊 adminUsers: ${adminUsersSnapshot.docs.length} документов`)
    
    return {
      success: true,
      adminUsersCount: adminUsersSnapshot.docs.length,
      message: 'Доступ к adminUsers работает'
    }
    
  } catch (error) {
    console.log(`❌ Ошибка доступа к adminUsers: ${error}`)
    return {
      success: false,
      message: `Ошибка доступа к adminUsers: ${(error as Error).message}`
    }
  }
}

// Комплексная проверка
export async function fullAccessCheck() {
  console.log('🔍 Полная проверка доступа...\n')
  
  const usersResult = await checkUsersAccess()
  const adminUsersResult = await checkAdminUsersAccess()
  
  console.log('\n📊 Итоги:')
  console.log(`  👥 users: ${usersResult.success ? '✅' : '❌'} (${usersResult.usersCount || 0} пользователей)`)
  console.log(`  👨‍💼 adminUsers: ${adminUsersResult.success ? '✅' : '❌'} (${adminUsersResult.adminUsersCount || 0} пользователей)`)
  
  if (usersResult.success && usersResult.usersCount > 0) {
    console.log('\n🎉 Отлично! Админ панель должна работать с users!')
  } else if (!usersResult.success) {
    console.log(`\n⚠️ Проблема с доступом к users: ${usersResult.message}`)
  } else if (usersResult.usersCount === 0) {
    console.log('\n⚠️ users пуста, но adminUsers имеет данные')
  }
  
  return {
    usersAccess: usersResult,
    adminUsersAccess: adminUsersResult
  }
}

// Добавляем в window
declare global {
  interface Window {
    checkUsersAccess: typeof checkUsersAccess
    checkAdminUsersAccess: typeof checkAdminUsersAccess
    fullAccessCheck: typeof fullAccessCheck
  }
}

if (typeof window !== 'undefined') {
  window.checkUsersAccess = checkUsersAccess
  window.checkAdminUsersAccess = checkAdminUsersAccess
  window.fullAccessCheck = fullAccessCheck
}
