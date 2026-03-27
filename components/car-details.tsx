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
import type { Car, Expense, Document, UserInfo } from '@/lib/types'
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
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>
  onUpdateExpense: (expenseId: string, updates: Partial<Expense>) => void
  onDeleteExpense: (expenseId: string) => void
  onSell: (price: number, saleDate: string) => Promise<void>
  onUpdateSoldCar: (price: number, saleDate: string) => Promise<void>
  onReturnToSale: () => void
  onAddDocument: (document: Omit<Document, 'id' | 'uploadDate'>) => void
  onDeleteDocument: (documentId: string) => void
  onDelete: () => void
  onUpdateChecklist: (checklist: ChecklistItem[]) => void
  userInfo?: UserInfo
  onUpdateUserInfo?: (userInfo: UserInfo) => Promise<void>
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
  userInfo,
  onUpdateUserInfo,
}: CarDetailsProps) {
  // Helper function to get partner name by ID
  const getPartnerName = (partnerId: string): string => {
    if (partnerId === 'me') {
      return userInfo?.firstName || t('label.me', language)
    }
    if (car.partnerShares && car.partnerNames && car.partnerShares[partnerId]) {
      // Find partner from car data to get the name
      const partnerShare = car.partnerShares[partnerId]
      const partnerName = car.partnerNames[partnerId]
      return partnerShare > 0 ? (partnerName || t('label.partner', language)) : (userInfo?.firstName || t('label.me', language))
    }
    return t('label.partner', language)
  }

  // Helper function to get payer initial
  const getPayerInitial = (paidBy?: string): string => {
    if (!paidBy || paidBy === 'me') {
      return userInfo?.firstName?.charAt(0).toUpperCase() || 'М'
    }
    const partnerName = car.partnerNames?.[paidBy]
    return partnerName?.charAt(0).toUpperCase() || 'П'
  }

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSellSheet, setShowSellSheet] = useState(false)
  const [showEditExpense, setShowEditExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPaidBy, setEditPaidBy] = useState<string>('me')
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(car.saleDate || new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<string>('expenses')
  const [expenseFilter, setExpenseFilter] = useState<string>('all')

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setEditDescription(expense.description)
    setEditAmount(expense.amount.toString())
    setEditDate(expense.date)
    setEditPaidBy(expense.paidBy || 'me')
    setShowEditExpense(true)
  }

  const handleSaveExpense = () => {
    if (!editingExpense || !onUpdateExpense || !editDescription || !editAmount) return
    onUpdateExpense(editingExpense.id, {
      description: editDescription,
      amount: parseFloat(editAmount),
      category: 'other', // Default category
      date: editDate,
      paidBy: editPaidBy,
    })
    setShowEditExpense(false)
    setEditingExpense(null)
  }

  const handleSell = async () => {
    if (!salePrice) return
    await onSell(parseFloat(salePrice), saleDate)
    setSalePrice('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setShowSellSheet(false)
    // Переключаемся на вкладку "Прибыль" после продажи
    setActiveTab('profit')
  }

  const handleUpdateSoldCar = async () => {
    if (!salePrice || !onUpdateSoldCar) return
    await onUpdateSoldCar(parseFloat(salePrice), saleDate)
    setSalePrice(car.salePrice?.toString() || '')
    setShowSellSheet(false)
    // Переключаемся на вкладку "Прибыль" после обновления
    setActiveTab('profit')
  }

  const totalExpenses = car.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalInvested = (car.purchasePrice || 0) + totalExpenses
  const profit = car.salePrice ? car.salePrice - totalInvested : 0
  const isProfitable = profit > 0

  // Calculate partner investments
  const partnerInvestments: { [partnerId: string]: number } = {}
  
  // Add purchase price distribution
  if (car.isPartnership && car.partnerShares && car.purchasePrice) {
    Object.entries(car.partnerShares).forEach(([partnerId, share]) => {
      partnerInvestments[partnerId] = (car.purchasePrice || 0) * (share / 100)
    })
  } else if (!car.isPartnership && car.purchasePrice) {
    partnerInvestments['me'] = car.purchasePrice
  }
  
  // Add expenses
  car.expenses.forEach(expense => {
    const payerId = expense.paidBy || 'me'
    partnerInvestments[payerId] = (partnerInvestments[payerId] || 0) + expense.amount
  })

  // Calculate returns and profit sharing
  const partnerReturns: { [partnerId: string]: { investment: number, return: number, profitShare: number } } = {}
  const profitPerPartner = isProfitable ? profit / Object.keys(partnerInvestments).length : 0
  
  Object.entries(partnerInvestments).forEach(([partnerId, investment]) => {
    const totalReturn = investment + profitPerPartner
    partnerReturns[partnerId] = {
      investment,
      return: totalReturn,
      profitShare: profitPerPartner
    }
  })

  // Sort and filter expenses by date and payer
  const sortedExpenses = car.expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(expense => {
      // If no partners exist, show all expenses (they're all mine anyway)
      if (!car?.partnerNames || Object.keys(car.partnerNames).filter(id => id !== 'me').length === 0) {
        return true
      }
      
      // If partners exist, use filter logic
      if (expenseFilter === 'all') return true
      if (expenseFilter === 'me') return !expense.paidBy || expense.paidBy === 'me'
      if (expenseFilter === 'partner') return expense.paidBy && expense.paidBy !== 'me'
      return true
    })

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
                <p className="text-sm font-medium">{t('tab.expenses', language)}</p>
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

              {/* Filter tabs - only show if partners exist */}
              {car?.partnerNames && Object.keys(car.partnerNames).filter(id => id !== 'me').length > 0 && (
                <Tabs value={expenseFilter} onValueChange={setExpenseFilter}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">
                      ВСЕ
                    </TabsTrigger>
                    <TabsTrigger value="me" className="flex-1">
                      {userInfo?.firstName || 'МОЁ ИМЯ'}
                    </TabsTrigger>
                    <TabsTrigger value="partner" className="flex-1">
                      {car?.partnerNames ? Object.values(car.partnerNames).find(name => name !== userInfo?.firstName) || 'ПАРТНЕР' : 'ПАРТНЕР'}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

                            {sortedExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('message.noExpenses', language)}
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedExpenses.map((expense) => (
                    <ContextMenu key={expense.id}>
                      <ContextMenuTrigger>
                        <div 
                          className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer active:bg-secondary/50 transition-colors"
                          onTouchStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          onClick={() => {
                            // For mobile devices, show a simple edit/delete dialog
                            if (window.innerWidth < 768) {
                              const action = window.confirm(
                                `${t('message.editOrDelete', language)}\n\n${expense.description}\n${formatCurrency(expense.amount, currency, language)}\n\nOK = ${t('button.edit', language)}\nCancel = ${t('button.delete', language)}`
                              );
                              if (action) {
                                handleEditExpense(expense);
                              } else {
                                onDeleteExpense(expense.id);
                              }
                            }
                          }}
                          style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {/* Payer initial icon */}
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                              {getPayerInitial(expense.paidBy)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{expense.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(expense.date)}
                              </div>
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
                        sortedExpenses.reduce((sum, e) => sum + e.amount, 0),
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
              <CarDocuments
                car={car}
                documents={documents}
                onAddDocument={onAddDocument}
                onDeleteDocument={onDeleteDocument}
                language={language}
              />
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
                            {formatCurrency(car.purchasePrice || 0, currency, language)}
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

                    {/* Partner investment details */}
                    {car.isPartnership && Object.keys(partnerReturns).length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">Распределение вложений и прибыли:</div>
                        {Object.entries(partnerReturns).map(([partnerId, data]) => (
                          <div key={partnerId} className="bg-secondary/30 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                {partnerId === 'me' ? (userInfo?.firstName || 'МОЁ ИМЯ') : (car.partnerNames?.[partnerId] || 'ПАРТНЕР')}
                              </span>
                              <span className="font-bold">
                                {formatCurrency(data.return, currency)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex justify-between">
                                <span>Вложено:</span>
                                <span>{formatCurrency(data.investment, currency)}</span>
                              </div>
                              {isProfitable && (
                                <div className="flex justify-between">
                                  <span>Доля прибыли:</span>
                                  <span className="text-green-600">+{formatCurrency(data.profitShare, currency)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
        car={car}
        userInfo={userInfo}
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
              <Label htmlFor="edit-date">{t('label.date', language)}</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-paidBy">{t('label.whoPaid', language)}</Label>
              <Select value={editPaidBy} onValueChange={setEditPaidBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">{t('label.me', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditExpense(false)}>
                {t('button.cancel', language)}
              </Button>
              <Button
                className="w-full"
                onClick={handleSaveExpense}
                disabled={!editDescription || !editAmount}
              >
                {t('button.save', language)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
