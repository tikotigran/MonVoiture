'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean | string
}

interface ValidationMessage {
  type: 'error' | 'success' | 'warning'
  message: string
}

interface FormFieldProps {
  name: string
  value: string
  rules?: ValidationRule
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'number' | 'tel'
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
}

interface ValidationResult {
  isValid: boolean
  messages: ValidationMessage[]
}

export function validateField(value: string, rules?: ValidationRule): ValidationResult {
  const messages: ValidationMessage[] = []

  if (!rules) return { isValid: true, messages: [] }

  // Required validation
  if (rules.required && !value.trim()) {
    messages.push({
      type: 'error',
      message: 'Это поле обязательно для заполнения'
    })
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    messages.push({
      type: 'error',
      message: `Минимальная длина: ${rules.minLength} символов`
    })
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    messages.push({
      type: 'error',
      message: `Максимальная длина: ${rules.maxLength} символов`
    })
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    messages.push({
      type: 'error',
      message: 'Неверный формат'
    })
  }

  // Custom validation
  if (rules.custom) {
    const result = rules.custom(value)
    if (typeof result === 'string') {
      messages.push({
        type: 'error',
        message: result
      })
    } else if (!result) {
      messages.push({
        type: 'error',
        message: 'Значение неверно'
      })
    }
  }

  // Success state
  if (value.trim() && messages.length === 0) {
    messages.push({
      type: 'success',
      message: 'Поле заполнено корректно'
    })
  }

  return {
    isValid: messages.filter(m => m.type === 'error').length === 0,
    messages
  }
}

export function FormField({
  name,
  value,
  rules,
  label,
  placeholder,
  type = 'text',
  onChange,
  onBlur,
  disabled,
  className = ''
}: FormFieldProps) {
  const [isTouched, setIsTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const validation = validateField(value, rules)
  const shouldShowValidation = isTouched && !isFocused

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleBlur = () => {
    setIsTouched(true)
    setIsFocused(false)
    onBlur?.()
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const getBorderColor = () => {
    if (!shouldShowValidation) return 'border-gray-200'
    
    const hasError = validation.messages.some(m => m.type === 'error')
    const hasSuccess = validation.messages.some(m => m.type === 'success')
    
    if (hasError) return 'border-red-300 focus:border-red-500'
    if (hasSuccess) return 'border-green-300 focus:border-green-500'
    return 'border-gray-200'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {rules?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getBorderColor()}`}
        />
        
        {shouldShowValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.messages.some(m => m.type === 'error') && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            {validation.messages.some(m => m.type === 'success') && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {shouldShowValidation && validation.messages.length > 0 && (
        <div className="space-y-1">
          {validation.messages.map((message, index) => (
            <div
              key={index}
              className={`text-xs flex items-center gap-1 ${
                message.type === 'error' ? 'text-red-600' :
                message.type === 'success' ? 'text-green-600' :
                'text-yellow-600'
              }`}
            >
              {message.type === 'error' && <AlertCircle className="w-3 h-3" />}
              {message.type === 'success' && <CheckCircle className="w-3 h-3" />}
              {message.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Common validation rules
export const validationRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    required: true,
    pattern: /^[\+]?[0-9\s\-\(\)]+$/
  },
  licensePlate: {
    required: true,
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z0-9\s\-]+$/
  },
  price: {
    required: true,
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string) => {
      const num = parseFloat(value)
      return num > 0 || 'Цена должна быть больше 0'
    }
  },
  carName: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  partnerName: {
    required: true,
    minLength: 2,
    maxLength: 30
  }
}
