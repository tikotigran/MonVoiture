import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Роли пользователей (упрощенная система)
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Список администраторов (только для входа в админ панель)
export const ADMIN_USERS = [
  'tikjan1983@gmail.com'
]

// Проверка является ли пользователь администратором
export function isAdmin(email: string): boolean {
  return ADMIN_USERS.includes(email)
}

// Проверка роли пользователя
export function getUserRole(email: string): UserRole {
  return isAdmin(email) ? UserRole.ADMIN : UserRole.USER
}

// Проверка прав доступа к админ панели
export function hasAdminPanelAccess(email: string): boolean {
  return isAdmin(email)
}

// Простая проверка текущего пользователя
export function checkCurrentUserAdmin() {
  // Получаем текущего пользователя из localStorage или auth
  const currentUserEmail = localStorage.getItem('userEmail') || ''
  const isAdmin = hasAdminPanelAccess(currentUserEmail)
  
  console.log(`🔍 Проверка пользователя: ${currentUserEmail}`)
  console.log(`👑 Администратор: ${isAdmin ? 'Да' : 'Нет'}`)
  
  return {
    email: currentUserEmail,
    isAdmin,
    hasAccess: isAdmin
  }
}

// Добавляем в window для вызова из консоли
declare global {
  interface Window {
    isAdmin: typeof isAdmin
    getUserRole: typeof getUserRole
    hasAdminPanelAccess: typeof hasAdminPanelAccess
    checkCurrentUserAdmin: typeof checkCurrentUserAdmin
  }
}

if (typeof window !== 'undefined') {
  window.isAdmin = isAdmin
  window.getUserRole = getUserRole
  window.hasAdminPanelAccess = hasAdminPanelAccess
  window.checkCurrentUserAdmin = checkCurrentUserAdmin
}
