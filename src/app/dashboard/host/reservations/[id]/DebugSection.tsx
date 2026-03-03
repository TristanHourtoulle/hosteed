import { DebugSectionProps } from './types'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

export function DebugSection({ rent, prices, calculatePaymentAmounts }: DebugSectionProps) {
  const hasNewPricing = rent?.hostAmount !== null && rent?.hostAmount !== undefined

  return (
    <div className='p-4 rounded-xl bg-yellow-50 border border-yellow-200'>
      <p className='text-sm text-yellow-800 font-medium mb-2'>Debug des conditions:</p>
      <ul className='text-xs text-yellow-700 space-y-1'>
        <li>
          Statut réservation: <strong>{rent?.status}</strong>
        </li>
        <li>
          Statut paiement: <strong>{rent?.payment}</strong>
        </li>
        <li>
          Contrat: <strong>{rent?.product?.contract ? 'Oui' : 'Non'}</strong>
        </li>
        <li>
          Prix disponible: <strong>{prices?.availablePrice} EUR</strong>
        </li>
        {hasNewPricing ? (
          <>
            <li className='text-green-700 font-semibold'>Nouveau système de pricing</li>
            <li>
              Prix total client: <strong>{formatCurrencySafe(Number(rent?.totalAmount || 0))}</strong>
            </li>
            <li>
              Montant hôte (après commission):{' '}
              <strong>{formatCurrencySafe(Number(rent?.hostAmount || 0))}</strong>
            </li>
            <li>
              Commission hôte:{' '}
              <strong>{formatCurrencySafe(Number(rent?.hostCommission || 0))}</strong>
            </li>
            <li>
              Commission client:{' '}
              <strong>{formatCurrencySafe(Number(rent?.clientCommission || 0))}</strong>
            </li>
          </>
        ) : (
          <>
            <li className='text-orange-700 font-semibold'>Ancien système de pricing</li>
            <li>
              Prix total réservation: <strong>{rent?.prices} EUR</strong>
            </li>
            <li>
              Commission: <strong>{rent?.product?.commission || 0}%</strong>
            </li>
          </>
        )}
        <li>
          Montant 50%: <strong>{formatCurrencySafe(calculatePaymentAmounts().halfAmount)}</strong>
        </li>
        <li>
          Montant total dû à l&apos;hôte:{' '}
          <strong>{formatCurrencySafe(calculatePaymentAmounts().fullAmount)}</strong>
        </li>
      </ul>
    </div>
  )
}
