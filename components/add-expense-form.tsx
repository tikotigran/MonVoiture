'use client'

import { useState } from 'react'
import { Plus, Wallet, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Expense, Car, UserInfo } from '@/lib/types'
import { t } from '@/lib/translations'

interface AddExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (expense: Omit<Expense, 'id'>) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
  car?: Car
  userInfo?: UserInfo
}

export function AddExpenseForm({
  open,
  onOpenChange,
  onAdd,
  language = 'ru',
  car,
  userInfo,
}: AddExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Expense['category']>('parts')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState<string>('me')

  // Helper function to get partner options
  const getPartnerOptions = () => {
    const options = [
      { value: 'me', label: userInfo?.firstName || t('label.me', language) }
    ]
    
    if (car?.partnerNames) {
      Object.entries(car.partnerNames).forEach(([partnerId, partnerName]) => {
        // Skip 'me' to avoid duplicates
        if (partnerId !== 'me' && partnerName) {
          options.push({
            value: partnerId,
            label: partnerName
          })
        }
      })
    }
    
    // Remove duplicates based on value
    const uniqueOptions = options.filter((option, index, self) =>
      index === self.findIndex((opt) => opt.value === option.value)
    )
    
    return uniqueOptions
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('parts')
    setDate(new Date().toISOString().split('T')[0])
    setPaidBy('me')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount) return

    onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      paidBy: paidBy === 'me' ? 'me' : paidBy,
    })

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{t('dialog.newExpense', language)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-4">
          <div className="space-y-1">
            <Label htmlFor="description">{t('label.whatDidYouBuy', language)}</Label>
            <Input
              id="description"
              placeholder={t('placeholder.expenseExample', language)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">{t('label.amount', language)}</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">{t('label.category', language)}</Label>
            <ToggleGroup
              type="single"
              value={category}
              onValueChange={(value) => setCategory(value as Expense['category'])}
              className="w-full grid grid-cols-2 gap-1"
            >
              <ToggleGroupItem value="parts" className="flex-1 text-xs">
                {t('category.parts', language)}
              </ToggleGroupItem>
              <ToggleGroupItem value="repair" className="flex-1 text-xs">
                {t('category.repair', language)}
              </ToggleGroupItem>
              <ToggleGroupItem value="documents" className="flex-1 text-xs">
                {t('category.documents', language)}
              </ToggleGroupItem>
              <ToggleGroupItem value="other" className="flex-1 text-xs">
                {t('category.other', language)}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">{t('label.date', language)}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="paidBy">{t('label.whoPaid', language)}</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger>
                <SelectValue placeholder={t('placeholder.selectWhoPaid', language)} />
              </SelectTrigger>
              <SelectContent>
                {getPartnerOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!description.trim() || !amount}
          >
            {t('button.addExpense', language)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}