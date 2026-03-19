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
import { AddCarForm } from '@/components/add-car-form'
import { EditCarForm } from '@/components/edit-car-form'
import { SettingsSheet } from '@/components/settings-sheet'
import { EmptyState } from '@/components/empty-state'
import { StatsSummary } from '@/components/stats-summary'
import { Dashboard } from '@/components/dashboard'
import { LoginScreen } from '@/components/login-screen'
import { Spinner } from '@/components/ui/spinner'
import { type Car } from '@/lib/types'
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
    addPartner,
    deletePartner,
    updatePartner,
    updateCurrency,
    updateLanguage,
    updateFeatures,
    updateAppName,
    addDocument,
    deleteDocument,
    updateTheme,
    resetGarage,
  } = useAppStore(user?.uid)

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

  // Apply theme changes immediately
  useEffect(() => {
    console.log('[page] Theme useEffect triggered, theme:', state.settings.theme)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (state.settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      console.log('[page] Applying system theme:', systemTheme)
      root.classList.add(systemTheme)
    } else {
      console.log('[page] Applying theme:', state.settings.theme)
      root.classList.add(state.settings.theme)
    }
  }, [state.settings.theme])

  const filteredCars = useMemo(() => {
    let cars = state.cars
  
    // Apply filter
    if (filter === 'all') {
      cars = cars
    } else {
      cars = cars.filter((car) => car.status === filter)
    }
  
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      cars = cars.filter((car) => 
        car.name.toLowerCase().includes(query) ||
        car.purchasePrice.toString().includes(query) ||
        (car.salePrice && car.salePrice.toString().includes(query))
      )
    }
  
    // Apply sorting (only if enabled)
    if (state.settings.features?.sorting) {
      cars.sort((a, b) => {
        switch (sortBy) {
          case 'default':
            // Sort by lastModified first, then by purchaseDate (newest first)
            const aModified = new Date(a.lastModified || a.purchaseDate).getTime()
            const bModified = new Date(b.lastModified || b.purchaseDate).getTime()
            return bModified - aModified
          case 'date-desc':
            // Sort by creation time (literally the last added)
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
  }, [state.cars, filter, searchQuery, sortBy])

  const selectedCar = useMemo(
    () => state.cars.find((car) => car.id === selectedCarId),
    [state.cars, selectedCarId]
  )

  const handleLogin = async (email: string, password: string) => {
    setLoginError('')
    await login(email, password)
  }

  const handleRegister = async (email: string, password: string) => {
    setLoginError('')
    await register(email, password)
  }

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

  if (!isLoaded || authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-sm text-muted-foreground">{t('message.loading', state.settings?.language ?? 'ru')}</p>
      </div>
    )
  }

  if (selectedCar) {
    return (
      <CarDetails
        car={selectedCar}
        partners={state.settings.partners}
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
        onUpdateChecklist={(checklist) => updateCar(selectedCar.id, { checklist })}
      />
    )
  }

  const handleEditCar = (car: Car) => {
    setEditingCar(car)
    setShowEditCar(true)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onOpenSettings={() => setShowSettings(true)} 
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        language={state.settings.language}
        appName={state.settings.appName}
        showSearch={state.settings.features?.search}
      />

      <main className="p-4 pb-24 space-y-4">
        {/* Переключатель между Дашбордом и списком машин */}
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

        {/* Дашборд */}
        {showDashboard && (
          <Dashboard 
            cars={state.cars} 
            currency={state.settings.currency} 
            language={state.settings.language} 
          />
        )}

        {/* Список машин */}
        {!showDashboard && (
          <>
            {/* Фильтры и сортировка */}
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

                  {state.cars.length > 0 && state.settings.features?.sorting && (
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('placeholder.sorting', state.settings.language)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t('sorting.default', state.settings.language)}</SelectItem>
                        <SelectItem value="date-desc">{t('sorting.newestFirst', state.settings.language)}</SelectItem>
                        <SelectItem value="date-asc">{t('sorting.oldestFirst', state.settings.language)}</SelectItem>
                        <SelectItem value="name-asc">{t('sorting.nameAZ', state.settings.language)}</SelectItem>
                        <SelectItem value="name-desc">{t('sorting.nameZA', state.settings.language)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {filteredCars.length === 0 && state.cars.length === 0 ? (
              searchQuery.trim() ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('message.noSearchResults', state.settings.language).replace('{query}', searchQuery)}
                </p>
              ) : (
                <EmptyState language={state.settings.language} />
              )
            ) : (
              <div className="space-y-3">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    currency={state.settings.currency}
                    language={state.settings.language}
                    onClick={() => setSelectedCarId(car.id)}
                    onEdit={() => handleEditCar(car)}
                    showLicensePlate={state.settings.features?.licensePlate}
                    showPurchaseDate={state.settings.features?.purchaseDate}
                    showKm={state.settings.features?.km}
                    showYear={state.settings.features?.year}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Пустое состояние */}
        {state.cars.length === 0 && !showDashboard && (
          <EmptyState language={state.settings.language} />
        )}
      </main>

        {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
          onClick={() => setShowAddCar(true)}
        >
          <Plus className="w-6 h-6" />
          <span className="sr-only">Add car</span>
        </Button>
      </div>

      {/* Add Car Form */}
      <AddCarForm
        open={showAddCar}
        onOpenChange={setShowAddCar}
        partners={state.settings.partners}
        onAdd={addCar}
        onAddPartner={addPartner}
        language={state.settings.language}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, km: true, year: true }}
      />

      {/* Edit Car Form */}
      <EditCarForm
        open={showEditCar}
        onOpenChange={setShowEditCar}
        car={editingCar}
        partners={state.settings.partners}
        onUpdate={updateCar}
        onAddPartner={addPartner}
        language={state.settings.language}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, km: true, year: true }}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        user={user}
        partners={state.settings.partners}
        currency={state.settings.currency}
        language={state.settings.language}
        appName={state.settings.appName}
        theme={state.settings.theme}
        features={state.settings.features || { sorting: true, purchaseDate: true, licensePlate: true, km: true, year: true }}
        onAddPartner={addPartner}
        onDeletePartner={deletePartner}
        onUpdatePartner={updatePartner}
        onUpdateCurrency={updateCurrency}
        onUpdateFeatures={updateFeatures}
        onUpdateLanguage={updateLanguage}
        onUpdateAppName={updateAppName}
        onUpdateTheme={updateTheme}
        onResetGarage={resetGarage}
      />
    </div>
  )
}
