'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AppState, Car, Expense, Partner, Document, AppSettings, ChecklistItem, UserInfo } from './types'
import { generateId } from './format'
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore'

const defaultState: AppState = {
  cars: [],
  documents: [],
  settings: {
    partners: [],
    currency: '€',
    language: 'ru',
    theme: 'system',
    appName: 'MyGarage',
    features: {
      sorting: true,
      purchaseDate: true,
      licensePlate: true,
      search: true,
      documents: true,
      km: true,
      year: true,
      partnership: true,
      dashboard: true,
    },
    userInfo: undefined,
  },
  userInfo: undefined,
}

const defaultFeatures = defaultState.settings.features
const getSettingsStorageKey = (userId: string) => `monvoiture:settings:${userId}`

function normalizeSettings(input?: Partial<AppSettings> | null): AppSettings {
  const safeLanguage = input?.language
  const safeTheme = input?.theme

  return {
    partners: input?.partners || defaultState.settings.partners,
    currency: (input?.currency || defaultState.settings.currency).trim() || defaultState.settings.currency,
    language:
      safeLanguage === 'ru' || safeLanguage === 'fr' || safeLanguage === 'hy' || safeLanguage === 'en'
        ? safeLanguage
        : defaultState.settings.language,
    theme: safeTheme === 'light' || safeTheme === 'dark' || safeTheme === 'system' ? safeTheme : defaultState.settings.theme,
    appName: (input?.appName || defaultState.settings.appName).trim() || defaultState.settings.appName,
    features: {
      sorting: input?.features?.sorting ?? defaultFeatures.sorting,
      purchaseDate: input?.features?.purchaseDate ?? defaultFeatures.purchaseDate,
      licensePlate: input?.features?.licensePlate ?? defaultFeatures.licensePlate,
      search: input?.features?.search ?? defaultFeatures.search,
      documents: input?.features?.documents ?? defaultFeatures.documents,
      km: input?.features?.km ?? defaultFeatures.km,
      year: input?.features?.year ?? defaultFeatures.year,
      partnership: input?.features?.partnership ?? defaultFeatures.partnership,
      dashboard: input?.features?.dashboard ?? defaultFeatures.dashboard,
    },
    userInfo: input?.userInfo || defaultState.settings.userInfo,
  }
}

function loadSettingsFromLocalStorage(userId: string): AppSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getSettingsStorageKey(userId))
    if (!raw) return null
    return normalizeSettings(JSON.parse(raw) as Partial<AppSettings>)
  } catch (error) {
    console.error('[store] Failed to load settings from localStorage:', error)
    return null
  }
}

function saveSettingsToLocalStorage(userId: string, settings: AppSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSettingsStorageKey(userId), JSON.stringify(normalizeSettings(settings)))
  } catch (error) {
    console.error('[store] Failed to save settings to localStorage:', error)
  }
}

