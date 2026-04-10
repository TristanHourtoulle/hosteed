'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

interface FilterBarProps {
  /** Current search value. */
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** Right-side slot for custom filters (selects, buttons, etc.). */
  rightSlot?: React.ReactNode
  /** Below-slot for secondary controls (active filter chips, bulk actions...). */
  belowSlot?: React.ReactNode
  className?: string
}

/**
 * Shared filter bar for admin list pages.
 *
 * Layout:
 *   [ 🔍 search input .................. ]  [ filters slot ]
 *   [ (optional) below slot: chips / bulk actions bar       ]
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher…',
  rightSlot,
  belowSlot,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='relative flex-1 md:max-w-md'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <input
            type='text'
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
          />
          {searchValue && (
            <button
              type='button'
              onClick={() => onSearchChange('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              aria-label='Effacer la recherche'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {rightSlot && <div className='flex flex-wrap items-center gap-2'>{rightSlot}</div>}
      </div>

      {belowSlot && <div className='mt-3 border-t border-slate-100 pt-3'>{belowSlot}</div>}
    </div>
  )
}
