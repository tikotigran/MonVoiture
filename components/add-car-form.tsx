'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, X, Plus, CheckCircle } from 'lucide-react'
import { useToasts } from '@/components/ui/animations'
import { Switch } from '@/components/ui/switch'
import { t } from '@/lib/translations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Car, Partner } from '@/lib/types'

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
}

export function AddCarForm({ open, onOpenChange, onAdd, language = 'ru', features = { purchaseDate: true, licensePlate: true, km: true, year: true } }: AddCarFormProps) {
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [year, setYear] = useState('')
  const [km, setKm] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isPartnership, setIsPartnership] = useState(false)
  const [partners, setPartners] = useState<Array<{id: string, name: string, share: number}>>([])
  const [newPartnerName, setNewPartnerName] = useState('')
  const { success, error } = useToasts()

  const resetForm = () => {
    setName('')
    setLicensePlate('')
    setYear('')
    setKm('')
    setPurchasePrice('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setIsPartnership(false)
    setPartners([])
    setNewPartnerName('')
  }

  const addPartner = () => {
    if (!newPartnerName.trim()) return
    
    const newPartner = {
      id: Date.now().toString(),
      name: newPartnerName.trim(),
      share: partners.length === 0 ? 50 : 25 // First partner gets 50%, others get 25%
    }
    
    setPartners([...partners, newPartner])
    setNewPartnerName('')
  }

  const updatePartnerShare = (id: string, share: number) => {
    setPartners(partners.map(p => 
      p.id === id ? { ...p, share: Math.max(0, Math.min(100, share)) } : p
    ))
  }

  const removePartner = (id: string) => {
    setPartners(partners.filter(p => p.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error(t('error.carNameRequired', language))
      return
    }

    const carData: Omit<Car, 'id' | 'expenses' | 'status'> = {
      name: name.trim(),
      isPartnership: isPartnership,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    }

    // Add optional fields only if they have values
    if (licensePlate.trim()) carData.licensePlate = licensePlate.trim()
    if (year.trim()) carData.year = parseInt(year.trim())
    if (km.trim()) carData.km = parseInt(km.trim())
    if (purchasePrice.trim()) carData.purchasePrice = parseFloat(purchasePrice.trim())
    if (purchaseDate.trim()) carData.purchaseDate = purchaseDate.trim()
    if (notes.trim()) carData.notes = notes.trim()
    if (isPartnership && partners.length > 0) {
      const partnerShares: { [partnerId: string]: number } = {}
      partners.forEach(partner => {
        partnerShares[partner.id] = partner.share
      })
      carData.partnerShares = partnerShares
    }

    onAdd({
      name: name.trim(),
      licensePlate: licensePlate.trim() || undefined,
      year: year.trim() ? parseInt(year.trim()) : undefined,
      km: km.trim() ? parseInt(km.trim()) : undefined,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      isPartnership: isPartnership,
      partnerShares: isPartnership && partners.length > 0 ? 
        partners.reduce((acc, partner) => {
          acc[partner.id] = partner.share
          return acc
        }, {} as { [partnerId: string]: number }) : undefined,
      notes: notes.trim(),
    })
    success(t('message.carAdded', language), `Машина "${name.trim()}" успешно добавлена`)
    resetForm()
    onOpenChange(false)
  }

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

            <div className="space-y-2">
              <Label htmlFor="notes">{t('label.notes', language)}</Label>
              <Input
                id="notes"
                placeholder="Дополнительная информация о машине"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="partnership"
                  checked={isPartnership}
                  onCheckedChange={setIsPartnership}
                />
                <Label htmlFor="partnership">{t('label.partnership', language)}</Label>
              </div>

              {isPartnership && (
                <div className="space-y-4">
                  <Label>{t('label.partners', language)}</Label>
                  
                  {/* Add new partner */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('placeholder.enterPartnerName', language)}
                      value={newPartnerName}
                      onChange={(e) => setNewPartnerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPartner()}
                    />
                    <Button type="button" onClick={addPartner} disabled={!newPartnerName.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Partners list */}
                  {partners.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('label.profitShares', language)}</Label>
                      {partners.map((partner) => (
                        <div key={partner.id} className="flex items-center gap-2">
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePartner(partner.id)}
                              className="w-8 h-8 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total percentage warning */}
                      <div className="text-xs text-gray-500">
                        {t('label.totalShares', language)}: {partners.reduce((sum, p) => sum + p.share, 0)}%
                        {partners.reduce((sum, p) => sum + p.share, 0) !== 100 && (
                          <span className="text-red-500 ml-1">
                            ({t('warning.shouldBe100', language)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                {t('button.add', language)}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                {t('button.cancel', language)}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