const loadStateFromFirestore = async (userId: string): Promise<AppState | null> => {
  try {
    if (!db) {
      console.log('[store] Firestore not initialized')
      return null
    }
    console.log('[store] Starting loadStateFromFirestore for user:', userId)
    
    // Load settings from individual documents like cars and documents
    console.log('[store] Loading settings from Firebase...')
    const settingsPromises = [
      getDoc(doc(db, 'users', userId, 'settings', 'currency')),
      getDoc(doc(db, 'users', userId, 'settings', 'language')),
      getDoc(doc(db, 'users', userId, 'settings', 'theme')),
      getDoc(doc(db, 'users', userId, 'settings', 'appName')),
      getDoc(doc(db, 'users', userId, 'settings', 'features'))
    ]
    
    const settingsSnapshots = await Promise.all(settingsPromises)
    const settings = normalizeSettings()
    
    // Extract settings from individual documents
    const currencySnap = settingsSnapshots[0]
    const languageSnap = settingsSnapshots[1]
    const themeSnap = settingsSnapshots[2]
    const appNameSnap = settingsSnapshots[3]
    const featuresSnap = settingsSnapshots[4]
    
    console.log('[store] Settings snapshots:', {
      currency: currencySnap.exists(),
      language: languageSnap.exists(),
      theme: themeSnap.exists(),
      appName: appNameSnap.exists(),
      features: featuresSnap.exists()
    })
    
    const loadedSettings: Partial<AppSettings> = {}
    if (currencySnap.exists()) {
      const data = currencySnap.data() as any
      loadedSettings.currency = data.currency ?? data.value
    }
    if (languageSnap.exists()) {
      const data = languageSnap.data() as any
      loadedSettings.language = data.language ?? data.value
    }
    if (themeSnap.exists()) {
      const data = themeSnap.data() as any
      loadedSettings.theme = data.theme ?? data.value
    }
    if (appNameSnap.exists()) {
      const data = appNameSnap.data() as any
      loadedSettings.appName = data.appName ?? data.value
    }
    if (featuresSnap.exists()) {
      const data = featuresSnap.data() as any
      loadedSettings.features = data.features ?? data.items
    }

    let effectiveSettingsInput: Partial<AppSettings> = { ...loadedSettings }

    // Also check if old settings exist and migrate them
    const oldSettingsRef = doc(db, 'users', userId, 'settings', 'main')
    const oldSettingsSnap = await getDoc(oldSettingsRef)
    console.log('[store] Old settings exist:', oldSettingsSnap.exists())
    if (oldSettingsSnap.exists()) {
      console.log('[store] Old settings data:', oldSettingsSnap.data())
      console.log('[store] Migrating old settings to new structure...')
      
      const oldData = oldSettingsSnap.data() as any
      // Use legacy values as fallback for current app session,
      // so we don't briefly revert to defaults before autosave.
      effectiveSettingsInput = {
        currency: loadedSettings.currency ?? oldData.currency,
        language: loadedSettings.language ?? oldData.language,
        theme: loadedSettings.theme ?? oldData.theme,
        appName: loadedSettings.appName ?? oldData.appName,
        features: loadedSettings.features ?? oldData.features,
      }
      const migrationPromises = []
      
      // Migrate each setting to new structure
      if (oldData.currency) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
            currency: oldData.currency 
          })
        )
      }
      if (oldData.language) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
            language: oldData.language 
          })
        )
      }
      if (oldData.theme) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
            theme: oldData.theme 
          })
        )
      }
      if (oldData.appName) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
            appName: oldData.appName 
          })
        )
      }
      if (oldData.features) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
            features: oldData.features 
          })
        )
      }
      
      await Promise.all(migrationPromises)
      console.log('[store] Migration completed, deleting old settings...')
      
      // Delete old settings after migration
      await deleteDoc(oldSettingsRef)
      console.log('[store] Old settings deleted')
    } else {
      // Create initial settings only when nothing exists yet.
      // If any settings document already exists, keep user settings intact.
      const hasAnySettings =
        currencySnap.exists() ||
        languageSnap.exists() ||
        themeSnap.exists() ||
        appNameSnap.exists() ||
        featuresSnap.exists()

      if (!hasAnySettings) {
        console.log('[store] No settings found, creating initial settings...')
        const initialSettings = defaultState.settings
        const initialPromises = []
        
        initialPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
            currency: initialSettings.currency 
          })
        )
        initialPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
            language: initialSettings.language 
          })
        )
        initialPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
            theme: initialSettings.theme 
          })
        )
        initialPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
            appName: initialSettings.appName 
          })
        )
        initialPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
            features: initialSettings.features 
          })
        )
        
        await Promise.all(initialPromises)
        console.log('[store] Initial settings created')
      } else {
        console.log('[store] Existing settings found, skipping default settings creation')
      }
    }

    const normalizedLoadedSettings = normalizeSettings(effectiveSettingsInput)

    // Load user profile - используем collection чтобы избежать ошибки с нечетными сегментами
    console.log('[store] Starting to load user profile for userId:', userId)
    
    const profileRef = doc(db, 'users', userId, 'profile', 'doc')
    const profileSnap = await getDoc(profileRef)
    let userInfo: UserInfo | undefined
    
    // Also try to load userInfo from settings (fallback)
    const settingsUserInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
    const settingsUserInfoSnap = await getDoc(settingsUserInfoRef)
    
    console.log('[store] Profile doc exists:', profileSnap.exists())
    console.log('[store] Settings userInfo doc exists:', settingsUserInfoSnap.exists())
    
    if (settingsUserInfoSnap.exists()) {
      const profileData = settingsUserInfoSnap.data() as UserInfo
      userInfo = profileData
      console.log('[store] Loaded user profile from settings:', userInfo)
    } else if (profileSnap.exists()) {
      const profileData = profileSnap.data() as UserInfo
      userInfo = profileData
      console.log('[store] Loaded user profile from profile:', userInfo)
      
      // Автоматически копируем в settings/userInfo для будущих загрузок
      try {
        await setDoc(settingsUserInfoRef, profileData)
        console.log('[store] Auto-copied profile to settings/userInfo')
      } catch (error) {
        console.error('[store] Failed to auto-copy profile to settings:', error)
      }
    } else {
      console.log('[store] No user profile found in profile or settings')
    }

    // Load documents
    const documentsRef = collection(db, 'users', userId, 'documents')
    const documentsSnap = await getDocs(documentsRef)
    const documents: Document[] = []
    documentsSnap.forEach((doc) => {
      const documentData = doc.data() as Omit<Document, 'id'>
      documents.push({ ...documentData, id: doc.id })
    })

    // Load cars and their expenses
    const carsRef = collection(db, 'users', userId, 'cars')
    const carsSnap = await getDocs(carsRef)
    const cars: Car[] = []
    
    console.log(`[store] Found ${carsSnap.docs.length} cars in Firebase`)
    
    for (const carDoc of carsSnap.docs) {
      const carData = carDoc.data() as Omit<Car, 'id'>
      console.log(`[store] Car data for ${carDoc.id}:`, carData)
      
      if (carData.deleted !== true) {
        // Check if expenses are stored in car data or separate collection
        let expenses: Expense[] = []
        
        if (carData.expenses && Array.isArray(carData.expenses)) {
          // Expenses are stored as part of car data
          expenses = carData.expenses
          console.log(`[store] Found ${expenses.length} expenses in car data for ${carDoc.id}`)
        } else {
          // Load expenses from separate collection
          const expensesRef = collection(db, 'users', userId, 'cars', carDoc.id, 'expenses')
          const expensesSnap = await getDocs(expensesRef)
          expensesSnap.forEach((expenseDoc) => {
            const expenseData = expenseDoc.data() as Omit<Expense, 'id'>
            expenses.push({ ...expenseData, id: expenseDoc.id })
          })
          console.log(`[store] Loaded ${expenses.length} expenses from separate collection for ${carDoc.id}`)
        }
        
        // Check if checklist exists in car data
        console.log(`[store] Checklist for car ${carDoc.id}:`, carData.checklist)
        
        cars.push({ ...carData, id: carDoc.id, expenses })
      }
    }
    console.log(`[store] Loaded ${cars.length} cars with expenses from Firebase`)
    
    return { cars, documents, settings: normalizedLoadedSettings, userInfo }
    
  } catch (error) {
    console.error('[store] Failed to load state from Firestore:', error)
    return { cars: [], documents: [], settings: defaultState.settings, userInfo: undefined }
  }
}

