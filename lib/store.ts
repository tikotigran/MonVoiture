'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AppState, Car, Expense, Partner, Document, AppSettings, ChecklistItem } from './types'
import { generateId } from './format'
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore'

const defaultState: AppState = {
  cars: [],
  documents: [],
  settings: {
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
    let settings = defaultState.settings
    
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
    
    if (currencySnap.exists()) {
      settings.currency = currencySnap.data().value
    }
    if (languageSnap.exists()) {
      settings.language = languageSnap.data().value
    }
    if (themeSnap.exists()) {
      settings.theme = themeSnap.data().value
    }
    if (appNameSnap.exists()) {
      settings.appName = appNameSnap.data().value
    }
    if (featuresSnap.exists()) {
      settings.features = featuresSnap.data().items
    }

    // Also check if old settings exist and migrate them
    const oldSettingsRef = doc(db, 'users', userId, 'settings', 'main')
    const oldSettingsSnap = await getDoc(oldSettingsRef)
    console.log('[store] Old settings exist:', oldSettingsSnap.exists())
    if (oldSettingsSnap.exists()) {
      console.log('[store] Old settings data:', oldSettingsSnap.data())
      console.log('[store] Migrating old settings to new structure...')
      
      const oldData = oldSettingsSnap.data() as any
      const migrationPromises = []
      
      // Migrate each setting to new structure
      if (oldData.currency) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
            value: oldData.currency 
          })
        )
      }
      if (oldData.language) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
            value: oldData.language 
          })
        )
      }
      if (oldData.theme) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
            value: oldData.theme 
          })
        )
      }
      if (oldData.appName) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
            value: oldData.appName 
          })
        )
      }
      if (oldData.features) {
        migrationPromises.push(
          setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
            items: oldData.features 
          })
        )
      }
      
      await Promise.all(migrationPromises)
      console.log('[store] Migration completed, deleting old settings...')
      
      // Delete old settings after migration
      await deleteDoc(oldSettingsRef)
      console.log('[store] Old settings deleted')
    } else {
      // Create initial settings if none exist
      console.log('[store] No old settings found, creating initial settings...')
      const initialSettings = defaultState.settings
      const initialPromises = []
      
      initialPromises.push(
        setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
          value: initialSettings.currency 
        })
      )
      initialPromises.push(
        setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
          value: initialSettings.language 
        })
      )
      initialPromises.push(
        setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
          value: initialSettings.theme 
        })
      )
      initialPromises.push(
        setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
          value: initialSettings.appName 
        })
      )
      initialPromises.push(
        setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
          items: initialSettings.features 
        })
      )
      
      await Promise.all(initialPromises)
      console.log('[store] Initial settings created')
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
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      appName: state.settings.appName,
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
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      appName: state.settings.appName,
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
        setState(defaultState)
        setIsLoaded(true)
        return
      }

      const fromRemote = await loadStateFromFirestore(userId)
      if (cancelled) return

      if (fromRemote) {
        setState(fromRemote)
      } else {
        setState(defaultState)
      }
      setIsLoaded(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!isLoaded || !userId || !db) return
    // Only save settings automatically, not cars (cars are saved individually)
    console.log('[store] Auto-save effect triggered, but only saving settings')
    console.log('[store] Current cars count:', state.cars.length)
    console.log('[store] Current documents count:', state.documents.length)
    
    // Save settings as individual documents like cars and documents
    const settingsData = state.settings
    const settingsPromises = []
    
    // Save each setting as a separate document
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'currency'), { 
        value: settingsData.currency 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'language'), { 
        value: settingsData.language 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'theme'), { 
        value: settingsData.theme 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'appName'), { 
        value: settingsData.appName 
      })
    )
    settingsPromises.push(
      setDoc(doc(db, 'users', userId, 'settings', 'features'), { 
        items: settingsData.features 
      })
    )
    
    Promise.all(settingsPromises)
      .then(() => console.log('[store] Settings saved as individual documents'))
      .catch((error) => console.error('[store] Failed to save settings:', error))
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

  // Auto-save settings to Firebase when they change
  useEffect(() => {
    if (userId && db && isLoaded) {
      console.log('[store] Auto-saving settings to Firestore as individual documents')
      
      const settingsPromises = [
        setDoc(doc(db, 'users', userId, 'settings', 'currency'), 
          { currency: state.settings.currency }),
        setDoc(doc(db, 'users', userId, 'settings', 'language'), 
          { language: state.settings.language }),
        setDoc(doc(db, 'users', userId, 'settings', 'theme'), 
          { theme: state.settings.theme }),
        setDoc(doc(db, 'users', userId, 'settings', 'appName'), 
          { appName: state.settings.appName }),
        setDoc(doc(db, 'users', userId, 'settings', 'features'), 
          { features: state.settings.features }),
      ]
      
      Promise.all(settingsPromises)
        .then(() => console.log('[store] Settings auto-saved to Firestore'))
        .catch((error) => console.error('[store] Failed to auto-save settings:', error))
    }
  }, [userId, db, isLoaded, state.settings])

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
    addDocument,
    deleteDocument,
    updateTheme,
    resetGarage,
  }
}
