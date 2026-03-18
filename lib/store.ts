'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AppState, Car, Expense, Partner, Document, AppSettings, ChecklistItem } from './types'
import { generateId } from './format'
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore'

const STORAGE_KEY = 'auto-uchet-data'

const defaultState: AppState = {
  cars: [],
  documents: [],
  settings: {
    partners: [{ id: 'me', name: 'Я' }],
    currency: '€',
    language: 'ru',
    theme: 'system',
    appName: 'EDVI AUTO',
    features: {
      sorting: true,
      purchaseDate: true,
      licensePlate: true,
      search: true,
      documents: true,
      km: true,
      year: true,
    },
  },
}

function loadStateFromLocal(): AppState {
  if (typeof window === 'undefined') return defaultState
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      
      // Migrate old French "Moi" to Russian "Я"
      if (state.settings?.partners) {
        state.settings.partners = state.settings.partners.map((p: Partner) =>
          p.id === 'me' && p.name === 'Moi' ? { ...p, name: 'Я' } : p
        )
      }
      
      // Ensure default partner exists
      if (!state.settings?.partners?.some((p: Partner) => p.id === 'me')) {
        state.settings = { ...state.settings, partners: [{ id: 'me', name: 'Я' }, ...(state.settings?.partners || [])] }
      }
      
      // Ensure new fields exist with defaults
      if (!state.settings.theme) {
        state.settings.theme = 'system'
      }
      
      if (!state.settings.language || !['ru', 'fr', 'hy', 'en'].includes(state.settings.language)) {
        state.settings.language = 'ru'
      }
      
      if (!state.settings.userRole) {
        state.settings.userRole = 'admin'
      }
      
      return state
    }
  } catch {
    console.error('Failed to load state')
  }
  return defaultState
}

function saveStateToLocal(state: AppState) {
  if (typeof window === 'undefined') return
  try {
    // Create a clean state object to avoid circular references
    const cleanState = {
      ...state,
      settings: {
        ...state.settings,
        theme: state.settings.theme || 'system',
        language: state.settings.language || 'ru',
        features: {
          ...state.settings.features,
        },
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState))
  } catch (error) {
    console.error('Failed to save state:', error)
    // Если хранилище переполнено, попробуем сохранить только машины
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        const minimalState = {
          cars: state.cars,
          settings: state.settings,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState))
        console.log('[store] Saved minimal state due to quota exceeded')
      } catch (e) {
        console.error('Failed to save even minimal state:', e)
      }
    }
  }
}

const loadStateFromFirestore = async (userId: string): Promise<AppState | null> => {
  try {
    if (!db) {
      console.log('[store] Firestore not initialized')
      return null
    }
    console.log('[store] Starting loadStateFromFirestore for user:', userId)
    
    // Load settings
    const settingsRef = doc(db, 'users', userId, 'settings', 'main')
    const settingsSnap = await getDoc(settingsRef)
    let settings = defaultState.settings
    
    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data()
      // Clean up old properties that might exist in Firebase
      const { reminders, notifications, userRole, ...cleanSettings } = settingsData as any
      settings = {
        partners: cleanSettings.partners || defaultState.settings.partners,
        currency: cleanSettings.currency || defaultState.settings.currency,
        language: cleanSettings.language || defaultState.settings.language,
        theme: cleanSettings.theme || defaultState.settings.theme,
        appName: cleanSettings.appName || defaultState.settings.appName,
        features: cleanSettings.features || defaultState.settings.features,
      } as AppSettings
    }

    // Load documents
    const documentsRef = collection(db, 'users', userId, 'documents')
    const documentsSnap = await getDocs(documentsRef)
    const documents: Document[] = []
    documentsSnap.forEach((doc) => {
      const documentData = doc.data() as Omit<Document, 'id'>
      documents.push({ ...documentData, id: doc.id })
    })

    // Load cars
    const carsRef = collection(db, 'users', userId, 'cars')
    const carsSnap = await getDocs(carsRef)
    const cars: Car[] = []
    carsSnap.forEach((doc) => {
      const carData = doc.data() as Omit<Car, 'id'>
      if (carData.deleted !== true) {
        cars.push({ ...carData, id: doc.id })
      }
    })
    
    return { cars, documents, settings }
    
  } catch (error) {
    console.error('[store] Failed to load state from Firestore:', error)
    return { cars: [], documents: [], settings: defaultState.settings }
  }
}

