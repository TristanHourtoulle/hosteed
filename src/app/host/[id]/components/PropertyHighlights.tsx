import { CheckCircle2, Clock } from 'lucide-react'

interface Product {
  certified?: boolean
  autoAccept?: boolean
}

interface PropertyHighlightsProps {
  product: Product
}

export default function PropertyHighlights({ product }: PropertyHighlightsProps) {
  if (!product.certified && !product.autoAccept) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ce qui rend ce logement unique</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {product.certified && (
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
              <CheckCircle2 className='h-4 w-4 text-green-600' />
            </div>
            <div>
              <p className='font-medium text-gray-900'>Logement certifié</p>
              <p className='text-sm text-gray-600'>Vérifié par notre équipe</p>
            </div>
          </div>
        )}
        {product.autoAccept && (
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <Clock className='h-4 w-4 text-blue-600' />
            </div>
            <div>
              <p className='font-medium text-gray-900'>Réservation instantanée</p>
              <p className='text-sm text-gray-600'>Confirmation immédiate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
