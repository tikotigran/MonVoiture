import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Диагностика структуры данных в Firestore
export async function diagnoseFirestoreStructure() {
  try {
    console.log('🔍 Диагностика структуры Firestore...')
    
    let usersSnapshot: any = null
    let adminUsersSnapshot: any = null
    
    // 1. Проверяем корневые коллекции
    console.log('\n📋 Корневые коллекции:')
    try {
      usersSnapshot = await getDocs(collection(db, 'users'))
      console.log(`  👥 users: ${usersSnapshot.docs.length} документов`)
      
      if (usersSnapshot.docs.length > 0) {
        console.log('  📄 Пример документов users:')
        usersSnapshot.docs.slice(0, 3).forEach(doc => {
          console.log(`    - ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 100)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка users: ${error}`)
    }
    
    try {
      adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
      console.log(`  👨‍💼 adminUsers: ${adminUsersSnapshot.docs.length} документов`)
      
      if (adminUsersSnapshot.docs.length > 0) {
        console.log('  📄 Пример документов adminUsers:')
        adminUsersSnapshot.docs.slice(0, 3).forEach(doc => {
          console.log(`    - ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 100)}...`)
        })
      }
    } catch (error) {
      console.log(`  ❌ Ошибка adminUsers: ${error}`)
    }
    
    // 2. Проверяем структуру users
    console.log('\n🏗️ Структура users:')
    if (usersSnapshot && usersSnapshot.docs.length > 0) {
      for (let i = 0; i < Math.min(3, usersSnapshot.docs.length); i++) {
        const userDoc = usersSnapshot.docs[i]
        const userId = userDoc.id
        
        console.log(`\n  👤 Пользователь ${userId}:`)
        
        // Проверяем подколлекции
        const subcollections = ['profile', 'cars', 'documents', 'settings', 'notifications']
        
        for (const subcollName of subcollections) {
          try {
            const subcollRef = collection(db, 'users', userId, subcollName)
            const subcollSnapshot = await getDocs(subcollRef)
            console.log(`    📁 ${subcollName}: ${subcollSnapshot.docs.length} документов`)
            
            if (subcollSnapshot.docs.length > 0 && subcollName === 'profile') {
              subcollSnapshot.docs.forEach(doc => {
                console.log(`      📄 ${doc.id}: ${JSON.stringify(doc.data()).slice(0, 150)}...`)
              })
            }
            
            if (subcollSnapshot.docs.length > 0 && subcollName === 'cars') {
              console.log(`      🚗 Машины:`)
              subcollSnapshot.docs.slice(0, 2).forEach(doc => {
                console.log(`        - ${doc.id}: ${doc.data().name || 'Без имени'}`)
              })
            }
          } catch (error) {
            console.log(`    ❌ Ошибка ${subcollName}: ${error}`)
          }
        }
      }
    }
    
    // 3. Проверяем где реально есть данные
    console.log('\n🎯 Где находятся данные:')
    
    // Ищем профили в разных местах
    let foundProfiles = 0
    
    // В users/{userId}/profile/doc
    if (usersSnapshot && usersSnapshot.docs.length > 0) {
      for (const userDoc of usersSnapshot.docs) {
        try {
          const profileRef = doc(db, 'users', userDoc.id, 'profile', 'doc')
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            foundProfiles++
            if (foundProfiles <= 3) {
              console.log(`  ✅ Профиль найден в users/${userDoc.id}/profile/doc: ${profileSnap.data().email}`)
            }
          }
        } catch (error) {
          // Игнорируем
        }
      }
    }
    
    console.log(`  📊 Всего найдено профилей: ${foundProfiles}`)
    
    // Сравниваем с adminUsers
    if (adminUsersSnapshot && adminUsersSnapshot.docs.length > 0) {
      console.log(`  📊 В adminUsers: ${adminUsersSnapshot.docs.length} пользователей`)
      console.log(`  📊 В users: ${usersSnapshot?.docs.length || 0} пользователей`)
      
      if (adminUsersSnapshot.docs.length > (usersSnapshot?.docs.length || 0)) {
        console.log('  ⚠️ Данные есть в adminUsers, но не в users!')
        console.log('  💡 Нужно перенести данные из adminUsers в users')
      }
    }
    
    return {
      success: true,
      usersCount: usersSnapshot?.docs.length || 0,
      adminUsersCount: adminUsersSnapshot?.docs.length || 0,
      foundProfiles
    }
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

// Перенос данных из adminUsers в users
export async function migrateFromAdminUsersToUsers() {
  try {
    console.log('🔄 Перенос данных из adminUsers в users...')
    
    // Получаем всех из adminUsers
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'))
    console.log(`📋 Найдено ${adminUsersSnapshot.docs.length} пользователей в adminUsers`)
    
    let migrated = 0
    let errors = 0
    
    for (const adminDoc of adminUsersSnapshot.docs) {
      const userId = adminDoc.id
      const adminData = adminDoc.data()
      
      try {
        console.log(`🔄 Перенос пользователя: ${adminData.email || userId}`)
        
        // Создаем профиль в users
        const profileRef = doc(db, 'users', userId, 'profile', 'doc')
        await setDoc(profileRef, {
          email: adminData.email || 'unknown@example.com',
          firstName: adminData.firstName || 'Unknown',
          lastName: adminData.lastName || 'User',
          garageName: adminData.garageName || 'Unknown Garage',
          createdAt: adminData.createdAt || new Date().toISOString(),
          isActive: adminData.isActive !== false,
          migratedFrom: 'adminUsers',
          migratedAt: new Date().toISOString()
        })
        
        // Переносим машины если есть
        if (adminData.cars && Array.isArray(adminData.cars)) {
          const carsRef = collection(db, 'users', userId, 'cars')
          
          for (const car of adminData.cars) {
            const carRef = doc(carsRef)
            await setDoc(carRef, {
              ...car,
              userId,
              migratedFrom: 'adminUsers'
            })
          }
        }
        
        migrated++
        console.log(`  ✅ Перенесен: ${adminData.email}`)
        
      } catch (error) {
        console.log(`  ❌ Ошибка переноса ${userId}: ${error}`)
        errors++
      }
    }
    
    console.log(`🎉 Перенос завершен!`)
    console.log(`✅ Успешно: ${migrated}`)
    console.log(`❌ Ошибок: ${errors}`)
    
    return {
      success: true,
      migrated,
      errors,
      message: `Перенесено: ${migrated}, ошибок: ${errors}`
    }
    
  } catch (error) {
    console.error('❌ Ошибка переноса:', error)
    return {
      success: false,
      migrated: 0,
      errors: 1,
      message: `Ошибка переноса: ${(error as Error).message}`
    }
  }
}

// Добавляем в window
declare global {
  interface Window {
    diagnoseFirestoreStructure: typeof diagnoseFirestoreStructure
    migrateFromAdminUsersToUsers: typeof migrateFromAdminUsersToUsers
  }
}

if (typeof window !== 'undefined') {
  window.diagnoseFirestoreStructure = diagnoseFirestoreStructure
  window.migrateFromAdminUsersToUsers = migrateFromAdminUsersToUsers
}
