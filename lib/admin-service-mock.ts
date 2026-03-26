import { type AdminStats, type AdminUser, type AdminCar, type PopularBrand, type CategoryExpense } from './admin-service'

// Mock данные для тестирования без Firebase
const mockStats: AdminStats = {
  totalUsers: 3,
  totalCars: 8,
  totalExpenses: 12500,
  totalRevenue: 45000,
  activeUsers: 2,
  newUsersThisMonth: 1,
  carsSoldThisMonth: 2,
  avgCarPrice: 8750,
  totalProfit: 5000,
  carsThisMonth: 3
}

const mockUsers: AdminUser[] = [
  {
    id: 'user1',
    email: 'user1@example.com',
    garageName: 'AutoPro',
    firstName: 'Иван',
    lastName: 'Петров',
    createdAt: '2024-01-15',
    lastLogin: '2024-03-22',
    isActive: true,
    carCount: 3,
    totalExpenses: 4500,
    totalInvested: 25000,
    carsSold: 1,
    totalProfit: 2000
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    garageName: 'Speed Garage',
    firstName: 'Мария',
    lastName: 'Иванова',
    createdAt: '2024-02-20',
    lastLogin: '2024-03-21',
    isActive: true,
    carCount: 2,
    totalExpenses: 3200,
    totalInvested: 18000,
    carsSold: 1,
    totalProfit: 1500
  },
  {
    id: 'user3',
    email: 'inactive@example.com',
    garageName: 'Old Garage',
    firstName: 'Алексей',
    lastName: 'Смирнов',
    createdAt: '2023-12-10',
    lastLogin: '2024-01-15',
    isActive: false,
    carCount: 1,
    totalExpenses: 1200,
    totalInvested: 8000,
    carsSold: 0,
    totalProfit: 0
  }
]

const mockCars: AdminCar[] = [
  {
    id: 'car1',
    userId: 'user1',
    userEmail: 'user1@example.com',
    garageName: 'AutoPro',
    name: 'BMW X5',
    purchasePrice: 15000,
    salePrice: 17000,
    status: 'sold',
    createdAt: '2024-01-20',
    profit: 2000,
    expensesCount: 5,
    totalExpenses: 2500
  },
  {
    id: 'car2',
    userId: 'user1',
    userEmail: 'user1@example.com',
    garageName: 'AutoPro',
    name: 'Mercedes E-Class',
    purchasePrice: 12000,
    status: 'active',
    createdAt: '2024-02-10',
    expensesCount: 3,
    totalExpenses: 1800
  },
  {
    id: 'car3',
    userId: 'user2',
    userEmail: 'user2@example.com',
    garageName: 'Speed Garage',
    name: 'Audi A4',
    purchasePrice: 10000,
    salePrice: 11500,
    status: 'sold',
    createdAt: '2024-02-25',
    profit: 1500,
    expensesCount: 2,
    totalExpenses: 1200
  }
]

const mockBrands: PopularBrand[] = [
  { brand: 'BMW', count: 2 },
  { brand: 'Mercedes', count: 1 },
  { brand: 'Audi', count: 1 },
  { brand: 'Volkswagen', count: 1 }
]

const mockCategories: CategoryExpense[] = [
  { category: 'parts', amount: 5000 },
  { category: 'repair', amount: 3500 },
  { category: 'documents', amount: 2000 },
  { category: 'other', amount: 2000 }
]

export class MockAdminService {
  async getStats(): Promise<AdminStats> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockStats), 500)
    })
  }

  async getUsers(): Promise<AdminUser[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockUsers), 500)
    })
  }

  async getCars(): Promise<AdminCar[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockCars), 500)
    })
  }

  async getPopularBrands(): Promise<PopularBrand[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockBrands), 500)
    })
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockCategories), 500)
    })
  }

  async blockUser(userId: string): Promise<void> {
    console.log('Mock blocking user:', userId)
    return new Promise(resolve => {
      setTimeout(resolve, 500)
    })
  }

  async sendNotification(title: string, message: string, onlyActive: boolean = false): Promise<void> {
    console.log('Mock sending notification:', { title, message, onlyActive })
    return new Promise(resolve => {
      setTimeout(resolve, 500)
    })
  }

  async cleanupInactiveUsers(): Promise<number> {
    console.log('Mock cleaning up inactive users')
    return new Promise(resolve => {
      setTimeout(() => resolve(1), 500)
    })
  }
}

export const mockAdminService = new MockAdminService()
