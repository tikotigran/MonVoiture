'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Wrench, Shield, FileText, MoreHorizontal } from 'lucide-react'
import { t } from '@/lib/translations'

interface ExpenseTemplate {
  id: string
  name: string
  category: 'parts' | 'repair' | 'documents' | 'other'
  description: string
  typicalAmount?: number
  icon: React.ReactNode
}

interface ExpenseTemplatesProps {
  onSelectTemplate: (template: ExpenseTemplate) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

export function ExpenseTemplates({ onSelectTemplate, language = 'ru' }: ExpenseTemplatesProps) {
  const [showAll, setShowAll] = useState(false)

  // Только самые полезные шаблоны
  const templates: ExpenseTemplate[] = [
    {
      id: 'fuel',
      name: t('template.fuel', language),
      category: 'other',
      description: t('template.fuelDesc', language),
      typicalAmount: 50,
      icon: <Zap className="w-4 h-4" />
    },
    {
      id: 'oil-change',
      name: t('template.oilChange', language),
      category: 'repair',
      description: t('template.oilChangeDesc', language),
      typicalAmount: 80,
      icon: <Wrench className="w-4 h-4" />
    },
    {
      id: 'insurance',
      name: t('template.insurance', language),
      category: 'documents',
      description: t('template.insuranceDesc', language),
      typicalAmount: 500,
      icon: <Shield className="w-4 h-4" />
    },
    {
      id: 'registration',
      name: t('template.registration', language),
      category: 'documents',
      description: t('template.registrationDesc', language),
      typicalAmount: 200,
      icon: <FileText className="w-4 h-4" />
    }
  ]

  const getCategoryColor = (category: ExpenseTemplate['category']) => {
    const colors = {
      parts: 'bg-blue-100 text-blue-800',
      repair: 'bg-orange-100 text-orange-800',
      documents: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category]
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('template.quickTemplates', language)}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t('button.showLess', language) : t('button.showAll', language)}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {t(`category.${template.category}`, language)}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  {template.typicalAmount && (
                    <div className="text-sm text-muted-foreground">
                      <div className="text-xs">{t('template.typicalAmount', language)}:</div>
                      <div className="font-medium">~{template.typicalAmount} €</div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                {template.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
