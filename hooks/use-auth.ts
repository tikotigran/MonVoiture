'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface UseAuthResult {
  user: User | null
  loading: boolean
  error: string | null
  register: (email: string, password: string, firstName: string, lastName: string, garageName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, garageName: string) => {
    setError(null)
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Save user profile to Firestore
      if (user) {
        console.log('Saving user data to Firestore:', { firstName, lastName, garageName })
        
        // Сначала сохраняем профиль в settings/userInfo (самое важное)
        await setDoc(doc(db, 'users', user.uid, 'settings', 'userInfo'), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          garageName: garageName.trim(),
          email: email.trim(),
          createdAt: new Date().toISOString()
        })
        console.log('[auth] User profile saved to settings userInfo:', firstName, lastName, garageName)
        
        // Затем сохраняем профиль в profile/doc (для совместимости)
        await setDoc(doc(db, 'users', user.uid, 'profile', 'doc'), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          garageName: garageName.trim(),
          email: email.trim(),
          createdAt: new Date().toISOString()
        })
        console.log('[auth] Profile saved to profile collection:', firstName, lastName, garageName)
        
        // Initialize settings with garageName and user profile
        await setDoc(doc(db, 'users', user.uid, 'settings', 'appName'), {
          appName: garageName.trim()
        })
        
        // Save currency settings
        await setDoc(doc(db, 'users', user.uid, 'settings', 'currency'), {
          currency: '€'
        })
        
        // Save language settings  
        await setDoc(doc(db, 'users', user.uid, 'settings', 'language'), {
          language: 'ru'
        })
        
        // Save theme settings
        await setDoc(doc(db, 'users', user.uid, 'settings', 'theme'), {
          theme: 'system'
        })
        
        // Save features settings
        await setDoc(doc(db, 'users', user.uid, 'settings', 'features'), {
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
          }
        })
        
        console.log('[auth] All settings saved for user:', firstName, lastName, garageName)
        console.log('User data saved successfully')
        
        // Проверяем является ли пользователь администратором
        console.log(`[auth] Checking admin status for: ${email}`)
        
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      await signOut(auth)
    } catch (e: any) {
      setError(e?.message || 'Ошибка выхода')
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading, error, register, login, logout }
}

