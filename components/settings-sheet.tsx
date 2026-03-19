'use client'

import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { User } from 'firebase/auth'
import { t } from '@/lib/translations'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  currency: string
  language: 'ru' | 'fr' | 'hy' | 'en'
  appName: string
  features: {
    sorting: boolean
    purchaseDate: boolean
    licensePlate: boolean
    search: boolean
    documents: boolean
    km: boolean
    year: boolean
  }
  theme: 'light' | 'dark' | 'system'
  onUpdateCurrency: (currency: string) => void
  onUpdateFeatures: (features: any) => void
  onUpdateLanguage: (language: 'ru' | 'fr' | 'hy' | 'en') => void
  onUpdateAppName: (appName: string) => void
  onUpdateTheme: (theme: 'light' | 'dark' | 'system') => void
  onResetGarage?: () => void
}

export function SettingsSheet({
  open,
  onOpenChange,
  user,
  currency,
  language,
  appName,
  features,
  theme,
  onUpdateCurrency,
  onUpdateFeatures,
  onUpdateLanguage,
  onUpdateAppName,
  onUpdateTheme,
  onResetGarage,
}: SettingsSheetProps) {
  const [tempCurrency, setTempCurrency] = useState(currency)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [openFeatures, setOpenFeatures] = useState(false)
  const [openLanguage, setOpenLanguage] = useState(false)
  const [openTheme, setOpenTheme] = useState(false)
  const [openDanger, setOpenDanger] = useState(false)

  useEffect(() => {
    if (open) {
      setTempCurrency(currency)
    }
  }, [open, currency])

  const handleResetGarage = async () => {
    console.log('[settings] Attempting garage reset')
    
    if (!user) {
      setResetError('Требуется авторизация')
      return
    }

    // Simple confirmation - no re-authentication needed
    if (resetPassword.trim() === 'DELETE') {
      console.log('[settings] Confirmation received, resetting garage')
      
      onResetGarage?.()
      setShowResetDialog(false)
      setResetPassword('')
      setResetError('')
    } else {
      setResetError('Введите "DELETE" для подтверждения сброса гаража')
    }
  }

  const handleOpenResetDialog = () => {
    setShowResetDialog(true)
    setResetPassword('')
    setResetError('')
  }

  const handleConfirm = () => {
    if (tempCurrency !== currency) {
      onUpdateCurrency(tempCurrency)
    }
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTempCurrency(currency)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.settings', language)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Collapsible open={openFeatures} onOpenChange={setOpenFeatures}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Label className="cursor-pointer">{t('label.features', language)}</Label>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFeatures ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t('label.sorting', language)}</Label>
                  <Switch
                    checked={features.sorting}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, sorting: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.purchaseDate', language)}</Label>
                  <Switch
                    checked={features.purchaseDate}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, purchaseDate: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.licensePlate', language)}</Label>
                  <Switch
                    checked={features.licensePlate}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, licensePlate: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.search', language)}</Label>
                  <Switch
                    checked={features.search}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, search: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.documents', language)}</Label>
                  <Switch
                    checked={features.documents}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, documents: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.km', language)}</Label>
                  <Switch
                    checked={features.km}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, km: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('label.year', language)}</Label>
                  <Switch
                    checked={features.year}
                    onCheckedChange={(checked) => onUpdateFeatures({ ...features, year: checked })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openLanguage} onOpenChange={setOpenLanguage}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Label className="cursor-pointer">{t('settings.language', language)}</Label>
                <ChevronDown className={`w-4 h-4 transition-transform ${openLanguage ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('label.language', language)}</Label>
                  <Select value={language} onValueChange={(value: 'ru' | 'fr' | 'hy' | 'en') => onUpdateLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="hy">🇦🇲 Հայերեն</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('label.currency', language)}</Label>
                  <Select value={currency} onValueChange={setTempCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="€">€ EUR</SelectItem>
                      <SelectItem value="$">$ USD</SelectItem>
                      <SelectItem value="₽">₽ RUB</SelectItem>
                      <SelectItem value="£">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={true} onOpenChange={() => {}}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Label className="cursor-pointer">{t('settings.appName', language)}</Label>
                <ChevronDown className="w-4 h-4 transition-transform rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">{t('settings.appName', language)}</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => onUpdateAppName(e.target.value)}
                  placeholder={t('settings.appNameDesc', language)}
                />
                <p className="text-xs text-muted-foreground">{t('settings.appNameDesc', language)}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openTheme} onOpenChange={setOpenTheme}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Label className="cursor-pointer">{t('settings.theme', language)}</Label>
                <ChevronDown className={`w-4 h-4 transition-transform ${openTheme ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.theme', language)}</Label>
                <ThemeToggle />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {onResetGarage && (
            <Collapsible open={openDanger} onOpenChange={setOpenDanger}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 hover:bg-destructive/10 cursor-pointer">
                  <Label className="cursor-pointer text-destructive">{t('settings.dangerZone', language)}</Label>
                  <ChevronDown className={`w-4 h-4 transition-transform text-destructive ${openDanger ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="space-y-4 border-t pt-4">
                  <div 
                    className="cursor-pointer hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                    onClick={handleOpenResetDialog}
                  >
                    <Label className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer">
                      {t('settings.resetGarage', language)}
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Диалог подтверждения сброса */}
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {t('settings.resetConfirmTitle', language)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('settings.resetGarageDesc', language)}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-password">{t('settings.resetPassword', language)}</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value)
                      setResetError('')
                    }}
                    placeholder='Введите "DELETE" для подтверждения'
                  />
                  {resetError && (
                    <p className="text-sm text-destructive">{resetError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResetDialog(false)}
                  >
                    {t('button.cancel', language)}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleResetGarage}
                  >
                    {t('settings.resetGarageButton', language)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {t('button.cancel', language)}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
            >
              {t('button.confirm', language)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
