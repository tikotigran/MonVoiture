'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/header'
import { CarCard } from '@/components/car-card'
import { CarDetails } from '@/components/car-details'
import { CarDocuments } from '@/components/car-documents'
import { AddCarForm } from '@/components/add-car-form-per-car'
import { EditCarForm } from '@/components/edit-car-form'
import { SettingsSheet } from '@/components/settings-sheet'
import { EmptyState } from '@/components/empty-state'
import { StatsSummary } from '@/components/stats-summary'
import { Dashboard } from '@/components/dashboard'
import { LoginScreen } from '@/components/login-screen'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { DynamicHead } from '@/components/dynamic-head'
import { type Car, Partner } from '@/lib/types'
import { t } from '@/lib/translations'

type FilterType = 'all' | 'active' | 'sold'
type SortType = 'default' | 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

export default function Home() {
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth()
  const {
    state,
    isLoaded,
    addCar,
    updateCar,
    deleteCar,
    addExpense,
    updateExpense,
    deleteExpense,
    sellCar,
    updateSoldCar,
    returnToSale,
    updateCurrency,
    updateLanguage,
    updateFeatures,
    updateAppName,
    updatePartners,
    addDocument,
    deleteDocument,
    updateTheme,
    updateUserInfo,
    resetGarage,
  } = useAppStore(user?.uid)

  // СОСТОЯНИЕ ДЛЯ БЛОКИРОВКИ МИГАНИЯ
  const [dataReady, setDataReady] = useState(false)

  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('default')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [showAddCar, setShowAddCar] = useState(false)
  const [showEditCar, setShowEditCar] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDashboard, setShowDashboard] = useState(true)

  // Ждем, пока isLoaded станет true, и даем React время "прожевать" данные
  useEffect(() => {
    if (isLoaded && !authLoading && user) {
      // Использование requestAnimationFrame гарантирует, что мы дождемся цикла отрисовки
      const timer = setTimeout(() => {
        setDataReady(true)
      }, 400) 
      return () => clearTimeout(timer)
    } else if (!user) {
      setDataReady(false)
    }
  }, [isLoaded, authLoading, user])

  // Apply theme changes immediately
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (state.settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(state.settings.theme)
    }
  }, [state.settings.theme])

  const filteredCars = useMemo(() => {
    let cars = state.cars
    if (filter !== 'all') {
      cars = cars.filter((car) => car.status === filter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      cars = cars.filter((car) => 
        car.name.toLowerCase().includes(query) ||
        car.purchasePrice.toString().includes(query) ||
        (car.salePrice && car.salePrice.toString().includes(query))
      )
    }
    if (state.settings.features?.sorting) {
      cars.sort((a, b) => {
        switch (sortBy) {
          case 'default':
            const aModified = new Date(a.lastModified || a.purchaseDate).getTime()
            const bModified = new Date(b.lastModified || b.purchaseDate).getTime()
            return bModified - aModified
          case 'date-desc':
            const aCreated = new Date(a.createdAt || a.id).getTime()
            const bCreated = new Date(b.createdAt || b.id).getTime()
            return bCreated - aCreated
          case 'date-asc':
            return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
          case 'name-asc':
            return a.name.localeCompare(b.name)
          case 'name-desc':
            return b.name.localeCompare(a.name)
          default:
            return 0
        }
      })
    }
    return cars
  }, [state.cars, filter, searchQuery, sortBy, state.settings.features?.sorting])

  const selectedCar = useMemo(
    () => state.cars.find((car) => car.id === selectedCarId),
    [state.cars, selectedCarId]
  )

  const handleLogin = async (email: string, password: string) => {
    setLoginError('')
    await login(email, password)
  }

  const handleRegister = async (email: string, password: string, firstName: string, lastName: string, garageName: string) => {
    setLoginError('')
    await register(email, password, firstName, lastName, garageName)
  }

  // 1. Сначала проверяем авторизацию
  if (!user && !authLoading) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError || loginError}
        isLoading={authLoading}
      />
    )
  }

  // 2. Показываем загрузку, пока данные НЕ ГОТОВЫ полностью
  if (!dataReady || authLoading || !isLoaded || !user) {
    const lang = state.settings?.language || 'ru'
    const loadingMessages = {
      ru: 'Загрузка данных из Firebase...',
      en: 'Loading data from Firebase...',
      fr: 'Chargement des données depuis Firebase...',
      hy: 'Տվյալների բեռնում Firebase-ից...'
    }
    
    const subMessages = {
      ru: 'Получаем информацию о машинах, расходах и настройках...',
      en: 'Fetching cars, expenses and settings...',
      fr: 'Récupération des voitures, dépenses et paramètres...',
      hy: 'Ստանում ենք տվյալներ մեքենաների, ծախսերի և կարգավորումների մասին...'
    }
    
    return (
      <LoadingScreen 
        message={loadingMessages[lang]}
        subMessage={subMessages[lang]}
      />
    )
  }

  // 3. Только теперь рендерим основной интерфейс
  if (selectedCar) {
    return (
      <CarDetails
        car={selectedCar}
        currency={state.settings.currency}
        language={state.settings.language}
        documents={state.documents}
        showDocuments={state.settings.features?.documents}
        showKm={state.settings.features?.km}
        showYear={state.settings.features?.year}
        onBack={() => setSelectedCarId(null)}
        onAddExpense={(expense) => addExpense(selectedCar.id, expense)}
        onUpdateExpense={(expenseId, updates) => updateExpense(selectedCar.id, expenseId, updates)}
        onDeleteExpense={(expenseId) => deleteExpense(selectedCar.id, expenseId)}
        onSell={(price, saleDate) => sellCar(selectedCar.id, price, saleDate)}
        onUpdateSoldCar={(price, saleDate) => updateSoldCar(selectedCar.id, price, saleDate)}
        onReturnToSale={() => returnToSale(selectedCar.id)}
        onAddDocument={(document) => addDocument(document)}
        onDeleteDocument={(documentId) => deleteDocument(documentId)}
        onDelete={() => {
          deleteCar(selectedCar.id)
          setSelectedCarId(null)
        }}
        userInfo={state.settings.userInfo}
        onUpdateChecklist={(checklist) => updateCar(selectedCar.id, { checklist })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicHead garageName={state.settings.userInfo?.garageName} />
      <Header 
        onOpenSettings={() => setShowSettings(true)} 
        onLogout={logout}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        language={state.settings.language}
        appName={state.settings.userInfo?.garageName || state.settings.appName}
        showSearch={state.settings.features?.search}
      />

      <main className="p-4 pb-24 space-y-4">
        {state.settings.features?.dashboard && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={showDashboard ? "default" : "outline"}
              onClick={() => setShowDashboard(true)}
              className="flex-1"
            >
              📊 {t('button.dashboard', state.settings.language)}
            </Button>
            <Button
              variant={!showDashboard ? "default" : "outline"}
              onClick={() => setShowDashboard(false)}
              className="flex-1"
            >
              🚗 {t('button.cars', state.settings.language)}
            </Button>
          </div>
        )}

        {showDashboard && state.settings.features?.dashboard && (
          <Dashboard 
            cars={state.cars} 
            currency={state.settings.currency} 
            language={state.settings.language} 
            onNavigateToCars={() => setShowDashboard(false)}
          />
        )}

        {(!showDashboard || !state.settings.features?.dashboard) && (
          <>
            {state.cars.length > 0 && (
              <>
                <StatsSummary cars={state.cars} currency={state.settings.currency} language={state.settings.language} />
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="all">{t('tab.all', state.settings.language)}</TabsTrigger>
                    <TabsTrigger value="active">{t('tab.active', state.settings.language)}</TabsTrigger>
                    <TabsTrigger value="sold">{t('tab.sold', state.settings.language)}</TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* Остальной код фильтров и списка... */}
              </>
            )}
            {/* Рендер карточек машин... */}
            <div className="space-y-3">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    currency={state.settings.currency}
                    language={state.settings.language}
                    onClick={() => setSelectedCarId(car.id)}
                    onEdit={() => {
                        setEditingCar(car)
                        setShowEditCar(true)
                    }}
                    showLicensePlate={state.settings.features?.licensePlate}
                    showPurchaseDate={state.settings.features?.purchaseDate}
                    showKm={state.settings.features?.km}
                    showYear={state.settings.features?.year}
                  />
                ))}
            </div>
            {state.cars.length === 0 && <EmptyState language={state.settings.language} />}
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="w-14 h-14 rounded-full shadow-lg" onClick={() => setShowAddCar(true)}>
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <AddCarForm
        open={showAddCar}
        onOpenChange={setShowAddCar}
        onAdd={addCar}
        ownerName={state.settings.userInfo?.firstName || 'Владелец'}
        language={state.settings.language}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, km: true, year: true }}
        partners={state.settings.partners}
      />
      
      <EditCarForm
        open={showEditCar}
        onOpenChange={setShowEditCar}
        car={editingCar}
        onUpdate={updateCar}
        language={state.settings.language}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, km: true, year: true }}
      />

      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        user={user}
        userInfo={state.settings.userInfo}
        currency={state.settings.currency}
        language={state.settings.language}
        appName={state.settings.appName}
        theme={state.settings.theme}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, search: true, documents: true, km: true, year: true }}
        onUpdateCurrency={updateCurrency}
        onUpdateFeatures={updateFeatures}
        onUpdateLanguage={updateLanguage}
        onUpdateAppName={updateAppName}
        onUpdateTheme={updateTheme}
        onUpdateUserInfo={updateUserInfo}
      />
    </div>
  )
}