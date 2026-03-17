'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, RotateCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Document, Car } from '@/lib/types'

interface CameraCaptureProps {
  open: boolean
  onClose: () => void
  car: Car
  onCapture: (document: Omit<Document, 'id' | 'uploadDate'>) => void
  language?: 'ru' | 'fr' | 'hy' | 'en'
}

const documentTypeLabels = {
  ru: {
    sts: 'СТС',
    insurance: 'Страховка', 
    pts: 'ПТС',
    service: 'Сервисная книжка',
    receipt: 'Чек',
    other: 'Другое'
  },
  en: {
    sts: 'STS',
    insurance: 'Insurance',
    pts: 'PTS', 
    service: 'Service Book',
    receipt: 'Receipt',
    other: 'Other'
  },
  fr: {
    sts: 'STS',
    insurance: 'Assurance',
    pts: 'PTS',
    service: 'Carnet de Service',
    receipt: 'Reçu', 
    other: 'Autre'
  },
  hy: {
    sts: 'STS',
    insurance: 'Ապահովագիր',
    pts: 'PTS',
    service: 'Սպասարկման գիրք',
    receipt: 'Չեք',
    other: 'Այլ'
  }
}

export function CameraCapture({ open, onClose, car, onCapture, language = 'ru' }: CameraCaptureProps) {
  const [selectedType, setSelectedType] = useState<Document['type']>('sts')
  const [customName, setCustomName] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError('Не удалось получить доступ к камере')
      console.error('Camera error:', err)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsCameraActive(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true)
      setCompressionInfo('Обработка фото...')
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        let quality = 0.8
        let imageDataUrl = canvas.toDataURL('image/jpeg', quality)
        let fileSize = Math.round(imageDataUrl.length * 0.75)
        const maxSize = 4000000 // 4MB - increased for iPhone
        
        console.log('[Camera] Initial file size:', Math.round(fileSize/1024), 'KB')
        setCompressionInfo(`Начальный размер: ${Math.round(fileSize/1024)}KB`)
        
        // Step 1: Reduce quality more aggressively
        while (fileSize > maxSize && quality > 0.05) {
          quality -= 0.05
          imageDataUrl = canvas.toDataURL('image/jpeg', quality)
          fileSize = Math.round(imageDataUrl.length * 0.75)
          console.log('[Camera] Trying quality', quality, 'Size:', Math.round(fileSize/1024), 'KB')
          setCompressionInfo(`Сжатие... качество: ${Math.round(quality * 100)}% - ${Math.round(fileSize/1024)}KB`)
        }
        
        // Step 2: If still too large, reduce canvas size more aggressively
        if (fileSize > maxSize) {
          console.log('[Camera] Reducing canvas size...')
          setCompressionInfo('Уменьшение разрешения...')
          let scale = 0.9
          
          while (fileSize > maxSize && scale > 0.1) {
            const scaledWidth = Math.round(video.videoWidth * scale)
            const scaledHeight = Math.round(video.videoHeight * scale)
            
            canvas.width = scaledWidth
            canvas.height = scaledHeight
            context.drawImage(video, 0, 0, scaledWidth, scaledHeight)
            
            imageDataUrl = canvas.toDataURL('image/jpeg', 0.4) // Lower quality for smaller canvas
            fileSize = Math.round(imageDataUrl.length * 0.75)
            
            console.log('[Camera] Scale', scale, 'Size:', Math.round(fileSize/1024), 'KB')
            setCompressionInfo(`Масштаб: ${Math.round(scale * 100)}% - ${Math.round(fileSize/1024)}KB`)
            scale -= 0.1
          }
        }
        
        // Step 3: Final attempt with very low quality
        if (fileSize > maxSize) {
          console.log('[Camera] Final attempt with very low quality...')
          setCompressionInfo('Финальное сжатие...')
          
          // Try very small canvas with very low quality
          const finalScale = 0.3
          canvas.width = Math.round(video.videoWidth * finalScale)
          canvas.height = Math.round(video.videoHeight * finalScale)
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          imageDataUrl = canvas.toDataURL('image/jpeg', 0.1) // Very low quality
          fileSize = Math.round(imageDataUrl.length * 0.75)
          
          console.log('[Camera] Final size:', Math.round(fileSize/1024), 'KB')
          setCompressionInfo(`Финальный размер: ${Math.round(fileSize/1024)}KB`)
        }
        
        // Final check
        if (fileSize > maxSize) {
          setError(`Не удалось сжать фото. Минимальный размер: ${Math.round(fileSize/1024)}KB. Попробуйте сделать фото с меньшим разрешением или меньше деталей.`)
          setIsProcessing(false)
          setCompressionInfo(null)
          return
        }
        
        console.log('[Camera] Final file size:', Math.round(fileSize/1024), 'KB')
        setCompressionInfo(`Готово! ${Math.round(fileSize/1024)}KB`)
        
        setTimeout(() => {
          setCapturedImage(imageDataUrl)
          setIsProcessing(false)
          setCompressionInfo(null)
          stopCamera()
        }, 1000)
      }
    }
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const toggleCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    setTimeout(() => {
      startCamera()
    }, 100)
  }, [stopCamera, startCamera])

  const handleSave = useCallback(() => {
    if (capturedImage) {
      const fileSize = Math.round(capturedImage.length * 0.75)
      const document: Omit<Document, 'id' | 'uploadDate'> = {
        carId: car.id,
        type: selectedType,
        name: customName || `${documentTypeLabels[language][selectedType]} - ${car.name}`,
        url: capturedImage,
        fileSize: fileSize
      }
      
      onCapture(document)
      handleClose()
    }
  }, [capturedImage, car.id, selectedType, customName, car.name, language, onCapture])

  const handleClose = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setCustomName('')
    setSelectedType('sts')
    setFacingMode('environment')
    setError(null)
    onClose()
  }, [stopCamera, onClose])

  // Автоматически запускаем камеру при открытии
  useState(() => {
    if (open && !capturedImage && !isCameraActive) {
      setTimeout(() => {
        startCamera()
      }, 500)
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📸 Сделать фото документа</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Настройки документа */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Тип документа</Label>
              <Select value={selectedType} onValueChange={(value: Document['type']) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels[language]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-name">Название (опционально)</Label>
              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={documentTypeLabels[language][selectedType]}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              />
            </div>
          </div>

          {/* Камера или захваченное фото */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
                <div>
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                  <Button onClick={startCamera} className="mt-4">
                    Попробовать снова
                  </Button>
                </div>
              </div>
            )}
            
            {!error && !capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ minHeight: '300px' }}
              />
            )}
            
            {!error && capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
                style={{ minHeight: '300px' }}
              />
            )}
            
            {/* Кнопки управления камерой */}
            {!error && !capturedImage && isCameraActive && (
              <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
                {/* Индикатор сжатия */}
                {isProcessing && compressionInfo && (
                  <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    {compressionInfo}
                  </div>
                )}
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleCamera}
                    disabled={isProcessing}
                    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    disabled={isProcessing}
                    className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Кнопки для захваченного фото */}
            {!error && capturedImage && (
              <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
                {/* Информация о размере файла */}
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                  Размер файла: {Math.round(capturedImage.length * 0.75 / 1024)}KB
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="secondary"
                    onClick={retakePhoto}
                    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                  >
                    Переснять
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Canvas для захвата фото */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
