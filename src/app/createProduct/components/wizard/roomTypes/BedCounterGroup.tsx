'use client'

import { Minus, Plus } from 'lucide-react'
import { BED_TYPE_OPTIONS, type BedType, type RoomTypeBedFormData } from '../../../types/roomType'

interface BedCounterGroupProps {
  beds: RoomTypeBedFormData[]
  onChange: (beds: RoomTypeBedFormData[]) => void
}

export function BedCounterGroup({ beds, onChange }: BedCounterGroupProps) {
  const setCount = (bedType: BedType, next: number) =>
    onChange(beds.map(b => (b.bedType === bedType ? { ...b, count: Math.max(0, next) } : b)))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {BED_TYPE_OPTIONS.map(opt => {
        const current = beds.find(b => b.bedType === opt.value)?.count ?? 0
        return (
          <div
            key={opt.value}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2"
          >
            <span className="text-sm text-slate-700">{opt.label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Diminuer ${opt.label}`}
                onClick={() => setCount(opt.value, current - 1)}
                disabled={current === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                aria-label={`Nombre ${opt.label}`}
                className="w-6 text-center text-sm font-medium text-slate-800"
              >
                {current}
              </span>
              <button
                type="button"
                aria-label={`Augmenter ${opt.label}`}
                onClick={() => setCount(opt.value, current + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