export function useAppStore(userId?: string | null) {
  const [state, setState] = useState<AppState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!userId) {
        setState(defaultState)
        setIsLoaded(true)
        setIsInitializing(false)
        return
      }

      const localSettings = loadSettingsFromLocalStorage(userId)
      if (localSettings) {
        setState((prev) => ({ ...prev, settings: localSettings }))
      }

      const fromRemote = await loadStateFromFirestore(userId)
      if (cancelled) return

      if (fromRemote) {
        const { cars, documents, settings, userInfo } = fromRemote
        const mergedSettings = normalizeSettings({
          ...settings,
          ...(localSettings || {}),
          features: {
            ...settings.features,
            ...(localSettings?.features || {}),
          },
          userInfo: userInfo, // ✅ Include userInfo in mergedSettings
        })
        setState({ cars, documents, settings: mergedSettings, userInfo })
      } else {
        setState({ ...defaultState, settings: localSettings || defaultState.settings, userInfo: undefined })
      }
      setIsLoaded(true)
      setIsInitializing(false)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [userId])

  // Separate useEffect to reload profile when needed
  useEffect(() => {
    if (!userId || isLoaded || isInitializing) return
    
    const loadProfile = async () => {
      console.log('[store] Reloading user profile for userId:', userId)
      
      const settingsUserInfoRef = doc(db, 'users', userId, 'settings', 'userInfo')
      const settingsUserInfoSnap = await getDoc(settingsUserInfoRef)
      
      if (settingsUserInfoSnap.exists()) {
        const profileData = settingsUserInfoSnap.data() as UserInfo
        console.log('[store] Reloaded user profile from settings:', profileData)
        setState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            userInfo: profileData
          }
        }))
      } else {
        console.log('[store] No user profile found in settings')
      }
    }
    
    loadProfile()
  }, [userId, isLoaded, isInitializing])

  useEffect(() => {
    if (!userId || !isLoaded || isInitializing) return
    
    // Сохраняем настройки но сохраняем существующий userInfo если он есть
    const storageKey = `monvoiture:settings:${userId}`
    const existingSettings = localStorage.getItem(storageKey)
    
    let settingsToSave = { ...state.settings }
    
    // Если в localStorage есть userInfo а в state.settings нет, сохраняем его
    if (existingSettings) {
      try {
        const parsedExisting = JSON.parse(existingSettings)
        if (parsedExisting.userInfo && !state.settings.userInfo) {
          settingsToSave.userInfo = parsedExisting.userInfo
          console.log('[store] Preserved existing userInfo from localStorage')
        }
      } catch (error) {
        console.error('[store] Error parsing existing settings:', error)
      }
    }
    
    saveSettingsToLocalStorage(userId, settingsToSave)
  }, [userId, isLoaded, isInitializing, state.settings])

  useEffect(() => {
    if (!isLoaded || !userId || !db || isInitializing) return
    // Only save settings automatically, not cars (cars are saved individually)
    console.log('[store] Auto-save effect triggered, but only saving settings')
    console.log('[store] Current cars count:', state.cars.length)
    console.log('[store] Current documents count:', state.documents.length)
    
    // Save settings as individual documents like cars and documents
    const settingsData = normalizeSettings(state.settings)
    const settingsPromises = []
    
    // Validate and sanitize settings before saving
    console.log('[store] Raw settings data:', settingsData)
    const cleanCurrency = settingsData.currency
    const cleanLanguage = settingsData.language
    const cleanTheme = settingsData.theme
    const cleanAppName = settingsData.appName
    const cleanFeatures = settingsData.features
    
    console.log('[store] Cleaned settings:', {
      cleanCurrency,
      cleanLanguage,
      cleanTheme,
      cleanAppName,
      cleanFeatures,
      rawCurrency: settingsData.currency,
      rawLanguage: settingsData.language,
      rawTheme: settingsData.theme,
      rawAppName: settingsData.appName
    })
    
    // Additional validation to prevent undefined values
    if (!cleanCurrency || cleanCurrency === 'undefined' || cleanCurrency === undefined || cleanCurrency === '') {
      console.error('[store] Invalid currency value, using default €')
      return
    }
    
    // Save each setting as a separate document
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
        currency: cleanCurrency 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
        language: cleanLanguage 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
        theme: cleanTheme 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
        appName: cleanAppName 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
        features: cleanFeatures 
      })
    )
    
    Promise.all(settingsPromises)
      .then(() => console.log('[store] Settings saved as individual documents'))
      .catch((error) => console.error('[store] Failed to save settings:', error))
  }, [state.settings, isLoaded, userId, db, isInitializing])

  const addCar = useCallback((car: Omit<Car, 'id' | 'expenses' | 'status'>) => {
    console.log('[store] addCar called with:', car)
    const newCar: Car = {
      ...car,
      id: generateId(),
      expenses: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    console.log('[store] New car created:', newCar)
    
    // Save to Firebase immediately
    if (userId && db) {
      const carRef = doc(db, 'users', userId, 'cars', newCar.id)
      const carData = { ...newCar }
      
      // Remove undefined fields - Firestore doesn't accept undefined values
      Object.keys(carData).forEach(key => {
        if ((carData as any)[key] === undefined) {
          delete (carData as any)[key]
        }
      })
      
      setDoc(carRef, carData, { merge: true })
        .then(() => {
          console.log('[store] New car saved to Firestore:', newCar.id)
          console.log('[store] Car data saved:', carData)
          console.log('[store] Car added successfully without reload')
        })
        .catch((error) => console.error('[store] Failed to save new car to Firestore:', error))
    }
    
    setState((prev) => {
      const newState = { ...prev, cars: [...prev.cars, newCar] }
      console.log('[store] State updated with new car. Total cars:', newState.cars.length)
      return newState
    })
  }, [userId])

  const updateCar = useCallback((carId: string, updates: Partial<Car>) => {
    console.log('[store] updateCar called for car:', carId, 'with updates:', updates)
    
    // Update state first
    setState((prev) => {
      const updatedCars = prev.cars.map((car) =>
        car.id === carId ? { ...car, ...updates } : car
      )
      
      // Save to Firebase immediately to avoid race condition
      if (userId && db) {
        const updatedCar = updatedCars.find(car => car.id === carId)
        if (updatedCar) {
          const carRef = doc(db, 'users', userId, 'cars', carId)
          const carData = { ...updatedCar, lastModified: new Date().toISOString() }
          
          // Remove undefined fields - Firestore doesn't accept undefined values
          Object.keys(carData).forEach(key => {
            if ((carData as any)[key] === undefined) {
              delete (carData as any)[key]
            }
          })
          
          // Save immediately without waiting for auto-save
          setDoc(carRef, carData, { merge: true })
            .then(() => console.log('[store] Car updated in Firestore:', carId))
            .catch((error) => console.error('[store] Failed to update car in Firestore:', error))
        }
      }
      
      return {
        ...prev,
        cars: updatedCars,
      }
    })
  }, [userId])

  const deleteCar = useCallback((carId: string) => {
    console.log('[store] deleteCar called for car:', carId)
    console.log('[store] WARNING: This deletes individual car, not all cars!')
    
    // Update state first
    setState((prev) => ({
      ...prev,
      cars: prev.cars.filter((car) => car.id !== carId)
    }))
    
    // Delete from Firebase immediately
    if (userId && db) {
      const carRef = doc(db, 'users', userId, 'cars', carId)
      // Delete document completely
      deleteDoc(carRef)
        .then(() => console.log('[store] Car deleted from Firestore:', carId))
        .catch((error: any) => console.error('[store] Failed to delete car from Firestore:', error))
    }
  }, [userId])

  const addExpense = useCallback((carId: string, expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: generateId() }
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? { ...car, expenses: [...car.expenses, newExpense], lastModified: new Date().toISOString() }
          : car
      ),
    }))
    
    // Save to Firebase immediately
    if (userId && db) {
      const carRef = doc(db, 'users', userId, 'cars', carId)
      const updatedCar = state.cars.find(car => car.id === carId)
      if (updatedCar) {
        const carWithNewExpense = {
          ...updatedCar,
          expenses: [...updatedCar.expenses, newExpense],
          lastModified: new Date().toISOString()
        }
        setDoc(carRef, carWithNewExpense)
          .then(() => console.log('[store] Expense saved to Firestore'))
          .catch((error) => console.error('[store] Failed to save expense:', error))
      }
    }
  }, [userId, db, state.cars])

  const deleteExpense = useCallback((carId: string, expenseId: string) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? { ...car, expenses: car.expenses.filter((e) => e.id !== expenseId) }
          : car
      ),
    }))
    
    // Save to Firebase immediately
    if (userId && db) {
      const carRef = doc(db, 'users', userId, 'cars', carId)
      const updatedCar = state.cars.find(car => car.id === carId)
      if (updatedCar) {
        const carWithoutExpense = {
          ...updatedCar,
          expenses: updatedCar.expenses.filter((e) => e.id !== expenseId),
          lastModified: new Date().toISOString()
        }
        setDoc(carRef, carWithoutExpense)
          .then(() => console.log('[store] Expense deleted from Firestore'))
          .catch((error) => console.error('[store] Failed to delete expense:', error))
      }
    }
  }, [userId, db, state.cars])

  const updateExpense = useCallback((carId: string, expenseId: string, updates: Partial<Expense>) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              expenses: car.expenses.map((e) =>
                e.id === expenseId ? { ...e, ...updates } : e
              ),
            }
          : car
      ),
    }))
    
    // Save to Firebase immediately
    if (userId && db) {
      const carRef = doc(db, 'users', userId, 'cars', carId)
      const updatedCar = state.cars.find(car => car.id === carId)
      if (updatedCar) {
        const carWithUpdatedExpense = {
          ...updatedCar,
          expenses: updatedCar.expenses.map((e) =>
            e.id === expenseId ? { ...e, ...updates } : e
          ),
          lastModified: new Date().toISOString()
        }
        setDoc(carRef, carWithUpdatedExpense)
          .then(() => console.log('[store] Expense updated in Firestore'))
          .catch((error) => console.error('[store] Failed to update expense:', error))
      }
    }
  }, [userId, db, state.cars])

  const sellCar = useCallback((carId: string, salePrice: number, saleDate?: string) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              salePrice,
              saleDate: saleDate || new Date().toISOString().split('T')[0],
              status: 'sold' as const,
            }
          : car
      ),
    }))
  }, [])

  const updateSoldCar = useCallback((carId: string, salePrice: number, saleDate: string) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              salePrice,
              saleDate,
            }
          : car
      ),
    }))
  }, [])

  const returnToSale = useCallback((carId: string) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              salePrice: undefined,
              saleDate: undefined,
              status: 'active' as const,
            }
          : car
      ),
    }))
  }, [])

  const updateCurrency = useCallback((currency: string) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, currency },
    }))
  }, [])

  const updateLanguage = useCallback((language: 'ru' | 'fr' | 'hy' | 'en') => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, language },
    }))
  }, [])

  const updateFeatures = useCallback((features: Partial<{ sorting: boolean; purchaseDate: boolean; licensePlate: boolean; search: boolean; documents: boolean; km: boolean; year: boolean; partnership: boolean; dashboard: boolean }>) => {
    console.log('[store] updateFeatures called with:', features)
    setState((prev) => {
      const currentFeatures = prev.settings.features || {
        sorting: true,
        purchaseDate: true,
        licensePlate: true,
        search: true,
        documents: true,
        km: true,
        year: true,
        partnership: true,
        dashboard: true,
      }
      
      const newFeatures = {
        ...currentFeatures,
        ...features,
      }
      
      console.log('[store] New features state:', newFeatures)
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          features: newFeatures,
        },
      }
    })
  }, [])

  const addDocument = useCallback((document: Omit<Document, 'id' | 'uploadDate'>) => {
    console.log('[store] addDocument called with:', document)
    
    // Check if document is too large for Firestore
    const documentSize = document.url.length * 0.75 // Approximate Base64 size
    const maxFirestoreSize = 4000000 // 4MB - increased for iPhone
    
    if (documentSize > maxFirestoreSize) {
      console.error('[store] Document too large for Firestore:', documentSize, 'bytes')
      // Create a notification instead of saving
      if (userId) {
        const notification = {
          type: 'alert' as const,
          title: 'Ошибка сохранения документа',
          message: `Документ "${document.name}" слишком большой (${Math.round(documentSize/1024)}KB). Максимальный размер: 4000KB.`,
          carId: document.carId,
        }
        // Add notification logic here if needed
      }
      return
    }
    
    const newDocument: Document = {
      ...document,
      id: generateId(),
      uploadDate: new Date().toISOString(),
    }
    
    console.log('[store] New document created:', newDocument)
    
    setState((prev) => {
      console.log('[store] Previous state documents count:', prev.documents.length)
      const newState = {
        ...prev,
        documents: [...prev.documents, newDocument],
      }
      console.log('[store] New state documents count:', newState.documents.length)
      return newState
    })

    // Save to Firebase immediately
    if (userId && db) {
      console.log('[store] Saving to Firebase...')
      const docRef = doc(db, 'users', userId, 'documents', newDocument.id)
      setDoc(docRef, newDocument)
        .then(() => console.log('[store] Document saved to Firestore:', newDocument.id))
        .catch((error: any) => {
          console.error('[store] Failed to save document to Firestore:', error)
          // Remove from local state if Firebase save failed
          setState((prev) => ({
            ...prev,
            documents: prev.documents.filter((doc) => doc.id !== newDocument.id),
          }))
        })
    } else {
      console.log('[store] No userId, skipping Firebase save')
    }
  }, [userId])

  const deleteDocument = useCallback((documentId: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }))

    // Delete from Firebase immediately
    if (userId && db) {
      const docRef = doc(db, 'users', userId, 'documents', documentId)
      deleteDoc(docRef)
        .then(() => console.log('[store] Document deleted from Firestore:', documentId))
        .catch((error: any) => console.error('[store] Failed to delete document from Firestore:', error))
    }
  }, [userId])

  const resetGarage = useCallback(async () => {
    console.log('[store] Resetting garage - deleting all cars, expenses, and documents')
    console.log('[store] Current cars count:', state.cars.length)
    console.log('[store] Current documents count:', state.documents.length)
    
    // Delete all cars, expenses, and documents from Firebase
    if (userId && db) {
      console.log('[store] Starting deletion...')
      
      // Delete cars
      const carsRef = collection(db, 'users', userId, 'cars')
      const carsSnap = await getDocs(carsRef)
      console.log('[store] Found cars to delete:', carsSnap.docs.length)
      
      // Delete documents
      const documentsRef = collection(db, 'users', userId, 'documents')
      const documentsSnap = await getDocs(documentsRef)
      console.log('[store] Found documents to delete:', documentsSnap.docs.length)
      
      const batch = writeBatch(db)
      
      // Delete all cars and their expenses
      carsSnap.forEach(async (carDoc) => {
        console.log('[store] Deleting car:', carDoc.id)
        batch.delete(doc(carsRef, carDoc.id))
        
        // Also delete expenses subcollection for this car
        const expensesRef = collection(db, 'users', userId, 'cars', carDoc.id, 'expenses')
        const expensesSnap = await getDocs(expensesRef)
        console.log(`[store] Found ${expensesSnap.docs.length} expenses to delete for car ${carDoc.id}`)
        
        expensesSnap.forEach((expenseDoc) => {
          console.log('[store] Deleting expense:', expenseDoc.id)
          batch.delete(doc(expensesRef, expenseDoc.id))
        })
      })
      
      // Delete all documents
      documentsSnap.forEach((docDoc) => {
        console.log('[store] Deleting document:', docDoc.id)
        batch.delete(doc(documentsRef, docDoc.id))
      })
      
      await batch.commit()
      console.log('[store] All cars, expenses, and documents deleted from Firestore')
    } else {
      console.log('[store] No userId or db, skipping Firebase deletion')
    }
    
    // Reset local state completely - only keep settings
    setState({
      ...defaultState,
      settings: {
        ...defaultState.settings,
        // Keep current user settings
        currency: state.settings.currency,
        language: state.settings.language,
        theme: state.settings.theme,
        features: state.settings.features,
      }
    })
    
    console.log('[store] Garage reset complete - everything deleted except settings')
  }, [userId, state.settings])

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    console.log('[store] updateTheme called with:', theme)
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme,
      },
    }))
  }, [])

  const updateAppName = useCallback((appName: string) => {
    console.log('[store] Updating app name to:', appName)
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        appName,
      },
    }))
  }, [])

  const updatePartners = useCallback((partners: Partner[]) => {
    console.log('[store] Updating partners to:', partners)
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners,
      },
    }))
  }, [])

  const addPartner = useCallback((name: string) => {
    const newPartner: Partner = {
      id: Date.now().toString(),
      name: name.trim(),
    }
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners: [...prev.settings.partners, newPartner],
      },
    }))
  }, [])

  const removePartner = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners: prev.settings.partners.filter(p => p.id !== id),
      },
    }))
  }, [])

  const updateUserInfo = useCallback(async (userInfo: UserInfo) => {
    console.log('[store] Updating user info:', userInfo)
    
    // Update local state
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        userInfo,
      },
    }))
    
    // Save to Firebase
    if (userId && db) {
      try {
        await setDoc(doc(db, 'users', userId, 'settings', 'userInfo'), userInfo)
        console.log('[store] User info saved to Firebase settings')
      } catch (error) {
        console.error('[store] Failed to save user info to Firebase:', error)
      }
    }
  }, [userId, db])

  return {
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
    addPartner,
    removePartner,
    addDocument,
    deleteDocument,
    updateTheme,
    updateUserInfo,
    resetGarage,
  }
}
