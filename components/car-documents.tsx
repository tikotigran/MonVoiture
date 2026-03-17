'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Eye, Download, Plus, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CameraCapture } from '@/components/camera-capture'
import type { Document, Car } from '@/lib/types'
import { formatDate, formatFileSize } from '@/lib/format'
import { t } from '@/lib/translations'

interface CarDocumentsProps {
  car: Car
  documents: Document[]
  onAddDocument: (document: Omit<Document, 'id' | 'uploadDate'>) => void
  onDeleteDocument: (documentId: string) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

const documentTypes = [
  { value: 'sts', labelKey: 'document.sts' },
  { value: 'insurance', labelKey: 'document.insurance' },
  { value: 'pts', labelKey: 'document.pts' },
  { value: 'service', labelKey: 'document.service' },
  { value: 'receipt', labelKey: 'document.receipt' },
  { value: 'other', labelKey: 'document.other' }
]

export function CarDocuments({ car, documents, onAddDocument, onDeleteDocument, language = 'ru' as const }: CarDocumentsProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<Document['type']>('sts')
  const [customName, setCustomName] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('[CarDocuments] Starting file upload:', file.name, file.type, file.size)
    
    // Check file size (max 4MB for iPhone)
    const maxSize = 4000000 // 4MB
    if (file.size > maxSize) {
      alert(`Файл слишком большой (${Math.round(file.size/1024)}KB). Максимальный размер: ${Math.round(maxSize/1024)}KB`)
      return
    }
    
    setUploading(true)
    try {
      // Convert file to Base64 for Firestore storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        console.log('[CarDocuments] File converted to Base64, length:', base64Data.length)
        
        const document: Omit<Document, 'id' | 'uploadDate'> = {
          carId: car.id,
          type: selectedType,
          name: customName || file.name,
          url: base64Data, // Store Base64 data in URL field
          fileSize: file.size
        }

        console.log('[CarDocuments] Document object created:', document)
        onAddDocument(document)
        console.log('[CarDocuments] onAddDocument called')
        
        setCustomName('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[CarDocuments] Error uploading file:', error)
    } finally {
      setUploading(false)
    }
  }

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'sts':
        return '📋'
      case 'insurance':
        return '🛡️'
      case 'pts':
        return '📄'
      case 'service':
        return '🔧'
      case 'receipt':
        return '🧾'
      case 'other':
        return '📎'
      default:
        return '📎'
    }
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.pdf$/i)) return '📕'
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️'
    if (fileName.match(/\.(doc|docx)$/i)) return '📘'
    if (fileName.match(/\.(xls|xlsx)$/i)) return '📗'
    if (fileName.match(/\.(ppt|pptx)$/i)) return '📙'
    return '📎'
  }

  const isBase64 = (url: string) => {
    return url.startsWith('data:')
  }

  const getBase64Type = (base64: string) => {
    const match = base64.match(/^data:(.+?);base64,/)
    return match ? match[1] : ''
  }

  const getDocumentTypeLabel = (type: Document['type']) => {
    return documentTypes.find(dt => dt.value === type)?.label || 'Другое'
  }

  const carDocuments = documents.filter(doc => doc.carId === car.id)
  
  console.log('[CarDocuments] Filtered documents for car', car.id, ':', carDocuments)
  console.log('[CarDocuments] All documents:', documents)

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Загрузка нового документа */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">{t('label.documentType', language)}</Label>
                <Select value={selectedType} onValueChange={(value: Document['type']) => setSelectedType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholder.selectType', language)} />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {getDocumentIcon(type.value as Document['type'])} {t(type.labelKey, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document-name">{t('label.documentName', language)}</Label>
                <Input
                  id="document-name"
                  placeholder={t('placeholder.documentName', language)}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                style={{ display: 'none' }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? t('status.uploading', language) : t('button.uploadDocument', language)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список документов */}
      {carDocuments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('title.documents', language)} ({carDocuments.length})</h3>
          
          <div className="grid gap-3">
            {carDocuments.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-sm w-full overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-2xl shrink-0">
                        {getFileIcon(doc.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getDocumentTypeLabel(doc.type)} • {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Просмотр документа - работает для всех типов */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 flex flex-col">
                          <DialogHeader className="p-4 pb-0 shrink-0">
                            <DialogTitle>{doc.name}</DialogTitle>
                          </DialogHeader>
                          
                          {/* Информация о документе */}
                          <div className="px-4 py-2 shrink-0">
                            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">
                                {getDocumentTypeLabel(doc.type)} • {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Область просмотра документа */}
                          <div className="p-4 pt-0 flex-1 grid" style={{ minHeight: '0' }}>
                            <div className="bg-muted/30 rounded-lg overflow-hidden grid" style={{ gridTemplateRows: '1fr' }}>
                              {isBase64(doc.url) && getBase64Type(doc.url).startsWith('image/') ? (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                  <img 
                                    src={doc.url} 
                                    alt={doc.name}
                                    className="max-w-full max-h-full object-contain"
                                    draggable={false}
                                  />
                                </div>
                              ) : isBase64(doc.url) && getBase64Type(doc.url) === 'application/pdf' ? (
                                <div className="w-full h-full flex flex-col">
                                  <div className="flex-1 relative min-h-[400px]">
                                    <iframe
                                      src={doc.url}
                                      className="absolute inset-0 w-full h-full border-0"
                                      title={doc.name}
                                    />
                                  </div>
                                  <div className="p-4 text-center">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={doc.url} download={doc.name}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Скачать
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 h-full flex flex-col items-center justify-center">
                                  <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Предпросмотр недоступен для этого типа файла
                                  </p>
                                  <Button variant="outline" className="mt-4" asChild>
                                    <a href={doc.url} download={doc.name}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Скачать файл
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.url} download={doc.name}>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onDeleteDocument(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {carDocuments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('message.noDocuments', language)}</p>
          <p className="text-sm">{t('message.uploadDocuments', language)}</p>
        </div>
      )}

      {/* Компонент камеры */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        car={car}
        onCapture={onAddDocument}
        language={language}
      />
    </div>
  )
}
