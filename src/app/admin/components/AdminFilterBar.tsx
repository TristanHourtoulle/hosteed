'use client'

import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface AdminFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: {
    [key: string]: {
      label: string
      value: string
      options: FilterOption[]
      onChange: (value: string) => void
    }
  }
  quickFilters?: {
    label: string
    value: string
    count?: number
    active: boolean
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  }[]
  onClearAll?: () => void
  resultCount?: number
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  filters = {},
  quickFilters = [],
  onClearAll,
  resultCount,
}: AdminFilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const hasActiveFilters =
    quickFilters.some(filter => filter.active) ||
    Object.values(filters).some(filter => filter.value !== 'all')

  return (
    <Card className='border-0 shadow-sm bg-white/70 backdrop-blur-sm'>
      <CardContent className='p-4 space-y-4'>
        {/* Search and basic controls */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
            <Input
              placeholder='Rechercher...'
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className='pl-10 bg-white border-slate-200 focus:border-blue-500'
            />
          </div>

          <div className='flex gap-2'>
            {Object.keys(filters).length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className='gap-2'
              >
                <SlidersHorizontal className='h-4 w-4' />
                Filtres
                {showAdvancedFilters && <span className='text-xs'>(ouverts)</span>}
              </Button>
            )}

            {hasActiveFilters && onClearAll && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearAll}
                className='gap-2 text-slate-600 hover:text-slate-800'
              >
                <X className='h-4 w-4' />
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Quick filters */}
        {quickFilters.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-slate-600'>
              <Filter className='h-4 w-4' />
              <span>Filtres rapides</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {quickFilters.map((filter, index) => (
                <motion.div
                  key={filter.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant={filter.active ? filter.variant || 'default' : 'outline'}
                    className={`cursor-pointer hover:scale-105 transition-transform ${
                      filter.active ? 'ring-2 ring-blue-200' : ''
                    }`}
                    onClick={filter.onClick}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <span className='ml-1 opacity-70'>({filter.count})</span>
                    )}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced filters */}
        <AnimatePresence>
          {showAdvancedFilters && Object.keys(filters).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className='space-y-3 pt-3 border-t border-slate-200'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Object.entries(filters).map(([key, filter]) => (
                  <div key={key} className='space-y-1'>
                    <label className='text-sm font-medium text-slate-700'>{filter.label}</label>
                    <Select value={filter.value} onValueChange={filter.onChange}>
                      <SelectTrigger className='bg-white'>
                        <SelectValue placeholder={`Choisir ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>Tous</SelectItem>
                        {filter.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className='flex items-center justify-between w-full'>
                              <span>{option.label}</span>
                              {option.count !== undefined && (
                                <span className='text-xs text-slate-500 ml-2'>
                                  ({option.count})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {resultCount !== undefined && (
          <div className='flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-slate-100'>
            <span>
              {resultCount === 0
                ? 'Aucun résultat trouvé'
                : `${resultCount} résultat${resultCount > 1 ? 's' : ''} trouvé${resultCount > 1 ? 's' : ''}`}
            </span>
            {hasActiveFilters && (
              <span className='text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full'>
                Filtres actifs
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
