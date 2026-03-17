'use client'

import { useState } from 'react'
import { Check, Plus, Trash2, Wrench, Package, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ChecklistItem } from '@/lib/types'
import { t } from '@/lib/translations'
import { generateId } from '@/lib/format'

interface CarChecklistProps {
  carId: string
  checklist: ChecklistItem[]
  onUpdateChecklist: (checklist: ChecklistItem[]) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function CarChecklist({ carId, checklist = [], onUpdateChecklist, language = 'ru' }: CarChecklistProps) {
  const [newItemText, setNewItemText] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem['category']>('parts')

  const completedCount = checklist.filter(item => item.completed).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      completed: false,
      category: newItemCategory,
      createdAt: new Date().toISOString(),
    }

    onUpdateChecklist([...checklist, newItem])
    setNewItemText('')
  }

  const handleToggleItem = (itemId: string) => {
    const updated = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    onUpdateChecklist(updated)
  }

  const handleDeleteItem = (itemId: string) => {
    const updated = checklist.filter(item => item.id !== itemId)
    onUpdateChecklist(updated)
  }

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'parts':
        return <Package className="w-4 h-4" />
      case 'work':
        return <Wrench className="w-4 h-4" />
      default:
        return <MoreHorizontal className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'parts':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'work':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const itemsByCategory = {
    parts: checklist.filter(item => item.category === 'parts'),
    work: checklist.filter(item => item.category === 'work'),
    other: checklist.filter(item => item.category === 'other'),
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="w-5 h-5" />
            {t('label.checklist', language)}
          </CardTitle>
          {totalCount > 0 && (
            <Badge variant={progress === 100 ? 'default' : 'secondary'}>
              {completedCount}/{totalCount} ({progress}%)
            </Badge>
          )}
        </div>
        {totalCount > 0 && (
          <div className="w-full bg-secondary h-2 rounded-full mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress === 100 ? 'bg-primary' : 'bg-primary/60'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Подсказка с примерами */}
        <p className="text-xs text-muted-foreground">
          💡 {t('help.checklistExamples', language)}
        </p>

        {/* Добавление нового пункта */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={t('placeholder.checklistItem', language)}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1"
            />
            <Select
              value={newItemCategory}
              onValueChange={(v) => setNewItemCategory(v as ChecklistItem['category'])}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parts">{t('category.parts', language)}</SelectItem>
                <SelectItem value="work">{t('category.work', language)}</SelectItem>
                <SelectItem value="other">{t('category.other', language)}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Список по категориям */}
        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('message.noChecklistItems', language)}
          </p>
        ) : (
          <div className="space-y-4">
            {(['parts', 'work', 'other'] as const).map((category) => {
              const items = itemsByCategory[category]
              if (items.length === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="text-sm font-medium">
                      {t(`category.${category}`, language)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {items.filter(i => i.completed).length}/{items.length}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          item.completed
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-secondary/30 border-transparent'
                        }`}
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleToggleItem(item.id)}
                          id={`check-${item.id}`}
                        />
                        <label
                          htmlFor={`check-${item.id}`}
                          className={`flex-1 text-sm cursor-pointer ${
                            item.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.text}
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
