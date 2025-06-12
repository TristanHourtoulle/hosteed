import { Info } from 'lucide-react'

export default function CancellationPolicy() {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Politique d&apos;annulation</h3>
      <div className='bg-gray-50 rounded-lg p-4'>
        <div className='flex items-start gap-3'>
          <Info className='h-5 w-5 text-blue-600 mt-0.5' />
          <div>
            <h4 className='font-medium text-gray-900 mb-2'>Annulation flexible</h4>
            <p className='text-sm text-gray-600 mb-3'>
              Annulation gratuite jusqu&apos;à 24 heures avant l&apos;arrivée. Annulation après
              cette limite : remboursement de 50% du montant total.
            </p>
            <button className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
              En savoir plus sur les conditions d&apos;annulation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
