import { Euro } from 'lucide-react'

interface ProductExtra {
  id: string
  name: string
  description?: string
  priceEUR: number
  priceMGA: number
}

interface PropertyExtrasProps {
  extras: ProductExtra[]
}

export default function PropertyExtras({ extras }: PropertyExtrasProps) {
  if (!extras || extras.length === 0) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Services supplémentaires</h3>
      <div className='space-y-4'>
        {extras.map((extra) => (
          <div key={extra.id} className='flex items-start justify-between p-4 bg-gray-50 rounded-lg'>
            <div className='flex-1'>
              <h4 className='text-gray-900 font-medium'>{extra.name}</h4>
              {extra.description && (
                <p className='text-sm text-gray-600 mt-1'>{extra.description}</p>
              )}
            </div>
            <div className='flex items-center gap-1 text-sm font-semibold text-gray-900 ml-4'>
              <Euro className='h-4 w-4' />
              {extra.priceEUR.toFixed(2)}
              <span className='text-gray-500 text-xs ml-1'>
                ({extra.priceMGA.toLocaleString()} MGA)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}