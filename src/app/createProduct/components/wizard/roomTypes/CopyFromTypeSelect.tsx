'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RoomTypeFormData } from '../../../types/roomType'

interface CopyFromTypeSelectProps {
  /** Other room types that already have a name (eligible copy sources). */
  sources: RoomTypeFormData[]
  onCopy: (sourceId: string) => void
}

export function CopyFromTypeSelect({ sources, onCopy }: CopyFromTypeSelectProps) {
  const [selected, setSelected] = useState('')

  if (sources.length === 0) return null

  const handleCopy = () => {
    if (selected) onCopy(selected)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="copy-from">
        Copier depuis un autre type
      </label>
      <select
        id="copy-from"
        aria-label="Copier depuis un autre type"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Copier depuis…</option>
        {sources.map((source, index) => (
          <option key={source.id} value={source.id}>
            {source.name || `Type #${index + 1}`}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        disabled={!selected}
        className="gap-1 text-xs"
      >
        <Copy className="h-3 w-3" />
        Copier
      </Button>
    </div>
  )
}
