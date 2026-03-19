'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { Car } from '@/lib/types'

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
  const { success, error } = useToasts()

  const resetForm = () => {
    setName('')
    setLicensePlate('')
    setYear('')
    setKm('')
    setPurchasePrice('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error(t('error.carNameRequired', language))
      return
    }

    const carData: Omit<Car, 'id' | 'expenses' | 'status'> = {
      name: name.trim(),
      isPartnership: false,
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

    onAdd({
      name: name.trim(),
      licensePlate: licensePlate.trim() || undefined,
      year: year.trim() ? parseInt(year.trim()) : undefined,
      km: km.trim() ? parseInt(km.trim()) : undefined,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      isPartnership: false,
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
