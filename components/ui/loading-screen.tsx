'use client'

import { Loader2, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  subMessage?: string
  className?: string
}

export function LoadingScreen({ message = "Загрузка...", subMessage, className }: LoadingScreenProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col items-center justify-center gap-6", className)}>
      {/* Логотип с анимацией */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-primary rounded-full p-6 shadow-lg">
          <Car className="w-12 h-12 text-primary-foreground animate-bounce" />
        </div>
      </div>

      {/* Спиннер под логотипом */}
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {message}
        </p>
        {subMessage && (
          <p className="text-xs text-muted-foreground/70 animate-pulse">
            {subMessage}
          </p>
        )}
      </div>

      {/* Декоративные элементы */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-primary/30 rounded-full animate-ping" />
      <div className="absolute top-20 right-20 w-3 h-3 bg-primary/20 rounded-full animate-ping animation-delay-1000" />
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-ping animation-delay-2000" />
      <div className="absolute bottom-10 right-10 w-3 h-3 bg-primary/20 rounded-full animate-ping animation-delay-1500" />

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
