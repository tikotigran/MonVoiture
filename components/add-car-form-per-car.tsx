'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, X, Plus, Edit2 } from 'lucide-react'
import { useToasts } from '@/components/ui/animations'
import { Switch } from '@/components/ui/switch'
import { t } from '@/lib/translations'
import type { Car, Partner } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CarPartner {
  id: string
  name: string
  share: number
}

interface AddCarFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (car: Omit<Car, 'id' | 'expenses' | 'status'>) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
  features?: {
    purchaseDate: boolean
    licensePlate: boolean
    km: boolean
    year: boolean
  }
  ownerName?: string // Имя владельца аккаунта
  partners?: Partner[] // Партнеры из настроек
}

export function AddCarForm({ open, onOpenChange, onAdd, language = 'ru', features = { purchaseDate: true, licensePlate: true, km: true, year: true }, ownerName, partners = [] }: AddCarFormProps) {
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [year, setYear] = useState('')
  const [km, setKm] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [isPartnership, setIsPartnership] = useState(false)
  const [carPartners, setCarPartners] = useState<CarPartner[]>([])
  const [newPartnerName, setNewPartnerName] = useState('')
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null)
  const [editingPartnerName, setEditingPartnerName] = useState('')
  const [notes, setNotes] = useState('')
  const { success, error } = useToasts()

  const handlePartnershipChange = (checked: boolean) => {
    setIsPartnership(checked)
    if (checked && ownerName) {
      // Add owner as first partner with 50%
      const ownerPartner: CarPartner = {
        id: 'me',
        name: ownerName,
        share: 50
      }
      setCarPartners([ownerPartner])
    } else if (!checked) {
      setCarPartners([])
    }
  }

  const addPartner = () => {
    const trimmedName = newPartnerName.trim()
    
    // Skip if empty or just single character like "я"
    if (!trimmedName || trimmedName.length < 2) {
      setNewPartnerName('')
      return
    }
    
    const partnerName = trimmedName || `Партнер ${carPartners.length + 1}`
    
    const newPartner: CarPartner = {
      id: Date.now().toString(),
      name: partnerName,
      share: 50, // Will be redistributed
    }
    const updatedPartners = [...carPartners, newPartner]
    setCarPartners(updatedPartners)
    setNewPartnerName('')
    redistributeShares(updatedPartners)
  }

  const redistributeShares = (currentPartners: CarPartner[]) => {
    if (currentPartners.length === 0) return
    
    const equalShare = Math.floor(100 / currentPartners.length)
    const remainder = 100 - (equalShare * currentPartners.length)
    
    const updatedPartners = currentPartners.map((partner, index) => ({
      ...partner,
      share: equalShare + (index === 0 ? remainder : 0)
    }))
    
    setCarPartners(updatedPartners)
  }

  const updatePartnerShare = (id: string, share: number) => {
    setCarPartners(carPartners.map(p => 
      p.id === id ? { ...p, share: Math.max(0, Math.min(100, share)) } : p
    ))
  }

  const removePartner = (id: string) => {
    if (carPartners.length <= 1) return // Нельзя удалить последнего партнера
  
    const newPartners = carPartners.filter(p => p.id !== id)
    setCarPartners(newPartners)
    if (newPartners.length > 0) {
      redistributeShares(newPartners)
    }
  }

  const startEditPartner = (partner: CarPartner) => {
    setEditingPartnerId(partner.id)
    setEditingPartnerName(partner.name)
  }

  const saveEditPartner = () => {
    if (editingPartnerName.trim() && editingPartnerId) {
      setCarPartners(carPartners.map(p => 
        p.id === editingPartnerId ? { ...p, name: editingPartnerName.trim() } : p
      ))
      setEditingPartnerId(null)
      setEditingPartnerName('')
    }
  }

  const cancelEditPartner = () => {
    setEditingPartnerId(null)
    setEditingPartnerName('')
  }

  const resetForm = () => {
    setName('')
    setLicensePlate('')
    setYear('')
    setKm('')
    setPurchasePrice('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setIsPartnership(false)
    setCarPartners([])
    setNewPartnerName('')
    setEditingPartnerId(null)
    setEditingPartnerName('')
    setNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error(t('error.carNameRequired', language))
      return
    }

    const partnerShares: { [partnerId: string]: number } = {}
    const partnerNames: { [partnerId: string]: string } = {}
    if (isPartnership && carPartners.length > 0) {
      carPartners.forEach((partner) => {
        partnerShares[partner.id] = partner.share
        partnerNames[partner.id] = partner.name
      })
    }

    onAdd({
      name: name.trim(),
      licensePlate: licensePlate.trim() || undefined,
      year: year.trim() ? parseInt(year.trim()) : undefined,
      km: km.trim() ? parseInt(km.trim()) : undefined,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      isPartnership,
      partnerShares: Object.keys(partnerShares).length > 0 ? partnerShares : undefined,
      partnerNames: Object.keys(partnerNames).length > 0 ? partnerNames : undefined,
      notes: notes.trim(),
    })

    success(t('message.carAdded', language), `Машина "${name.trim()}" успешно добавлена`)
    resetForm()
    onOpenChange(false)
  }

  const totalShares = carPartners.reduce((sum, p) => sum + p.share, 0)
  const isSharesValid = totalShares === 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t('dialog.addCar', language)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('label.carName', language)}</Label>
              <Input
                id="name"
                placeholder="Toyota Camry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {features.licensePlate && (
            <div className="space-y-2">
              <Label htmlFor="license-plate">{t('label.licensePlate', language)}</Label>
              <Input
                id="license-plate"
                placeholder={t('placeholder.licensePlate', language)}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              />
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="price">{t('label.purchasePrice', language)}</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            {features.year && (
            <div className="space-y-2">
              <Label htmlFor="year">{t('label.year', language)}</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            )}

            {features.km && (
            <div className="space-y-2">
              <Label htmlFor="km">{t('label.km', language)}</Label>
              <Input
                id="km"
                type="number"
                placeholder="150000"
                min="0"
                step="1"
                value={km}
                onChange={(e) => setKm(e.target.value)}
              />
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">{t('label.purchaseDate', language)}</Label>
              <Input
                id="date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            {/* Партнерство */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="partnership">{t('label.partnership', language)}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('description.shareExpenses', language)}
                </p>
              </div>
              <Switch
                id="partnership"
                checked={isPartnership}
                onCheckedChange={handlePartnershipChange}
              />
            </div>

            {/* Управление партнерами */}
            {isPartnership && (
              <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <Label>{t('label.partners', language)}</Label>
                
                {/* Добавление нового партнера */}
                <div className="flex gap-2">
                  <Input
                    placeholder={`Введите имя партнера (минимум 2 символа)`}
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPartner()}
                  />
                  <Button type="button" onClick={addPartner}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Список партнеров */}
                {carPartners.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Партнеры:</Label>
                    {carPartners.map((partner) => (
                      <div key={partner.id} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                        {editingPartnerId === partner.id ? (
                          <>
                            <Input
                              value={editingPartnerName}
                              onChange={(e) => setEditingPartnerName(e.target.value)}
                              className="flex-1"
                              placeholder="Имя партнера"
                              autoFocus
                            />
                            <Button type="button" size="sm" onClick={saveEditPartner}>
                              ✓
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={cancelEditPartner}>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{partner.name}</span>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={partner.share}
                                onChange={(e) => updatePartnerShare(partner.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-xs"
                                min="0"
                                max="100"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startEditPartner(partner)}
                              className="w-8 h-8 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePartner(partner.id)}
                              className="w-8 h-8 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {/* Валидация суммы */}
                    <div className={`text-xs ${isSharesValid ? 'text-green-600' : 'text-red-500'}`}>
                      {t('label.totalShares', language)}: {totalShares}%
                      {!isSharesValid && (
                        <span className="ml-1">
                          ({t('warning.shouldBe100', language)})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t('label.notes', language)}</Label>
              <textarea
                id="notes"
                placeholder={t('placeholder.notes', language)}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!name.trim() || (isPartnership && (!isSharesValid || carPartners.length === 0))}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('button.addCar', language)}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
