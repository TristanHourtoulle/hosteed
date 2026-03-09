'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Search } from 'lucide-react'
import { DynamicIcon, EQUIPMENT_ICONS, type IconName } from '@/lib/utils/iconMapping'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label = 'Icône' }: IconPickerProps) {
  const [search, setSearch] = useState('')

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return EQUIPMENT_ICONS
    const term = search.toLowerCase()
    return EQUIPMENT_ICONS.filter((name) => name.toLowerCase().includes(term))
  }, [search])

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
        <Input
          placeholder='Rechercher une icône...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-10'
        />
      </div>
      <div className='grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto rounded-md border p-2'>
        {filteredIcons.map((iconName) => (
          <button
            key={iconName}
            type='button'
            onClick={() => onChange(iconName)}
            title={iconName}
            className={cn(
              'flex items-center justify-center rounded-md p-2 transition-colors hover:bg-green-50',
              value === iconName
                ? 'bg-green-100 ring-2 ring-green-500'
                : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <DynamicIcon name={iconName} className='h-5 w-5 text-slate-700' />
          </button>
        ))}
        {filteredIcons.length === 0 && (
          <p className='col-span-6 text-center text-sm text-slate-400 py-4'>
            Aucune icône trouvée
          </p>
        )}
      </div>
      {value && (
        <div className='flex items-center gap-2 text-sm text-slate-500'>
          <DynamicIcon name={value} className='h-4 w-4' />
          <span>{value}</span>
        </div>
      )}
    </div>
  )
}
