import { Ban, Clock, Percent } from 'lucide-react'

interface CancellationPolicyData {
  freeCancellationHours: number
  partialRefundPercent: number
  additionalTerms?: string
}

interface CancellationPolicyProps {
  policy?: CancellationPolicyData
}

export default function CancellationPolicy({ policy }: CancellationPolicyProps) {
  if (!policy) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Politique d&apos;annulation</h3>
      <div className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='flex items-start gap-3'>
            <Clock className='h-5 w-5 text-gray-400 mt-0.5' />
            <div>
              <p className='text-gray-900'>Annulation gratuite</p>
              <p className='text-sm text-gray-600'>
                Jusqu&apos;à {policy.freeCancellationHours} heures avant l&apos;arrivée
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <Percent className='h-5 w-5 text-gray-400 mt-0.5' />
            <div>
              <p className='text-gray-900'>Remboursement partiel</p>
              <p className='text-sm text-gray-600'>
                {policy.partialRefundPercent}% du montant remboursé
              </p>
            </div>
          </div>
        </div>

        {policy.additionalTerms && (
          <div className='flex items-start gap-3'>
            <Ban className='h-5 w-5 text-gray-400 mt-0.5' />
            <div>
              <p className='text-gray-900'>Conditions supplémentaires</p>
              <p className='text-sm text-gray-600'>{policy.additionalTerms}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