async function saveCarsToNewStructure(userId: string, cars: Car[]) {
  try {
    if (!db) return
    console.log('[store] Migrating cars to new structure...')
    const batch = writeBatch(db)
    const carsRef = collection(db, 'users', userId, 'cars')
    
    cars.forEach((car) => {
      // Remove undefined fields before saving
      const carData = { ...car }
      if (carData.licensePlate === undefined) {
        delete carData.licensePlate
      }
      if (carData.salePrice === undefined) {
        delete carData.salePrice
      }
      if (carData.saleDate === undefined) {
        delete carData.saleDate
      }
      if (carData.partnerShares === undefined) {
        delete carData.partnerShares
      }
      if (carData.deleted === undefined) {
        delete carData.deleted
      }
      
      const carRef = doc(carsRef, car.id)
      batch.set(carRef, carData)
    })
    
    await batch.commit()
    console.log('[store] Successfully migrated cars to new structure')
  } catch (error) {
    console.error('[store] Failed to migrate cars:', error)
  }
}

async function saveStateToNewStructure(userId: string, state: AppState) {
  try {
    if (!db) return
    console.log('[store] Migrating state to new structure...')
    
    // Save settings
    const cleanSettings = {
      partners: state.settings.partners,
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      features: state.settings.features,
    }
    const settingsRef = doc(db, 'users', userId, 'settings', 'main')
    await setDoc(settingsRef, cleanSettings)
    
    // Save cars
    await saveCarsToNewStructure(userId, state.cars)
    
    console.log('[store] Successfully migrated state to new structure')
  } catch (error) {
    console.error('[store] Failed to migrate state:', error)
  }
}

async function saveStateToFirestore(userId: string, state: AppState) {
  try {
    if (!db) return
    console.log('[store] Starting save to Firestore for user', userId)
    
    // Save settings
    const cleanSettings = {
      partners: state.settings.partners,
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      features: state.settings.features,
    }
    const settingsRef = doc(db, 'users', userId, 'settings', 'main')
    await setDoc(settingsRef, cleanSettings, { merge: true })
    console.log('[store] Settings saved to Firestore')
    
    // Save cars (batch operation for better performance)
    const batch = writeBatch(db)
    const carsRef = collection(db, 'users', userId, 'cars')
    
    state.cars.forEach((car) => {
      // Remove undefined fields before saving
      const carData = { ...car }
      if (carData.licensePlate === undefined) {
        delete carData.licensePlate
      }
      if (carData.salePrice === undefined) {
        delete carData.salePrice
      }
      if (carData.saleDate === undefined) {
        delete carData.saleDate
      }
      if (carData.partnerShares === undefined) {
        delete carData.partnerShares
      }
      if (carData.deleted === undefined) {
        delete carData.deleted
      }
      
      const carRef = doc(carsRef, car.id)
      batch.set(carRef, carData, { merge: true })
    })
    
    await batch.commit()
    console.log('[store] Successfully saved', state.cars.length, 'cars to Firestore')
  } catch (error) {
    console.error('[store] Failed to save state to Firestore:', error)
    console.error('[store] Error details:', JSON.stringify(error, null, 2))
  }
}

