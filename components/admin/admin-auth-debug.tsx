'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export function AdminAuthDebug() {
  const [authStatus, setAuthStatus] = useState<string>('checking')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Проверяем статус аутентификации
    const checkAuth = () => {
      try {
        // Проверяем localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
          
          if (user.email === 'tikjan1983@gmail.com') {
            setAuthStatus('admin_authenticated')
          } else {
            setAuthStatus('user_authenticated')
          }
        } else {
          setAuthStatus('not_authenticated')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setAuthStatus('error')
      }
    }

    checkAuth()

    // Проверяем каждые 2 секунды
    const interval = setInterval(checkAuth, 2000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (authStatus) {
      case 'admin_authenticated': return 'text-green-600'
      case 'user_authenticated': return 'text-blue-600'
      case 'not_authenticated': return 'text-red-600'
      case 'error': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'admin_authenticated': return <CheckCircle className="w-5 h-5" />
      case 'user_authenticated': return <CheckCircle className="w-5 h-5" />
      case 'not_authenticated': return <XCircle className="w-5 h-5" />
      case 'error': return <AlertTriangle className="w-5 h-5" />
      default: return <AlertTriangle className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Диагностика админ аутентификации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">Статус:</span>
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="font-medium">
                  {authStatus === 'admin_authenticated' && '✅ Админ авторизован'}
                  {authStatus === 'user_authenticated' && '👤 Пользователь авторизован'}
                  {authStatus === 'not_authenticated' && '❌ Не авторизован'}
                  {authStatus === 'error' && '⚠️ Ошибка проверки'}
                  {authStatus === 'checking' && '🔄 Проверка...'}
                </span>
              </div>
            </div>

            {currentUser && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Email:</strong> {currentUser.email}
                </div>
                <div className="text-sm">
                  <strong>UID:</strong> {currentUser.uid || 'N/A'}
                </div>
                <div className="text-sm">
                  <strong>Is Admin:</strong> {currentUser.email === 'tikjan1983@gmail.com' ? '✅ Да' : '❌ Нет'}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium mb-2">🔧 Что делать:</h3>
              
              {authStatus === 'not_authenticated' && (
                <div className="bg-red-50 p-3 rounded text-sm">
                  <p className="font-medium text-red-800 mb-2">❌ Админ не авторизован!</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Откройте <a href="http://localhost:3000/admin" target="_blank" className="text-blue-600 underline">админ панель</a></li>
                    <li>Создайте пользователя tikjan1983@gmail.com в Authentication</li>
                    <li>Обновите эту страницу</li>
                  </ol>
                </div>
              )}

              {authStatus === 'user_authenticated' && (
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p className="font-medium text-blue-800 mb-2">👤 Авторизован обычный пользователь</p>
                  <p>Нужно выйти и войти как админ:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Выйдите из системы</li>
                    <li>Откройте админ панель</li>
                    <li>Войдите как tikjan1983@gmail.com</li>
                  </ol>
                </div>
              )}

              {authStatus === 'admin_authenticated' && (
                <div className="bg-green-50 p-3 rounded text-sm">
                  <p className="font-medium text-green-800 mb-2">✅ Все готово для реального режима!</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Выйдите из демо-режима в админ панели</li>
                    <li>Обновите страницу</li>
                    <li>Попробуйте загрузить реальные данные</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()}>
                  🔄 Обновить
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('http://localhost:3000/admin', '_blank')}
                >
                  🚪 Админ панель
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/', '_blank')}
                >
                  🏠 Основное приложение
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
