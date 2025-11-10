'use client'

import { Input } from './shadcnui/input'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  id: string
  name: string
  value: string | undefined
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
  placeholder?: string
  min?: string
  allowDecimals?: boolean
}

export default function NumberInput({
  id,
  name,
  value,
  onChange,
  className,
  required,
  placeholder,
  min,
  allowDecimals = false,
}: NumberInputProps) {
  // Format number with spaces (1000 -> 1 000)
  const formatNumberWithSpaces = (value: string | undefined) => {
    if (!value) return ''
    const num = value.replace(/\s/g, '')
    if (!num) return ''

    // If it has decimals, handle integer and decimal parts separately
    if (allowDecimals && num.includes('.')) {
      const [intPart, decPart] = num.split('.')
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
    }

    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all spaces to get raw number
    const rawValue = e.target.value.replace(/\s/g, '')

    // Allow digits and optionally decimal point
    const pattern = allowDecimals ? /[^0-9.]/g : /[^0-9]/g
    let cleaned = rawValue.replace(pattern, '')

    // Ensure only one decimal point if decimals are allowed
    if (allowDecimals) {
      const parts = cleaned.split('.')
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('')
      }
    }

    // Create synthetic event with unformatted value for parent
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: cleaned,
      },
    } as React.ChangeEvent<HTMLInputElement>

    onChange(syntheticEvent)
  }

  const displayValue = formatNumberWithSpaces(value)

  return (
    <Input
      id={id}
      name={name}
      type='text'
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn(className)}
      required={required}
      inputMode='numeric'
    />
  )
}
