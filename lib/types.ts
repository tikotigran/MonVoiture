export interface Partner {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: 'parts' | 'repair' | 'documents' | 'other'
  date: string
  paidBy?: string // partner id, if partnership
}

export interface Document {
  id: string
  carId: string
  type: 'sts' | 'insurance' | 'pts' | 'service' | 'receipt' | 'other'
  name: string
  url: string
  uploadDate: string
  fileSize: number
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  category: 'parts' | 'work' | 'other'
  createdAt: string
}

export interface Car {
  id: string
  name: string
  licensePlate?: string // номерной знак в формате AB-123-CD
  year?: number // год выпуска
  km?: number // пробег в километрах
  purchasePrice: number
  purchaseDate: string
  expenses: Expense[]
  salePrice?: number
  saleDate?: string
  isPartnership: boolean
  partnerShares?: { [partnerId: string]: number } // percentage shares
  status: 'active' | 'sold'
  deleted?: boolean // soft delete flag
  createdAt?: string // timestamp when car was created
  lastModified?: string // timestamp of last modification
  documents?: Document[] // car documents
  notes?: string // текстовые заметки к машине
  checklist?: ChecklistItem[] // чек-лист запчастей и работ
}

export interface UserInfo {
  firstName: string
  lastName: string
  garageName: string
}

export interface AppSettings {
  currency: string
  language: 'ru' | 'fr' | 'hy' | 'en'
  theme: 'light' | 'dark' | 'system'
  appName: string
  features: {
    sorting: boolean
    purchaseDate: boolean
    licensePlate: boolean
    search: boolean
    documents: boolean
    km: boolean
    year: boolean
  }
  // Optional properties for backward compatibility
  reminders?: any
  notifications?: any
  userRole?: string
  userInfo?: UserInfo
}

export interface AppState {
  cars: Car[]
  documents: Document[]
  settings: AppSettings
}

