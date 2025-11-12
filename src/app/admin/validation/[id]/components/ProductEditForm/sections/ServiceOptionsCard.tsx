import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ServiceOptionsCardProps {
  title: string
  icon: React.ReactNode
  items: Array<{
    id: string
    name: string
    description?: string | null
    userId?: string | null
    priceEUR?: number
    priceMGA?: number
  }>
  selectedIds: string[]
  onToggle: (id: string) => void
  onAddNew: () => void
  colorScheme: 'emerald' | 'orange' | 'red' | 'blue' | 'indigo' | 'purple'
  showPrices?: boolean
}

export default function ServiceOptionsCard({
  title,
  icon,
  items,
  selectedIds,
  onToggle,
  onAddNew,
  colorScheme,
  showPrices = false,
}: ServiceOptionsCardProps) {
  return (
    <div className='border-2 border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='font-medium text-slate-700 flex items-center gap-2'>
          {icon}
          {title}
        </h4>
        <Button type='button' size='sm' variant='outline' onClick={onAddNew} className='text-xs'>
          <Plus className='h-3 w-3 mr-1' />
          Ajouter
        </Button>
      </div>
      <div className='flex-1 space-y-2 content-start'>
        {items.map(item => (
          <div key={item.id}>
            <label
              className={`relative flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                selectedIds.includes(item.id)
                  ? `border-${colorScheme}-500 bg-${colorScheme}-50`
                  : 'border-slate-200 bg-white hover:border-' + colorScheme + '-300'
              }`}
            >
              <input
                type='checkbox'
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className='sr-only'
              />
              <div className='flex items-center space-x-2 w-full'>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedIds.includes(item.id)
                      ? `border-${colorScheme}-500 bg-${colorScheme}-500`
                      : 'border-slate-300'
                  }`}
                >
                  {selectedIds.includes(item.id) && (
                    <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-1 mb-1'>
                    <span className='text-xs font-medium text-slate-700 block truncate'>
                      {item.name}
                    </span>
                    {item.userId && (
                      <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium'>
                        Personnel
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <span className='text-xs text-slate-500 block truncate'>{item.description}</span>
                  )}
                  {showPrices && item.priceEUR !== undefined && (
                    <div className='flex gap-2 mt-1'>
                      <span className='text-xs font-semibold text-green-600'>{item.priceEUR}€</span>
                      {item.priceMGA !== undefined && item.priceMGA > 0 && (
                        <span className='text-xs text-slate-500'>{item.priceMGA.toLocaleString()} Ar</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
