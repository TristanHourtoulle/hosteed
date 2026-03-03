import { DebugSectionProps } from './types'

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function DebugSection({ rent, prices, calculatePaymentAmounts }: DebugSectionProps) {
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
              Prix total client: <strong>{formatCurrency(Number(rent?.totalAmount || 0))}</strong>
            </li>
            <li>
              Montant hôte (après commission):{' '}
              <strong>{formatCurrency(Number(rent?.hostAmount || 0))}</strong>
            </li>
            <li>
              Commission hôte:{' '}
              <strong>{formatCurrency(Number(rent?.hostCommission || 0))}</strong>
            </li>
            <li>
              Commission client:{' '}
              <strong>{formatCurrency(Number(rent?.clientCommission || 0))}</strong>
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
          Montant 50%: <strong>{formatCurrency(calculatePaymentAmounts().halfAmount)}</strong>
        </li>
        <li>
          Montant total dû à l&apos;hôte:{' '}
          <strong>{formatCurrency(calculatePaymentAmounts().fullAmount)}</strong>
        </li>
      </ul>
    </div>
  )
}
