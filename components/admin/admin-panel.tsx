'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Car, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  Bell,
  Shield,
  Database,
  BarChart3,
  Search,
  Filter,
  Download,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Activity,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { usersOnlyAdminService, type AdminStats, type AdminUser, type AdminCar, type PopularBrand, type CategoryExpense } from '@/lib/admin-service-users-only'
import { mockAdminService } from '@/lib/admin-service-mock'
import '@/lib/create-test-data' // Добавляем импорт для создания тестовых данных
import '@/lib/check-firebase-auth' // Добавляем импорт для проверки Firebase
import '@/lib/check-firebase-config' // Добавляем импорт для проверки конфигурации
import '@/lib/check-firebase-project' // Добавляем импорт для проверки проекта
import '@/lib/debug-firebase-structure' // Добавляем импорт для отладки структуры
import '@/lib/debug-user-data' // Добавляем импорт для отладки данных пользователя
import '@/lib/find-all-users' // Добавляем импорт для поиска всех пользователей
import '@/lib/create-admin-users' // Добавляем импорт для создания пользователей в adminUsers
import '@/lib/admin-user-management' // Добавляем импорт для управления пользователями
import '@/lib/delete-user-completely' // Добавляем импорт для полного удаления пользователей
import '@/lib/delete-auth-user' // Добавляем импорт для удаления из Authentication
import '@/lib/auth-management' // Добавляем импорт для управления Authentication через Cloud Functions
import '@/lib/cleanup-admin-users' // Добавляем импорт для очистки adminUsers
import '@/lib/restore-admin' // Добавляем импорт для восстановления администратора
import '@/lib/sync-users-to-admin' // Добавляем импорт для синхронизации пользователей
import '@/lib/debug-tools' // Отладочные инструменты только для админки

