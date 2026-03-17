'use client'

import { useState } from 'react'
import { Plus, Wallet, Calendar, Tag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Partner, Expense } from '@/lib/types'
import { t } from '@/lib/translations'

interface AddExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partners: Partner[]
  isPartnership: boolean
  onAdd: (expense: Omit<Expense, 'id'>) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function AddExpenseForm({
  open,
  onOpenChange,
  partners,
  isPartnership,
  onAdd,
  language = 'ru',
}: AddExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Expense['category']>('parts')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState<string>('')

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('parts')
    setDate(new Date().toISOString().split('T')[0])
    setPaidBy('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || (isPartnership && !paidBy)) return

    onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      paidBy: isPartnership ? paidBy : undefined,
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

          {isPartnership && (
            <div className="space-y-1">
              <Label htmlFor="paid-by">{t('label.paidBy', language)}</Label>
              <ToggleGroup
                type="single"
                value={paidBy}
                onValueChange={setPaidBy}
                className="w-full"
              >
                {partners.map((partner) => (
                  <ToggleGroupItem key={partner.id} value={partner.id} className="flex-1 text-xs">
                    {partner.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!description.trim() || !amount || (isPartnership && !paidBy)}
          >
            {t('button.addExpense', language)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}