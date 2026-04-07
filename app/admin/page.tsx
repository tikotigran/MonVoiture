'use client'

import { useState, useEffect } from 'react'
import { AdminPanel } from '@/components/admin/admin-panel'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react'

// В реальном приложении здесь будет проверка прав администратора
const ADMIN_EMAIL = 'tikjan1983@gmail.com' // или проверка через Firebase auth

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, login, error: authError, loading: authLoading } = useAuth()
  
  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    // Проверка авторизации администратора через Firebase auth
    const checkAdminAuth = async () => {
      try {
        if (user && user.email === ADMIN_EMAIL) {
          setIsAuthenticated(true)
        } else if (user) {
          setLoginError(`Пользователь ${user.email} не является администратором`)
          setIsAuthenticated(false)
        } else {
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    if (!email.trim()) {
      setLoginError('Введите email')
      return
    }
    if (!password) {
      setLoginError('Введите пароль')
      return
    }
    
    // Используем Firebase auth для входа
    try {
      await login(email, password)
      // Проверка будет в useEffect после обновления user
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Ошибка входа: неверные данные')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Админ Панель
            </h1>
            <p className="text-sm text-muted-foreground">
              Вход в систему управления MonVoiture
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email администратора
              </label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Пароль
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {(loginError || authError) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{loginError || authError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={authLoading}
            >
              {authLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Вход...
                </span>
              ) : (
                'Войти как администратор'
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <Button 
              variant="link" 
              className="text-sm text-muted-foreground"
              onClick={() => window.open('/', '_blank')}
            >
              Перейти в основное приложение
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return <AdminPanel />
}
