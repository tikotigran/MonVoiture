'use client'

import { useState, useEffect } from 'react'
import { Trash2, UserPlus, Edit2, AlertTriangle } from 'lucide-react'
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
import type { Partner } from '@/lib/types'
import { t } from '@/lib/translations'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partners: Partner[]
  currency: string
  language: 'ru' | 'fr' | 'hy' | 'en'
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
  onAddPartner: (name: string) => void
  onDeletePartner: (id: string) => void
  onUpdatePartner: (id: string, name: string) => void
  onUpdateCurrency: (currency: string) => void
  onUpdateFeatures: (features: { sorting?: boolean; purchaseDate?: boolean; licensePlate?: boolean; search?: boolean; documents?: boolean; km?: boolean; year?: boolean }) => void
  onUpdateLanguage: (language: 'ru' | 'fr' | 'hy' | 'en') => void
  onUpdateTheme: (theme: 'light' | 'dark' | 'system') => void
  onResetGarage?: () => void
}

export function SettingsSheet({
  open,
  onOpenChange,
  partners,
  currency,
  language,
  theme,
  features,
  onAddPartner,
  onDeletePartner,
  onUpdatePartner,
  onUpdateCurrency,
  onUpdateFeatures,
  onUpdateLanguage,
  onUpdateTheme,
  onResetGarage,
}: SettingsSheetProps) {
  const [newPartnerName, setNewPartnerName] = useState('')
  const [tempCurrency, setTempCurrency] = useState(currency)
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null)
  const [editingPartnerName, setEditingPartnerName] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')

  const RESET_PASSWORD = 'garage2024'

  useEffect(() => {
    if (open) {
      setTempCurrency(currency)
    }
  }, [open, currency])

  const handleAddPartner = () => {
    if (!newPartnerName.trim()) return
    onAddPartner(newPartnerName.trim())
    setNewPartnerName('')
  }

  const handleEditPartner = (partnerId: string, currentName: string) => {
    setEditingPartnerId(partnerId)
    setEditingPartnerName(currentName)
  }

  const handleSavePartner = () => {
    if (!editingPartnerName.trim() || !editingPartnerId) return
    onUpdatePartner(editingPartnerId, editingPartnerName.trim())
    setEditingPartnerId(null)
    setEditingPartnerName('')
  }

  const handleCancelEdit = () => {
    setEditingPartnerId(null)
    setEditingPartnerName('')
  }

  const handleResetGarage = () => {
    console.log('[settings] User entered password:', resetPassword)
    console.log('[settings] Expected password:', RESET_PASSWORD)
    console.log('[settings] Passwords match:', resetPassword === RESET_PASSWORD)
    
    if (resetPassword !== RESET_PASSWORD) {
      setResetError(t('settings.resetPasswordError', language))
      return
    }
    onResetGarage?.()
    setShowResetDialog(false)
    setResetPassword('')
    setResetError('')
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
          <div className="space-y-4">
            <Label>{t('label.partners', language)}</Label>
            <div className="space-y-2">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {partner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {editingPartnerId === partner.id ? (
                      <Input
                        value={editingPartnerName}
                        onChange={(e) => setEditingPartnerName(e.target.value)}
                        className="h-8 px-2 text-sm"
                        placeholder={t('placeholder.partnerName', language)}
                      />
                    ) : (
                      <span className="font-medium">{partner.name}</span>
                    )}
                    {partner.id === 'me' && (
                      <span className="text-sm text-muted-foreground">
                        ({t('label.me', language)})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {editingPartnerId === partner.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={handleSavePartner}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEdit}
                        >
                          ×
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditPartner(partner.id, partner.name)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {partner.id !== 'me' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDeletePartner(partner.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t('placeholder.partnerName', language)}
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPartner()}
              />
              <Button onClick={handleAddPartner} disabled={!newPartnerName.trim()}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('button.addPartner', language)}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>{t('settings.features', language)}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.sorting', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.sortingDesc', language)}</div>
                </div>
                <Switch
                  checked={features.sorting}
                  onCheckedChange={(checked) => onUpdateFeatures({ sorting: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.purchaseDate', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.purchaseDateDesc', language)}</div>
                </div>
                <Switch
                  checked={features.purchaseDate}
                  onCheckedChange={(checked) => onUpdateFeatures({ purchaseDate: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.licensePlate', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.licensePlateDesc', language)}</div>
                </div>
                <Switch
                  checked={features.licensePlate}
                  onCheckedChange={(checked) => onUpdateFeatures({ licensePlate: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.search', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.searchDesc', language)}</div>
                </div>
                <Switch
                  checked={features.search}
                  onCheckedChange={(checked) => onUpdateFeatures({ search: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.documents', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.documentsDesc', language)}</div>
                </div>
                <Switch
                  checked={features.documents}
                  onCheckedChange={(checked) => onUpdateFeatures({ documents: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.km', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.kmDesc', language)}</div>
                </div>
                <Switch
                  checked={features.km}
                  onCheckedChange={(checked) => onUpdateFeatures({ km: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('settings.year', language)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.yearDesc', language)}</div>
                </div>
                <Switch
                  checked={features.year}
                  onCheckedChange={(checked) => onUpdateFeatures({ year: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>{t('settings.language', language)}</Label>
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
          </div>

          {onResetGarage && (
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
                    placeholder={t('settings.resetPasswordPlaceholder', language)}
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value)
                      setResetError('')
                    }}
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
