import { DebugSectionProps } from './types'
import { formatCurrency } from './utils'

export default function DebugSection({ rent, prices, calculatePaymentAmounts }: DebugSectionProps) {
  return (
    <div className='mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
      <p className='text-sm text-yellow-800 font-medium mb-2'>🔍 Debug des conditions:</p>
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
          Prix disponible: <strong>{prices?.availablePrice} €</strong>
        </li>
        <li>
          Prix total réservation: <strong>{rent?.prices} €</strong>
        </li>
        <li>
          Commission: <strong>{rent?.product?.commission || 0}%</strong>
        </li>
        <li>
          Montant 50%: <strong>{formatCurrency(calculatePaymentAmounts().halfAmount)}</strong>
        </li>
        <li>
          Montant total: <strong>{formatCurrency(calculatePaymentAmounts().fullAmount)}</strong>
        </li>
      </ul>
    </div>
  )
}
