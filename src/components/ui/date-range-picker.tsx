'use client'

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/shadcnui/button'
import { Calendar } from '@/components/ui/shadcnui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcnui/popover'

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  placeholder = 'Sélectionner une période',
  className,
}: DatePickerWithRangeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            'justify-start text-left font-normal hover:bg-transparent',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'dd MMM', { locale: fr })} -{' '}
                {format(value.to, 'dd MMM', { locale: fr })}
              </>
            ) : (
              format(value.from, 'dd MMM yyyy', { locale: fr })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          initialFocus
          mode='range'
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          locale={fr}
          disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  )
}
