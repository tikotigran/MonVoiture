'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Partner, Car } from '@/lib/types'
import { t } from '@/lib/translations'

interface EditCarFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  car: Car | null
  onUpdate: (carId: string, updates: Partial<Car>) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
  features?: {
    purchaseDate: boolean
    licensePlate: boolean
    km: boolean
    year: boolean
  }
}

export function EditCarForm({ open, onOpenChange, car, onUpdate, language = 'ru', features = { purchaseDate: true, licensePlate: true, km: true, year: true } }: EditCarFormProps) {
  const [name, setName] = useState(car?.name || '')
  const [licensePlate, setLicensePlate] = useState(car?.licensePlate || '')
  const [year, setYear] = useState(car?.year?.toString() || '')
  const [km, setKm] = useState(car?.km?.toString() || '')
  const [purchasePrice, setPurchasePrice] = useState(car?.purchasePrice?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(car?.purchaseDate || new Date().toISOString().split('T')[0])
  const [salePrice, setSalePrice] = useState(car?.salePrice?.toString() || '')
  const [saleDate, setSaleDate] = useState(car?.saleDate || new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(car?.notes || '')

  useEffect(() => {
    if (car) {
      setName(car.name)
      setLicensePlate(car.licensePlate || '')
      setYear(car.year?.toString() || '')
      setKm(car.km?.toString() || '')
      setPurchasePrice(car.purchasePrice?.toString() || '')
      setPurchaseDate(car.purchaseDate || new Date().toISOString().split('T')[0])
      setSalePrice(car.salePrice?.toString() || '')
      setSaleDate(car.saleDate || new Date().toISOString().split('T')[0])
      setNotes(car.notes || '')
    }
  }, [car])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const carData: Partial<Car> = {
      name: name.trim(),
    }

    if (licensePlate.trim()) carData.licensePlate = licensePlate.trim()
    if (year.trim()) carData.year = parseInt(year.trim())
    if (km.trim()) carData.km = parseInt(km.trim())
    if (purchasePrice.trim()) carData.purchasePrice = parseFloat(purchasePrice.trim())
    if (purchaseDate.trim()) carData.purchaseDate = purchaseDate.trim()
    if (notes.trim()) carData.notes = notes.trim()
    if (salePrice.trim()) carData.salePrice = parseFloat(salePrice.trim())
    if (saleDate.trim()) carData.saleDate = saleDate.trim()

    onUpdate(car?.id || '', carData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t('dialog.editSale', language)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('label.name', language)}</Label>
              <Input
                id="name"
                placeholder={t('placeholder.carName', language)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-plate">{t('label.licensePlate', language)}</Label>
              <Input
                id="license-plate"
                placeholder={t('placeholder.licensePlate', language)}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              />
            </div>

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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">{t('label.salePrice', language)}</Label>
              <Input
                id="salePrice"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">{t('label.saleDate', language)}</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">{t('label.saleDate', language)}</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

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
              disabled={!name.trim()}
            >
              {t('button.save', language)}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