export function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [systemCars, setSystemCars] = useState<AdminCar[]>([])
  const [popularBrands, setPopularBrands] = useState<PopularBrand[]>([])
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [useMockMode, setUseMockMode] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Функции управления пользователями
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${userEmail} и все его данные? Это действие необратимо!`)) {
      return
    }

    try {
      setActionLoading(userId)
      const service = useMockMode ? mockAdminService : usersOnlyAdminService
      const result = await service.deleteUser(userId)
      
      if (result.success) {
        alert(result.message)
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка удаления: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ПОЛНОЕ удаление пользователя из ВСЕХ мест (Firestore + Authentication)
  const handleDeleteUserCompletelyFromAdmin = async (userEmail: string) => {
    if (!confirm(`🚨 ВНИМАНИЕ! Это ПОЛНОЕ удаление пользователя ${userEmail} из:\n\n📊 Firestore (adminUsers, users, машины, расходы)\n🔐 Firebase Authentication\n\n✅ Пользователь НАВСЕГДА исчезнет из системы!\n\nПродолжить?`)) {
      return
    }

    try {
      setActionLoading('complete-auth-delete')
      
      // Используем Cloud Function для полного удаления
      const result = await (window as any).deleteUserCompletelyFromAdmin(userEmail)
      
      if (result.success) {
        alert(`🎉 ${result.message}`)
        
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка полного удаления: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlockUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Заблокировать пользователя ${userEmail}?`)) {
      return
    }

    try {
      setActionLoading(userId)
      const service = useMockMode ? mockAdminService : usersOnlyAdminService
      const result = await service.blockUser(userId)
      
      if (result.success) {
        alert(result.message)
        // Обновляем данные пользователя
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isActive: false } : user
        ))
      } else {
        alert(`Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка блокировки: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblockUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Разблокировать пользователя ${userEmail}?`)) {
      return
    }

    try {
      setActionLoading(userId)
      const service = useMockMode ? mockAdminService : usersOnlyAdminService
      const result = await service.unblockUser(userId)
      
      if (result.success) {
        alert(result.message)
        // Обновляем данные пользователя
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isActive: true } : user
        ))
      } else {
        alert(`Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка разблокировки: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendNotification = async (userId: string, userEmail: string) => {
    const title = prompt('Заголовок уведомления:')
    if (!title) return

    const message = prompt('Текст уведомления:')
    if (!message) return

    try {
      setActionLoading(userId)
      const service = useMockMode ? mockAdminService : usersOnlyAdminService
      const result = await service.sendNotification(userId, title, message)
      
      if (result.success) {
        alert(result.message)
      } else {
        alert(`Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка отправки: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCleanupInactive = async () => {
    const days = prompt('Удалить пользователей неактивных более (дней):', '180')
    if (!days) return

    try {
      setActionLoading('cleanup')
      const service = useMockMode ? mockAdminService : usersOnlyAdminService
      const result = await service.cleanupInactiveUsers(parseInt(days))
      
      if (result.success) {
        alert(result.message)
        if (result.deletedCount && result.deletedCount > 0) {
          window.location.reload()
        }
      } else {
        alert(`Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка очистки: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Очистка adminUsers - оставить только администраторов
  const handleCleanupAdminUsers = async () => {
    if (!confirm('🧹 Очистить adminUsers и оставить только администраторов?\n\nВсе обычные пользователи будут удалены из adminUsers, но останутся в users.\n\nЭто безопасно для данных пользователей.')) {
      return
    }

    try {
      setActionLoading('cleanup-admin')
      
      const result = await (window as any).cleanupAdminUsers()
      
      if (result.success) {
        alert(`✅ Очистка завершена!\n\n🗑️ Удалено обычных пользователей: ${result.deletedCount}\n✅ Оставлено администраторов: ${result.keptCount}`)
        
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`❌ Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка очистки adminUsers: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Проверка состояния adminUsers
  const handleCheckAdminUsersStatus = async () => {
    try {
      setActionLoading('check-status')
      
      const result = await (window as any).checkAdminUsersStatus()
      
      if (result.success) {
        const message = `📊 Состояние adminUsers:\n\n` +
          `👥 Всего пользователей в users: ${result.totalUsers}\n` +
          `👥 Всего записей в adminUsers: ${result.totalAdminUsers}\n` +
          `✅ Настоящие администраторы: ${result.realAdmins}\n` +
          `❌ Обычные пользователи в adminUsers: ${result.regularUsersInAdmin}\n\n` +
          `📋 Администраторы: ${result.adminUsersList.join(', ') || 'Нет'}\n` +
          `📋 Обычные пользователи: ${result.regularUsersInAdmin.join(', ') || 'Нет'}`
        
        alert(message)
      } else {
        alert(`❌ Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка проверки: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Синхронизация пользователей из users в adminUsers
  const handleSyncUsersToAdmin = async () => {
    if (!confirm('🔄 Синхронизировать всех пользователей из users в adminUsers?\n\nЭто загрузит всех пользователей из основной коллекции в админ панель для отображения статистики.')) {
      return
    }

    try {
      setActionLoading('sync-users')
      
      const result = await (window as any).syncAllUsersToAdmin()
      
      if (result.success) {
        alert(`✅ Синхронизация завершена!\n\n🔄 Синхронизировано: ${result.syncedCount}\n❌ Ошибок: ${result.errorCount}`)
        
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`❌ Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка синхронизации: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Быстрая синхронизация
  const handleQuickSyncUsers = async () => {
    if (!confirm('⚡ Быстрая синхронизация пользователей?\n\nСоздаст базовые записи для всех пользователей в adminUsers.')) {
      return
    }

    try {
      setActionLoading('quick-sync')
      
      const result = await (window as any).quickSyncUsers()
      
      if (result.success) {
        alert(`✅ Быстрая синхронизация завершена!\n\n📊 Синхронизировано: ${result.count}`)
        
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`❌ Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка быстрой синхронизации: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Обновление существующих пользователей
  const handleUpdateExistingUsers = async () => {
    if (!confirm('🔄 Обновить данные существующих пользователей?\n\nОбновит статистику (машины, расходы) для пользователей уже в adminUsers.')) {
      return
    }

    try {
      setActionLoading('update-users')
      
      const result = await (window as any).updateExistingUsers()
      
      if (result.success) {
        alert(`✅ Обновление завершено!\n\n🔄 Обновлено пользователей: ${result.updatedCount}`)
        
        // Перезагружаем данные
        window.location.reload()
      } else {
        alert(`❌ Ошибка: ${result.message}`)
      }
    } catch (error) {
      alert(`Ошибка обновления: ${(error as Error).message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Load data from Firebase or Mock service
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('[v0] AdminPanel: Starting data load, useMockMode:', useMockMode)

        const service = useMockMode ? mockAdminService : usersOnlyAdminService

        // Загружаем все данные параллельно
        console.log('[v0] AdminPanel: Calling service methods...')
        const [statsData, usersData, carsData, brandsData, categoriesData] = await Promise.all([
          service.getStats(),
          service.getUsers(),
          service.getCars(),
          service.getPopularBrands(),
          service.getCategoryExpenses()
        ])
        
        console.log('[v0] AdminPanel: Data loaded - stats:', statsData, 'users:', usersData.length, 'cars:', carsData.length)

        setStats(statsData)
        setUsers(usersData)
        setSystemCars(carsData)
        setPopularBrands(brandsData)
        setCategoryExpenses(categoriesData)

        // Данные загружены успешно - даже если они пустые, это не ошибка
      } catch (err) {
        console.error('Error loading admin data:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        
        if (errorMessage.includes('Missing or insufficient permissions')) {
          setError('Недостаточно прав доступа. Проверьте правила Firestore.')
        } else if (errorMessage.includes('network') || errorMessage.includes('offline')) {
          setError('Ошибка сети. Проверьте подключение к интернету.')
        } else {
          setError(`Ошибка загрузки: ${errorMessage}`)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [useMockMode])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.garageName && user.garageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p>Загрузка данных админ панели...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Ошибка доступа</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          
          {error.includes('прав доступа') && (
            <div className="bg-muted p-4 rounded-lg text-left mb-4">
              <h3 className="font-medium mb-2">🔧 Что нужно сделать:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Откройте Firebase Console</li>
                <li>Перейдите в Firestore Database → Rules</li>
                <li>Скопируйте правила из файла <code>firestore.rules</code></li>
                <li>Нажмите "Publish"</li>
                <li>Создайте пользователя tikjan1983@gmail.com в Authentication</li>
              </ol>
              <p className="text-xs mt-2">
                📄 Подробности в файле <code>FIREBASE_SETUP.md</code>
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => setUseMockMode(!useMockMode)}
              variant={useMockMode ? "default" : "outline"}
              className="w-full"
            >
              {useMockMode ? "🔴 Выключить демо-режим" : "🟢 Включить демо-режим"}
            </Button>
            <Button onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
            <Button variant="outline" onClick={() => window.open('/', '_blank')}>
              Перейти в приложение
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Админ Панель</h1>
            <p className="text-muted-foreground">Управление системой MonVoiture</p>
            {useMockMode && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Демо-режим (Mock данные)
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Экспорт данных
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newUsersThisMonth} за этот месяц
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Машины</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCars.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.carsSoldThisMonth} продано за месяц
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Расходы</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses, 'EUR')}</div>
                <p className="text-xs text-muted-foreground">
                  Общие расходы всех пользователей
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, 'EUR')}</div>
                <p className="text-xs text-muted-foreground">
                  Средняя цена: {formatCurrency(stats.avgCarPrice, 'EUR')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Машины
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Система
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>
                  Просмотр и управление всеми пользователями системы
                </CardDescription>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск пользователей..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterStatus('all')}
                    >
                      Все ({users.length})
                    </Button>
                    <Button
                      variant={filterStatus === 'active' ? 'default' : 'outline'}
                      onClick={() => setFilterStatus('active')}
                    >
                      Активные ({users.filter(u => u.isActive).length})
                    </Button>
                    <Button
                      variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                      onClick={() => setFilterStatus('inactive')}
                    >
                      Неактивные ({users.filter(u => !u.isActive).length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                          {(user.firstName?.charAt(0) || 'U')}{(user.lastName?.charAt(0) || '')}
                        </div>
                        <div>
                          <div className="font-medium">{user.firstName || 'Пользователь'} {user.lastName || ''}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.garageName || 'Без названия'} • {user.carCount} машин • {formatCurrency(user.totalExpenses, 'EUR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <Badge variant="outline">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendNotification(user.id, user.email)}
                          disabled={actionLoading === user.id}
                          title="Отправить уведомление"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        </Button>
                        {user.isActive ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBlockUser(user.id, user.email)}
                            disabled={actionLoading === user.id}
                            title="Заблокировать пользователя"
                          >
                            {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnblockUser(user.id, user.email)}
                            disabled={actionLoading === user.id}
                            title="Разблокировать пользователя"
                          >
                            {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={actionLoading === user.id}
                          title="Удалить только из Firestore"
                        >
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteUserCompletelyFromAdmin(user.email)}
                          disabled={actionLoading === 'complete-auth-delete'}
                          title="ПОЛНОЕ удаление из Firestore + Authentication (навсегда)"
                        >
                          {actionLoading === 'complete-auth-delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cars Tab */}
          <TabsContent value="cars" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Все машины системы</CardTitle>
                <CardDescription>
                  Просмотр всех машин пользователей и их статистики
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemCars.map((car) => (
                    <div key={car.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{car.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {car.userEmail} • {car.garageName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Добавлена: {new Date(car.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={car.status === 'sold' ? 'default' : 'secondary'}>
                          {car.status === 'sold' ? 'Продана' : 'Активна'}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(car.purchasePrice, 'EUR')}</div>
                          {car.salePrice && (
                            <div className="text-sm text-green-600">
                              Продано: {formatCurrency(car.salePrice, 'EUR')}
                              {car.profit && car.profit > 0 && (
                                <span className="ml-2">(+{formatCurrency(car.profit, 'EUR')})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Популярные марки машин</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {popularBrands.slice(0, 5).map((brand, index) => (
                      <div key={brand.brand} className="flex justify-between">
                        <span>{brand.brand}</span>
                        <span className="font-medium">{brand.count} машин</span>
                      </div>
                    ))}
                    {popularBrands.length === 0 && (
                      <div className="text-muted-foreground text-center py-4">
                        Нет данных
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Категории расходов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryExpenses.slice(0, 5).map((category, index) => (
                      <div key={category.category} className="flex justify-between">
                        <span>{category.category}</span>
                        <span className="font-medium">{formatCurrency(category.amount, 'EUR')}</span>
                      </div>
                    ))}
                    {categoryExpenses.length === 0 && (
                      <div className="text-muted-foreground text-center py-4">
                        Нет данных
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Активность пользователей</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span>Активные пользователи сегодня: {stats.activeUsers}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>Новых пользователей за неделю: {stats.newUsersThisMonth}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span>Машин добавлено сегодня: {stats.carsThisMonth}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Продано машин за неделю: {stats.carsSoldThisMonth}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Рассылка уведомлений</CardTitle>
                <CardDescription>
                  Отправка уведомлений всем пользователям системы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-title">Заголовок</Label>
                  <Input 
                    id="notification-title" 
                    placeholder="Введите заголовок уведомления" 
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Сообщение</Label>
                  <textarea
                    id="notification-message"
                    className="w-full min-h-[100px] p-3 border rounded-md"
                    placeholder="Введите текст сообщения..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSendNotification(notificationTitle, notificationMessage, false)}
                    disabled={!notificationTitle || !notificationMessage}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Отправить всем
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleSendNotification(notificationTitle, notificationMessage, true)}
                    disabled={!notificationTitle || !notificationMessage}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Только активным
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>История уведомлений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Обновление системы v2.0</div>
                    <div className="text-sm text-muted-foreground">
                      Отправлено: 15.03.2024 • Получено: 1,247 пользователей
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Плановое техническое обслуживание</div>
                    <div className="text-sm text-muted-foreground">
                      Отправлено: 10.03.2024 • Получено: 1,198 пользователей
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Резервное копирование
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Последнее копирование:</span>
                    <Badge>22.03.2024 14:30</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Размер базы данных:</span>
                    <span className="font-medium">2.4 GB</span>
                  </div>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Создать резервную копию
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Безопасность
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Статус безопасности:</span>
                    <Badge variant="default">Защищено</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Подозрительная активность:</span>
                    <Badge variant="secondary">0 за неделю</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Просмотр логов
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Очистка adminUsers
                  </CardTitle>
                  <CardDescription>
                    Удалить обычных пользователей из adminUsers, оставить только администраторов
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleCheckAdminUsersStatus}
                      disabled={actionLoading === 'check-status'}
                    >
                      {actionLoading === 'check-status' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      Проверить состояние
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleCleanupAdminUsers}
                      disabled={actionLoading === 'cleanup-admin'}
                    >
                      {actionLoading === 'cleanup-admin' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Очистить adminUsers
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Синхронизация пользователей
                  </CardTitle>
                  <CardDescription>
                    Загрузка пользователей из users в adminUsers для отображения в админке
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleQuickSyncUsers}
                      disabled={actionLoading === 'quick-sync'}
                    >
                      {actionLoading === 'quick-sync' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      ⚡ Быстрая синхронизация
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleSyncUsersToAdmin}
                      disabled={actionLoading === 'sync-users'}
                    >
                      {actionLoading === 'sync-users' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      🔄 Полная синхронизация
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleUpdateExistingUsers}
                      disabled={actionLoading === 'update-users'}
                    >
                      {actionLoading === 'update-users' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      🔄 Обновить статистику
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Очистка данных</CardTitle>
                <CardDescription>
                  Управление старыми и неактивными данными
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Неактивные пользователи</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Нет активности более 6 месяцев
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {users.filter(u => !u.isActive).length} пользователей
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleCleanupInactive}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Очистить
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Старые машины</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Созданы более года назад
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {systemCars.filter(car => {
                        const carDate = new Date(car.createdAt)
                        const oneYearAgo = new Date()
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
                        return carDate < oneYearAgo
                      }).length} машин
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Архивировать
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium">Общий размер данных</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Примерный размер базы данных
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {(JSON.stringify({ users, systemCars }).length / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Оптимизировать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
