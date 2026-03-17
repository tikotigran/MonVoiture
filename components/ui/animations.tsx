'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'
import './animations.css'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastsProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function Toasts({ toasts, onRemove }: ToastsProps) {
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration) {
        const timer = setTimeout(() => {
          onRemove(toast.id)
        }, toast.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [toasts, onRemove])

  const getIcon = (type: Toast['type']) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-500" />,
      error: <XCircle className="w-5 h-5 text-red-500" />,
      warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      info: <Info className="w-5 h-5 text-blue-500" />
    }
    return icons[type]
  }

  const getBgColor = (type: Toast['type']) => {
    const colors = {
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200'
    }
    return colors[type]
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm transition-all duration-300 ease-in-out ${getBgColor(toast.type)}`}
        >
          {getIcon(toast.type)}
          <div className="flex-1">
            <h4 className="font-medium text-sm">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

// Animation components for common UI elements
export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
}

export function SlideIn({ children, direction = 'left' }: { 
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down' 
}) {
  const getAnimationClass = () => {
    const animations = {
      left: 'animate-slide-in-left',
      right: 'animate-slide-in-right',
      up: 'animate-slide-in-up',
      down: 'animate-slide-in-down'
    }
    return animations[direction]
  }

  return (
    <div className={`${getAnimationClass()} animate-duration-300`}>
      {children}
    </div>
  )
}

export function ScaleIn({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-scale-in animate-duration-200">
      {children}
    </div>
  )
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => {
    return addToast({ type: 'success', title, message, duration: 3000 })
  }

  const error = (title: string, message?: string) => {
    return addToast({ type: 'error', title, message, duration: 5000 })
  }

  const warning = (title: string, message?: string) => {
    return addToast({ type: 'warning', title, message, duration: 4000 })
  }

  const info = (title: string, message?: string) => {
    return addToast({ type: 'info', title, message, duration: 3000 })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
