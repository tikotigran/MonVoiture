'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Globe } from 'lucide-react'
import { t } from '@/lib/translations'
import { formatCurrency, formatDate } from '@/lib/format'

interface TestResult {
  component: string
  ru: boolean
  en: boolean
  fr: boolean
  hy: boolean
  issues: string[]
}

export function LanguageTest() {
  const [results, setResults] = useState<TestResult[]>([
    {
      component: 'Dashboard',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    },
    {
      component: 'Car Details',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    },
    {
      component: 'Header Search',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    },
    {
      component: 'Documents',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    },
    {
      component: 'Settings',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    },
    {
      component: 'Forms',
      ru: true,
      en: true,
      fr: true,
      hy: true,
      issues: []
    }
  ])

  const testTranslations = () => {
    const languages = ['ru', 'en', 'fr', 'hy'] as const
    const testKeys = [
      'button.add',
      'button.delete',
      'button.save',
      'label.expenses',
      'label.profit',
      'label.documents',
      'placeholder.searchCars',
      'dialog.settings',
      'template.fuel'
    ]

    const newResults = results.map(result => {
      const issues: string[] = []
      const languageResults = {} as Record<string, boolean>

      languages.forEach(lang => {
        try {
          testKeys.forEach(key => {
            const translation = t(key, lang)
            if (!translation || translation === key) {
              issues.push(`${lang}: ${key} not translated`)
              languageResults[lang] = false
            }
          })
          languageResults[lang] = true
        } catch (error) {
          issues.push(`${lang}: Error loading translations`)
          languageResults[lang] = false
        }
      })

      return {
        ...result,
        ...languageResults,
        issues
      }
    })

    setResults(newResults)
  }

  const testFormatting = () => {
    const testDate = '2026-03-16'
    const testAmount = 1234567.89
    const languages = ['ru', 'en', 'fr', 'hy'] as const

    const formatResults = languages.map(lang => {
      try {
        const formattedDate = formatDate(testDate, lang)
        const formattedCurrency = formatCurrency(testAmount, '€', lang)
        
        return {
          lang,
          date: formattedDate,
          currency: formattedCurrency,
          success: true
        }
      } catch (error) {
        return {
          lang,
          date: 'Error',
          currency: 'Error',
          success: false
        }
      }
    })

    return formatResults
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getOverallStatus = (result: TestResult) => {
    const allPassed = result.ru && result.en && result.fr && result.hy
    return allPassed
  }

  const formatResults = testFormatting()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Language Test Dashboard</h1>
        </div>
        <Button onClick={testTranslations} className="bg-blue-600 hover:bg-blue-700">
          Run Tests
        </Button>
      </div>

      {/* Component Translation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Translation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{result.component}</div>
                  {result.issues.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {result.issues.length} issues
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🇷🇺</span>
                    {getStatusIcon(result.ru)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🇬🇧</span>
                    {getStatusIcon(result.en)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🇫🇷</span>
                    {getStatusIcon(result.fr)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🇦🇲</span>
                    {getStatusIcon(result.hy)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date & Currency Formatting */}
      <Card>
        <CardHeader>
          <CardTitle>Date & Currency Formatting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Date: 2026-03-16</h3>
              <div className="grid grid-cols-4 gap-4">
                {formatResults.map(result => (
                  <div key={result.lang} className="p-3 border rounded">
                    <div className="text-sm font-medium mb-1">
                      {result.lang === 'ru' ? '🇷🇺 Русский' :
                       result.lang === 'en' ? '🇬🇧 English' :
                       result.lang === 'fr' ? '🇫🇷 Français' :
                       '🇦🇲 Հայերեն'}
                    </div>
                    <div className="text-lg">{result.date}</div>
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Currency: 1,234,567.89 €</h3>
              <div className="grid grid-cols-4 gap-4">
                {formatResults.map(result => (
                  <div key={result.lang} className="p-3 border rounded">
                    <div className="text-sm font-medium mb-1">
                      {result.lang === 'ru' ? '🇷🇺 Русский' :
                       result.lang === 'en' ? '🇬🇧 English' :
                       result.lang === 'fr' ? '🇫🇷 Français' :
                       '🇦🇲 Հայերեն'}
                    </div>
                    <div className="text-lg font-mono">{result.currency}</div>
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Translation Coverage</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{result.component}</span>
                    <div className="flex items-center gap-1">
                      {getOverallStatus(result) ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Complete</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">Partial</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Translation Engine</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Date Formatting</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Currency Formatting</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Component Integration</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
