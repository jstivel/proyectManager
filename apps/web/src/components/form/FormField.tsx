import React from 'react'
import { Loader2 } from 'lucide-react'

interface FormFieldProps {
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'file'
  value: any
  onChange: (value: any) => void
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  disabled?: boolean
  error?: string
}

export default function FormField({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  options,
  disabled = false,
  error
}: FormFieldProps) {
  const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  const errorClasses = error ? "border-red-500" : "border-gray-300"
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : ""

  const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses}`

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
            rows={3}
          />
        )
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">Seleccionar...</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
            required={required}
            disabled={disabled}
            className={inputClasses}
            accept="image/*"
          />
        )
      
      default:
        return (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}