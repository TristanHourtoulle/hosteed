'use client'

import { Input } from './shadcnui/input'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
}

export default function TimeInput({
  id,
  name,
  value,
  onChange,
  className,
  required,
}: TimeInputProps) {
  return (
    <Input
      id={id}
      name={name}
      type='time'
      value={value}
      onChange={onChange}
      className={cn(className)}
      required={required}
    />
  )
}
