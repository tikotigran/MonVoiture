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
import type { Partner, Car } from '@/lib/types'

interface AddCarFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partners: Partner[]
  onAdd: (car: Omit<Car, 'id' | 'expenses' | 'status'>) => void
  onAddPartner: (name: string) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
  features?: {
    purchaseDate: boolean
    licensePlate: boolean
    km: boolean
    year: boolean
  }
}

export function AddCarForm({ open, onOpenChange, partners, onAdd, onAddPartner, language = 'ru', features = { purchaseDate: true, licensePlate: true, km: true, year: true } }: AddCarFormProps) {
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [year, setYear] = useState('')
  const [km, setKm] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [isPartnership, setIsPartnership] = useState(false)
  const [shares, setShares] = useState<{ [key: string]: number }>({})
  const [newPartnerName, setNewPartnerName] = useState('')
  const [notes, setNotes] = useState('')
  const [showAddPartner, setShowAddPartner] = useState(false)
  const { success, error } = useToasts()

  const hasPartners = partners.filter(p => p.id !== 'me').length >= 1

  const handlePartnershipChange = (checked: boolean) => {
    setIsPartnership(checked)
    if (checked && partners.length > 0) {
      // Auto-fill equal shares
      const equalShare = Math.floor(100 / partners.length)
      const remainder = 100 - (equalShare * partners.length)
      const newShares: { [key: string]: number } = {}
      partners.forEach((p, index) => {
        newShares[p.id] = equalShare + (index === 0 ? remainder : 0)
      })
      setShares(newShares)
    }
  }

  const handleAddPartner = () => {
    if (newPartnerName.trim()) {
      onAddPartner(newPartnerName.trim())
      setNewPartnerName('')
      setShowAddPartner(false)
      success(t('message.partnerAdded', language), `${newPartnerName.trim()} добавлен в партнеры`)
    }
  }

  const resetForm = () => {
    setName('')
    setLicensePlate('')
    setYear('')
    setKm('')
    setPurchasePrice('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setIsPartnership(false)
    setShares({})
    setNewPartnerName('')
    setShowAddPartner(false)
    setNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error(t('error.carNameRequired', language))
      return
    }

    const partnerShares: { [key: string]: number } = {}
    if (isPartnership) {
      partners.forEach((p) => {
        partnerShares[p.id] = shares[p.id] || 0
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
      notes: notes.trim(),
    })

    success(t('message.carAdded', language), `Машина "${name.trim()}" успешно добавлена`)
    resetForm()
    onOpenChange(false)
  }

  const totalShares = Object.values(shares).reduce((sum, s) => sum + s, 0)

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
                <Label htmlFor="partnership">{t('status.partnership', language)}</Label>
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

            {!hasPartners && !showAddPartner && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowAddPartner(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('button.addPartner', language)}
              </Button>
            )}

            {showAddPartner && (
              <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
                <Label>{t('label.partners', language)}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('placeholder.partnerName', language)}
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPartner())}
                  />
                  <Button type="button" onClick={handleAddPartner} disabled={!newPartnerName.trim()}>
                    {t('button.add', language)}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddPartner(false)}
                >
                  {t('button.cancel', language)}
                </Button>
              </div>
            )}

            {isPartnership && hasPartners && (
              <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
                <Label>{t('label.partnerShares', language)}</Label>
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm">{partner.name}</span>
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="50"
                      value={shares[partner.id] || ''}
                      onChange={(e) =>
                        setShares({
                          ...shares,
                          [partner.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                ))}
                {totalShares !== 100 && totalShares > 0 && (
                  <p className="text-sm text-destructive">
                    Сумма долей: {totalShares}% (должно быть 100%)
                  </p>
                )}
              </div>
            )}

            {/* Заметки */}
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
              disabled={!name.trim() || (isPartnership && totalShares !== 100)}
            >
              {t('button.addCar', language)}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
