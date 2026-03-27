'use client'

import { useState } from 'react'
import { Plus, Wallet, Calendar, Tag } from 'lucide-react'
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
import type { Expense, Car, UserInfo } from '@/lib/types'
import { t } from '@/lib/translations'

interface AddExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (expense: Omit<Expense, 'id'>) => Promise<void>
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState<string | null>(car?.partnerNames && Object.keys(car.partnerNames).filter(id => id !== 'me').length > 0 ? null : 'me')

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setPaidBy(car?.partnerNames && Object.keys(car.partnerNames).filter(id => id !== 'me').length > 0 ? null : 'me')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || !paidBy) return

    await onAdd({
      description: description.trim(),
      amount: parseFloat(amount),
      category: 'other',
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
            <Label htmlFor="date">{t('label.date', language)}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {(car?.partnerNames && Object.keys(car.partnerNames).filter(id => id !== 'me').length > 0) && (
          <div className="space-y-1">
            <Label>{t('label.whoPaid', language)}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paidBy === 'me' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaidBy('me')}
              >
                {userInfo?.firstName || t('label.me', language)}
              </Button>
              {car?.partnerNames && Object.entries(car.partnerNames).map(([partnerId, partnerName]) => (
                partnerId !== 'me' && partnerName && (
                  <Button
                    key={partnerId}
                    type="button"
                    variant={paidBy === partnerId ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setPaidBy(partnerId)}
                  >
                    {partnerName}
                  </Button>
                )
              ))}
            </div>
          </div>
        )}

          <Button
            type="submit"
            className="w-full"
            disabled={!description.trim() || !amount || !paidBy}
          >
            {t('button.addExpense', language)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}