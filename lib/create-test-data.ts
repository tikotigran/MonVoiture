import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Создание тестовых данных для Firebase
export async function createTestData() {
  try {
    console.log('🔥 Создание тестовых данных в Firebase...')

    // 1. Создаем тестового пользователя
    const userRef = doc(db, 'users', 'test-user-1')
    await setDoc(userRef, {
      email: 'test@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
      garageName: 'Авто Гараж',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })

    // 2. Создаем тестовые машины
    const car1Ref = doc(db, 'cars', 'test-car-1')
    await setDoc(car1Ref, {
      userId: 'test-user-1',
      name: 'BMW X5 2020',
      purchasePrice: 15000,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    const car2Ref = doc(db, 'cars', 'test-car-2')
    await setDoc(car2Ref, {
      userId: 'test-user-1',
      name: 'Mercedes E-Class 2019',
      purchasePrice: 12000,
      salePrice: 14000,
      status: 'sold',
      saleDate: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    })

    // 3. Создаем тестовые расходы
    const expense1Ref = doc(db, 'expenses', 'test-expense-1')
    await setDoc(expense1Ref, {
      carId: 'test-car-1',
      amount: 500,
      category: 'parts',
      description: 'Новые тормозные колодки',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })

    const expense2Ref = doc(db, 'expenses', 'test-expense-2')
    await setDoc(expense2Ref, {
      carId: 'test-car-1',
      amount: 300,
      category: 'repair',
      description: 'Замена масла',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    })

    const expense3Ref = doc(db, 'expenses', 'test-expense-3')
    await setDoc(expense3Ref, {
      carId: 'test-car-2',
      amount: 800,
      category: 'parts',
      description: 'Ремонт двигателя',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    })

    // 4. Создаем тестовые документы
    const doc1Ref = doc(db, 'documents', 'test-doc-1')
    await setDoc(doc1Ref, {
      carId: 'test-car-1',
      name: 'СТС на BMW X5',
      type: 'registration',
      fileUrl: '/documents/sts-bmw-x5.pdf',
      createdAt: new Date().toISOString()
    })

    console.log('✅ Тестовые данные успешно созданы!')
    console.log('📊 Создано:')
    console.log('- 1 пользователь')
    console.log('- 2 машины')
    console.log('- 3 расхода')
    console.log('- 1 документ')

    return true
  } catch (error) {
    console.error('❌ Ошибка создания тестовых данных:', error)
    return false
  }
}

// Функция для вызова в консоли браузера
// В консоли админ панели введите: await createTestData()
declare global {
  interface Window {
    createTestData: typeof createTestData
  }
}

// Добавляем функцию в window для вызова из консоли
if (typeof window !== 'undefined') {
  window.createTestData = createTestData
}
