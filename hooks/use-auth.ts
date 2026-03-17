'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface UseAuthResult {
  user: User | null
  loading: boolean
  error: string | null
  register: (email: string, password: string) => Promise<void>
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

  const register = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
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

