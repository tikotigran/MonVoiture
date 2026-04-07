'use client'

import { useState } from 'react'
import { Car, MoreVertical, LogOut, Search, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { t } from '@/lib/translations'

interface HeaderProps {
  onOpenSettings: () => void
  onLogout: () => void
  onSearch: (query: string) => void
  searchQuery: string
  language?: 'ru' | 'fr' | 'hy' | 'en'
  appName?: string
  showSearch?: boolean
  onUpdateLanguage?: (language: 'ru' | 'fr' | 'hy' | 'en') => void
}

export function Header({ 
  onOpenSettings, 
  onLogout, 
  onSearch, 
  searchQuery, 
  language = 'ru', 
  appName = 'MyGarage',
  showSearch = true,
  onUpdateLanguage
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Логотип */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">{appName}</h1>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <>
              {!isSearchOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="h-9 w-9"
                >
                  <Search className="w-5 h-5" />
                  <span className="sr-only">Поиск</span>
                </Button>
              ) : (
                <div className="relative flex items-center gap-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('placeholder.searchCars', language)}
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-10 w-48 sm:w-64 bg-background"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsSearchOpen(false)
                      onSearch('')
                    }}
                    className="h-9 w-9"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Закрыть</span>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* 3 точки настроек */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
                <span className="sr-only">{t('button.settings', language)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Admin Panel Link - только для админа */}
              {typeof window !== 'undefined' && localStorage.getItem('user') && 
               JSON.parse(localStorage.getItem('user') || '{}').email === 'tikjan1983@gmail.com' && (
                <DropdownMenuItem onClick={() => window.open('/admin', '_blank')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Админ Панель
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onOpenSettings}>
                {t('button.settings', language)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t('button.logout', language)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}