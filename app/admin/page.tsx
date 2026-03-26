'use client'

import { useState, useEffect } from 'react'
import { AdminPanel } from '@/components/admin/admin-panel'
import { LoginScreen } from '@/components/login-screen'
import { useAuth } from '@/hooks/use-auth'

// В реальном приложении здесь будет проверка прав администратора
const ADMIN_EMAIL = 'tikjan1983@gmail.com' // или проверка через Firebase auth

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, login } = useAuth()

  useEffect(() => {
    // Проверка авторизации администратора через Firebase auth
    const checkAdminAuth = async () => {
      try {
        if (user && user.email === ADMIN_EMAIL) {
          console.log('✅ Admin authenticated:', user.email)
          setIsAuthenticated(true)
        } else {
          console.log('❌ User not admin or not logged in')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking admin auth:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAuth()
  }, [user])

  const handleAdminLogin = async (email: string, password: string) => {
    // Используем Firebase auth для входа
    try {
      await login(email, password)
      // Проверка будет в useEffect после обновления user
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Неверные данные администратора')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleAdminLogin}
        title="Админ Панель"
        subtitle="Вход в систему управления"
        buttonText="Войти как администратор"
      />
    )
  }

  return <AdminPanel />
}