export function useAppStore(userId?: string | null) {
  const [state, setState] = useState<AppState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!userId) {
        setState(loadStateFromLocal())
        setIsLoaded(true)
        return
      }

      const fromRemote = await loadStateFromFirestore(userId)
      if (cancelled) return

      if (fromRemote) {
        setState(fromRemote)
      } else {
        // try migrate from localStorage for first login
        const local = loadStateFromLocal()
        setState(local)
        await saveStateToFirestore(userId, local)
      }
      setIsLoaded(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (isLoaded) {
      saveStateToLocal(state)
    }
  }, [state, isLoaded])

  useEffect(() => {
    if (!isLoaded || !userId || !db) return
    // Only save settings automatically, not cars (cars are saved individually)
    console.log('[store] Auto-save effect triggered, but only saving settings')
    console.log('[store] Current cars count:', state.cars.length)
    console.log('[store] Current documents count:', state.documents.length)
    
    // Clean settings object to remove undefined fields
    const cleanSettings = {
      partners: state.settings.partners,
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      appName: state.settings.appName,
      features: state.settings.features,
    }
    
    const settingsRef = doc(db, 'users', userId, 'settings', 'main')
    setDoc(settingsRef, cleanSettings, { merge: true })
      .then(() => console.log('[store] Settings auto-saved'))
      .catch((error) => console.error('[store] Failed to auto-save settings:', error))
  }, [state.settings, isLoaded, userId])

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
          // Force reload after a short delay to ensure consistency
          setTimeout(() => {
            console.log('[store] Forcing reload after adding car')
            if (userId) {
              loadStateFromFirestore(userId).then((newState) => {
                if (newState) {
                  console.log('[store] Reloaded state after adding car:', newState.cars.length, 'cars')
                  console.log('[store] Car names after reload:', newState.cars.map(c => ({ id: c.id, name: c.name })))
                  setState(newState)
                }
              })
            }
          }, 1000)
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
  }, [])

  const deleteExpense = useCallback((carId: string, expenseId: string) => {
    setState((prev) => ({
      ...prev,
      cars: prev.cars.map((car) =>
        car.id === carId
          ? { ...car, expenses: car.expenses.filter((e) => e.id !== expenseId) }
          : car
      ),
    }))
  }, [])

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
  }, [])

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

  const addPartner = useCallback((name: string) => {
    const newPartner: Partner = { id: generateId(), name }
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners: [...prev.settings.partners, newPartner],
      },
    }))
  }, [])

  const updatePartner = useCallback((partnerId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners: prev.settings.partners.map((partner) =>
          partner.id === partnerId ? { ...partner, name } : partner
        ),
      },
    }))
  }, [])

  const deletePartner = useCallback((partnerId: string) => {
    if (partnerId === 'me') return
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        partners: prev.settings.partners.filter((p) => p.id !== partnerId),
      },
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

  const updateFeatures = useCallback((features: Partial<{ sorting: boolean; purchaseDate: boolean; licensePlate: boolean; search: boolean; documents: boolean; km: boolean; year: boolean }>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        features: {
          ...prev.settings.features,
          ...features,
        },
      },
    }))
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

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme,
      },
    }))
  }, [])

  // Apply theme changes immediately
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const resetGarage = useCallback(async () => {
    console.log('[store] Resetting garage - deleting all cars and documents')
    console.log('[store] Current cars count:', state.cars.length)
    console.log('[store] Current cars:', state.cars.map(c => ({ id: c.id, name: c.name })))
    
    // Delete all documents from Firebase (but keep collection structure)
    if (userId && db) {
      console.log('[store] Starting documents deletion...')
      
      // Delete documents
      const documentsRef = collection(db, 'users', userId, 'documents')
      const documentsSnap = await getDocs(documentsRef)
      console.log('[store] Found documents to delete:', documentsSnap.docs.length)
      
      // Delete cars
      const carsRef = collection(db, 'users', userId, 'cars')
      const carsSnap = await getDocs(carsRef)
      console.log('[store] Found cars to delete:', carsSnap.docs.length)
      
      const batch = writeBatch(db)
      
      // Delete all documents
      documentsSnap.forEach((docDoc) => {
        console.log('[store] Deleting document:', docDoc.id)
        batch.delete(doc(documentsRef, docDoc.id))
      })
      
      // Delete all cars documents
      carsSnap.forEach((carDoc) => {
        console.log('[store] Deleting car:', carDoc.id)
        batch.delete(doc(carsRef, carDoc.id))
      })
      
      await batch.commit()
      console.log('[store] Documents and cars deleted from Firestore, collections preserved')
    } else {
      console.log('[store] No userId or db, skipping Firebase deletion')
    }
    
    // Reset local state completely
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
    
    console.log('[store] Garage reset complete')
  }, [userId, state.settings])

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
  }
}
