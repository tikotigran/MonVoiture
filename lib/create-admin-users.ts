import { collection, doc, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Создание пользователей в корневой коллекции для админки
export async function createAdminUsers() {
  try {
    console.log('🔍 Создание пользователей в корневой коллекции для админки...')
    
    const userUIDs = [
      'E23mg5WspcbCbO97LYP5x5UqXcu1',
      'EXhH3I8UAlXDWGGjs3Vgolyep393', 
      'FrGuazyEbyZdHvlWmKyImuuffU62',
      'JfJFPGFfflQOsed7qnhEiEdUtA82',
      'Kzl80KTKmRfQkqtKzrHprwEu5YD2',
      'LLOgXGUqLNTWoQ9ij1QMTxLEo692',
      'LLRTRaR4olS6wOLVuZhSHVKADeY2',
      'Lg68alopKEPGPURxs26X4VwPCzS2',
      'P3hcqEXZK9ZIC1IWuhR9NPHdyoU2',
      'QnS814OyiLTP8yr5Bo4LuQcafN22',
      'TmO9nN9VzPcL07HA79vAgJYBWig2', // Админ
      'afzdhHrAv4RAXkwFGmezVSg8jVS2',
      'eN4YaniHlUMMCRuORQ387NrJdrj1',
      'lQNoBywY8UPwtj2oRM26kwiluYV2',
      'lnEENds1UWaZd2fb8JgjMeLJq7c2',
      'myIDP80lXVSBs7nSJy8HwzwtIHs1',
      'rdHp7JolKgY8Vf0K1zEd1QFgkiY2',
      'tnZMni4k67SqkeucMc9g3'
    ]
    
    console.log(`📝 Найдено ${userUIDs.length} пользователей для создания`)
    
    let createdCount = 0
    let updatedCount = 0
    
    for (const uid of userUIDs) {
      console.log(`\n🔍 Обработка пользователя: ${uid}`)
      
      try {
        // Проверяем есть ли уже пользователь в корневой коллекции
        const adminUserRef = doc(db, 'adminUsers', uid)
        const adminUserSnap = await getDoc(adminUserRef)
        
        // Получаем данные пользователя из его коллекции
        let userData: any = {
          uid: uid,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          carCount: 0,
          totalExpenses: 0,
          totalInvested: 0,
          carsSold: 0,
          totalProfit: 0
        }
        
        // Пытаемся получить профиль пользователя
        try {
          const profileRef = doc(db, 'users', uid, 'profile', 'doc')
          const profileSnap = await getDoc(profileRef)
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data()
            userData = {
              ...userData,
              email: profileData.email || '',
              firstName: profileData.firstName || '',
              lastName: profileData.lastName || '',
              garageName: profileData.garageName || '',
              phone: profileData.phone || '',
              createdAt: profileData.createdAt || userData.createdAt
            }
            console.log(`  👤 Профиль найден: ${profileData.email || 'no email'}`)
          } else {
            console.log(`  👤 Профиль не найден, используем базовые данные`)
          }
        } catch (profileError) {
          console.log(`  ❌ Ошибка получения профиля: ${profileError}`)
        }
        
        // Получаем количество машин
        try {
          const carsRef = collection(db, 'users', uid, 'cars')
          const carsSnap = await getDocs(carsRef)
          userData.carCount = carsSnap.docs.length
          
          // Считаем финансы по машинам
          let totalExpenses = 0
          let totalInvested = 0
          let carsSold = 0
          let totalProfit = 0
          
          carsSnap.forEach(carDoc => {
            const carData = carDoc.data()
            totalInvested += carData.purchasePrice || 0
            
            if (carData.status === 'sold') {
              carsSold++
              if (carData.salePrice && carData.purchasePrice) {
                totalProfit += (carData.salePrice - carData.purchasePrice)
              }
            }
            
            // Считаем расходы из данных машины
            if (carData.expenses && Array.isArray(carData.expenses)) {
              carData.expenses.forEach((expense: any) => {
                totalExpenses += expense.amount || 0
              })
            }
          })
          
          userData.totalExpenses = totalExpenses
          userData.totalInvested = totalInvested + totalExpenses
          userData.carsSold = carsSold
          userData.totalProfit = totalProfit
          
          console.log(`  🚗 Найдено ${userData.carCount} машин, расходы: ${totalExpenses} EUR`)
        } catch (carsError) {
          console.log(`  ❌ Ошибка получения машин: ${carsError}`)
        }
        
        // Создаем или обновляем пользователя в корневой коллекции
        if (adminUserSnap.exists()) {
          await updateDoc(adminUserRef, {
            ...userData,
            updatedAt: new Date().toISOString()
          })
          updatedCount++
          console.log(`  ✅ Пользователь обновлен в adminUsers`)
        } else {
          await setDoc(adminUserRef, {
            ...userData,
            createdAt: userData.createdAt,
            updatedAt: new Date().toISOString()
          })
          createdCount++
          console.log(`  ✅ Пользователь создан в adminUsers`)
        }
        
      } catch (error) {
        console.log(`  ❌ Ошибка обработки пользователя ${uid}: ${error}`)
      }
    }
    
    console.log(`\n🎉 Готово!`)
    console.log(`📝 Создано пользователей: ${createdCount}`)
    console.log(`📝 Обновлено пользователей: ${updatedCount}`)
    console.log(`📝 Всего обработано: ${createdCount + updatedCount}`)
    
    return {
      created: createdCount,
      updated: updatedCount,
      total: createdCount + updatedCount
    }
    
  } catch (error) {
    console.error('❌ Ошибка создания пользователей:', error)
    return null
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    createAdminUsers: typeof createAdminUsers
  }
}

if (typeof window !== 'undefined') {
  window.createAdminUsers = createAdminUsers
}
