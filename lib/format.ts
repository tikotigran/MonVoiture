export function formatCurrency(amount: number, currency: string = '$', language: 'ru' | 'fr' | 'hy' | 'en' = 'ru'): string {
  const locales = {
    ru: 'ru-RU',
    en: 'en-US', 
    fr: 'fr-FR',
    hy: 'hy-AM'
  }
  
  return `${amount.toLocaleString(locales[language])} ${currency}`
}

export function formatDate(dateString: string, language: 'ru' | 'fr' | 'hy' | 'en' = 'ru'): string {
  const date = new Date(dateString)
  
  const locales = {
    ru: 'ru-RU',
    en: 'en-US', 
    fr: 'fr-FR',
    hy: 'hy-AM'
  }
  
  return date.toLocaleDateString(locales[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
