'use client'

import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

  const completedCount = checklist.filter(item => item.completed).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      completed: false,
      category: 'other', // Default category
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
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Простой список элементов */}
        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('message.noChecklistItems', language)}
          </p>
        ) : (
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  item.completed
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-secondary/30 border-transparent'
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
                <span className={`flex-1 text-sm ${
                  item.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
