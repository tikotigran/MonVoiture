'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, DollarSign, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Car, Expense, Document } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { t } from '@/lib/translations'
import { AddExpenseForm } from './add-expense-form'
import { CarDocuments } from './car-documents'
import { CarChecklist } from './car-checklist'
import type { ChecklistItem } from '@/lib/types'

interface CarDetailsProps {
  car: Car
  currency: string
  language: 'ru' | 'fr' | 'hy' | 'en'
  documents: Document[]
  showDocuments: boolean
  showKm: boolean
  showYear: boolean
  onBack: () => void
  onAddExpense: (expense: Omit<Expense, 'id'>) => void
  onUpdateExpense: (expenseId: string, updates: Partial<Expense>) => void
  onDeleteExpense: (expenseId: string) => void
  onSell: (price: number, saleDate: string) => void
  onUpdateSoldCar: (price: number, saleDate: string) => void
  onReturnToSale: () => void
  onAddDocument: (document: Omit<Document, 'id' | 'uploadDate'>) => void
  onDeleteDocument: (documentId: string) => void
  onDelete: () => void
  onUpdateChecklist: (checklist: ChecklistItem[]) => void
}

export function CarDetails({
  car,
  documents,
  showDocuments = true,
  showKm = true,
  showYear = true,
  currency,
  language = 'ru' as const,
  onBack,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onSell,
  onUpdateSoldCar,
  onReturnToSale,
  onAddDocument,
  onDeleteDocument,
  onDelete,
  onUpdateChecklist,
}: CarDetailsProps) {
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSellSheet, setShowSellSheet] = useState(false)
  const [showEditExpense, setShowEditExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState<Expense['category']>('other')
  const [editDate, setEditDate] = useState('')
  const [editPaidBy, setEditPaidBy] = useState<string>('me')
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(car.saleDate || new Date().toISOString().split('T')[0])
  const [expenseFilter, setExpenseFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<string>('expenses')

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditDescription(expense.description)
    setEditAmount(expense.amount.toString())
    setEditCategory(expense.category)
    setEditDate(expense.date)
    setEditPaidBy(expense.paidBy || 'me')
    setShowEditExpense(true)
  }

  const handleSaveExpense = () => {
    if (!editingExpense || !onUpdateExpense || !editDescription || !editAmount) return
    onUpdateExpense(editingExpense.id, {
      description: editDescription,
      amount: parseFloat(editAmount),
      category: editCategory,
      date: editDate,
      paidBy: editPaidBy,
    })
    setShowEditExpense(false)
    setEditingExpense(null)
  }

  const totalExpenses = car.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalInvested = (car.purchasePrice || 0) + totalExpenses
  const profit = car.salePrice ? car.salePrice - totalInvested : 0
  const isProfitable = profit > 0

  // Filter expenses based on selected tab
  const filteredExpenses = car.expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{car.name}</h1>
            <p className="text-sm text-muted-foreground">
              {car.status === 'sold' && car.saleDate
                ? `${t('label.sold', language)} ${formatDate(car.saleDate)}`
                : formatDate(car.purchaseDate)}
            </p>
          </div>
          <Badge
            variant={car.status === 'sold' ? 'default' : 'secondary'}
            className={
              car.status === 'sold'
                ? isProfitable
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
                : ''
            }
          >
            {car.status === 'sold' ? t('status.sold', language) : t('status.active', language)}
          </Badge>
        </div>
      </header>

      <main className="p-4 pb-24 space-y-4">
        {/* Summary Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {(car.purchasePrice || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('label.purchasePrice', language)}</span>
                <span className="font-medium">
                  {formatCurrency(car.purchasePrice || 0, currency)}
                </span>
              </div>
            )}
            {showYear && car.year && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('label.year', language)}</span>
                <span className="font-medium">{car.year}</span>
              </div>
            )}
            {showKm && car.km && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('label.km', language)}</span>
                <span className="font-medium">{car.km.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('label.expenses', language)}</span>
              <span className="font-medium">
                {formatCurrency(totalExpenses, currency)}
              </span>
            </div>
            {car.status === 'sold' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('label.salePrice', language)}</span>
                  <span className="font-medium">
                    {formatCurrency(car.salePrice || 0, currency)}
                  </span>
                </div>
                <div
                  className={`flex justify-between pt-2 border-t ${isProfitable ? 'text-primary' : 'text-destructive'
                    }`}
                >
                  <span className="font-medium">
                    {isProfitable ? t('label.profit', language) : t('label.loss', language)}
                  </span>
                  <span className="font-bold">
                    {isProfitable ? '+' : ''}
                    {formatCurrency(profit, currency)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Заметки */}
        {car.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('label.notes', language)}</p>
              <p className="text-sm whitespace-pre-wrap">{car.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Чек-лист */}
        {onUpdateChecklist && (
          <CarChecklist
            carId={car.id}
            checklist={car.checklist || []}
            onUpdateChecklist={onUpdateChecklist}
            language={language}
          />
        )}

        {/* Expenses and Profit Tabs */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${showDocuments ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="expenses">{t('label.expenses', language)} ({car.expenses.length})</TabsTrigger>
                {showDocuments && (
                  <TabsTrigger value="documents">{t('label.documents', language)} ({documents.filter(d => d.carId === car.id).length})</TabsTrigger>
                )}
                <TabsTrigger value="profit">{t('label.profit', language)}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t('label.filterByPartner', language)}</p>
                {car.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddExpense(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('button.add', language)}
                  </Button>
                )}
              </div>

              {/* Filter tabs */}
              <Tabs value={expenseFilter} onValueChange={setExpenseFilter}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">
                      {t('tab.all', language)}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              {filteredExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('message.noExpenses', language)}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.map((expense) => (
                    <ContextMenu key={expense.id}>
                      <ContextMenuTrigger>
                        <div
                          className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer active:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(expense.amount, currency)} • {formatDate(expense.date)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="font-medium">
                              {formatCurrency(expense.amount, currency, language)}
                            </span>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => handleEditExpense(expense)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          {t('button.edit', language)}
                        </ContextMenuItem>
                        <ContextMenuItem 
                          onClick={() => onDeleteExpense(expense.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('button.delete', language)}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                  <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                    <span className="font-medium text-primary">{t('label.total', language)}</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(
                        filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
                        currency
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          )}

          {/* Documents Tab */}
          {showDocuments && activeTab === 'documents' && (
            <CardContent className="pt-4">
              {onAddDocument && onDeleteDocument ? (
                <CarDocuments
                  car={car}
                  documents={documents}
                  onAddDocument={onAddDocument}
                  onDeleteDocument={onDeleteDocument}
                  language={language}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Функция документов недоступна</p>
                </div>
              )}
            </CardContent>
          )}

          {/* Profit Tab */}
          {activeTab === 'profit' && (
            <CardContent className="space-y-4 pt-4">
              {car.status === 'sold' ? (
                <>
                  <div className="space-y-3">
                    {(car.purchasePrice || 0) > 0 && (
                      <>
                        <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                          <span className="text-muted-foreground">{t('label.purchasePrice', language)}</span>
                          <span className="font-medium">
                            {formatCurrency(car.salePrice ? car.salePrice - totalInvested : 0, currency, language)}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                          <span className="text-muted-foreground">{t('label.expenses', language)}</span>
                          <span className="font-medium">
                            {formatCurrency(totalExpenses, currency, language)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-muted-foreground">{t('stats.invested', language)}</span>
                      <span className="font-medium">
                        {formatCurrency(totalInvested, currency, language)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="text-muted-foreground">{t('label.salePrice', language)}</span>
                      <span className="font-medium">
                            {formatCurrency(car.salePrice || 0, currency, language)}
                          </span>
                    </div>
                    <div
                      className={`flex justify-between p-3 rounded-lg font-bold text-base ${isProfitable
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'
                        }`}
                    >
                      <span>{isProfitable ? 'Прибыль' : 'Убыток'}</span>
                      <span>
                        {isProfitable ? '+' : ''}
                        {formatCurrency(profit, currency)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('message.carNotSold', language)}
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        {car.status === 'active' && (
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowSellSheet(true)}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {t('button.sellCar', language)}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="lg">
                  <Trash2 className="w-5 h-5 mr-2" />
                  {t('button.delete', language)}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dialog.deleteCar', language)}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dialog.deleteCarDesc', language)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel', language)}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('button.delete', language)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Sold car actions */}
        {car.status === 'sold' && (
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setSalePrice(car.salePrice?.toString() || '')
                setSaleDate(car.saleDate || new Date().toISOString().split('T')[0])
                setShowSellSheet(true)
              }}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {t('button.editSale', language)}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => onReturnToSale?.()}
            >
              {t('button.returnToSale', language)}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="lg">
                  <Trash2 className="w-5 h-5 mr-2" />
                  {t('button.delete', language)}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dialog.deleteCar', language)}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dialog.deleteCarDesc', language)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel', language)}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('button.delete', language)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </main>

      {/* Add Expense Sheet */}
      <AddExpenseForm
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAdd={onAddExpense}
        language={language}
      />

      {/* Sell Dialog */}
      <Dialog open={showSellSheet} onOpenChange={setShowSellSheet}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {car.status === 'sold' ? t('dialog.editSale', language) : t('dialog.sellCar', language)}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.sellCarDesc', language)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sale-price">{t('label.salePrice', language)}</Label>
              <Input
                id="sale-price"
                type="number"
                placeholder="15000"
                value={salePrice || (car.status === 'sold' ? car.salePrice?.toString() : '')}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-date">{t('label.saleDate', language)}</Label>
              <Input
                id="sale-date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            {(salePrice || (car.status === 'sold' && car.salePrice)) && (
              <div
                className={`p-4 rounded-lg ${(parseFloat(salePrice || car.salePrice?.toString() || '0')) > totalInvested
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
                  }`}
              >
                <p className="text-sm">
                  {(parseFloat(salePrice || car.salePrice?.toString() || '0')) > totalInvested ? t('label.profit', language) : t('label.loss', language)}:{' '}
                  <span className="font-bold">
                    {formatCurrency((parseFloat(salePrice || car.salePrice?.toString() || '0')) - totalInvested, currency)}
                  </span>
                </p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={car.status === 'sold' ? handleUpdateSoldCar : handleSell}
              disabled={!salePrice && car.status !== 'sold'}
            >
              {car.status === 'sold' ? t('button.saveChanges', language) : t('button.confirmSale', language)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditExpense} onOpenChange={setShowEditExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialog.editExpense', language)}</DialogTitle>
            <DialogDescription>
              {t('dialog.editExpenseDesc', language)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('label.description', language)}</Label>
              <Input
                id="edit-description"
                placeholder={t('placeholder.expenseDescription', language)}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">{t('label.amount', language)}</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="0"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">{t('label.category', language)}</Label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v as Expense['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parts">{t('category.parts', language)}</SelectItem>
                  <SelectItem value="repair">{t('category.repair', language)}</SelectItem>
                  <SelectItem value="documents">{t('category.documents', language)}</SelectItem>
                  <SelectItem value="other">{t('category.other', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">{t('label.date', language)}</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            {car.isPartnership && (
              <div className="space-y-2">
                <Label htmlFor="edit-paidBy">{t('label.whoPaid', language)}</Label>
                <Select value={editPaidBy} onValueChange={setEditPaidBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partners
                      .filter((p) => car.partnerShares?.[p.id])
                      .map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSaveExpense}
              disabled={!editDescription || !editAmount}
            >
              {t('button.save', language)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
