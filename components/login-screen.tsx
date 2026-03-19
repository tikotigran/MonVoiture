'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { t } from '@/lib/translations'

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void | Promise<void>
  onRegister: (email: string, password: string, firstName: string, lastName: string, garageName: string) => void | Promise<void>
  error?: string
  isLoading?: boolean
}

export function LoginScreen({ onLogin, onRegister, error = '', isLoading = false }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [localError, setLocalError] = useState('')
  
  // Registration fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [garageName, setGarageName] = useState('')
  const language = 'ru'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email.trim()) {
      setLocalError(t('error.emailRequired', language))
      return
    }
    if (!password) {
      setLocalError(t('error.passwordRequired', language))
      return
    }
    if (password.length < 6) {
      setLocalError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (mode === 'register') {
      if (!firstName.trim()) {
        setLocalError(t('error.firstNameRequired', language))
        return
      }
      if (!garageName.trim()) {
        setLocalError(t('error.garageNameRequired', language))
        return
      }
    }

    if (mode === 'login') {
      await onLogin(email.trim(), password)
    } else {
      await onRegister(email.trim(), password, firstName.trim(), lastName.trim(), garageName.trim())
    }
  }

  const displayError = error || localError

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title', language)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? t('link.haveAccount', language) : t('link.noAccount', language)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('label.email', language)}
            </label>
            <Input
              type="email"
              placeholder={t('placeholder.email', language)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('label.firstName', language)}
                </label>
                <Input
                  type="text"
                  placeholder={t('placeholder.firstName', language)}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('label.lastName', language)}
                </label>
                <Input
                  type="text"
                  placeholder={t('placeholder.lastName', language)}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('label.garageName', language)}
                </label>
                <Input
                  type="text"
                  placeholder={t('placeholder.garageName', language)}
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('label.password', language)}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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

          {displayError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{displayError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                {mode === 'login' ? t('message.loading', language) : t('message.loading', language)}
              </span>
            ) : (
              mode === 'login' ? t('button.login', language) : t('button.register', language)
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => setMode('register')}
            >
              {t('link.noAccount', language)}
            </button>
          ) : (
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => setMode('login')}
            >
              {t('link.haveAccount', language)}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}

