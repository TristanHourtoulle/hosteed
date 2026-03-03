import { RentWithDates } from '@/lib/services/rents.service'
import { PayablePrices } from './types'
import { PaymentStatus } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Separator } from '@/components/ui/shadcnui/separator'
import { Button } from '@/components/ui/shadcnui/button'
import {
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { calculatePaymentAmounts } from './utils'
import { DebugSection } from './DebugSection'

interface PaymentInfoCardProps {
  rent: RentWithDates
  prices: PayablePrices | null
  updating: boolean
  onPaymentRequest: (type: PaymentStatus) => void
  showSensitiveInfo?: boolean
}

import { PAYMENT_LABELS } from '@/lib/constants/reservation'
import { formatCurrencySafe } from '@/lib/utils/formatNumber'

export function PaymentInfoCard({
  rent,
  prices,
  updating,
  onPaymentRequest,
  showSensitiveInfo = false,
}: PaymentInfoCardProps) {
  const paymentAmounts = calculatePaymentAmounts(rent)

  const paymentInfo =
    rent.payment === 'NOT_PAID' && rent.status === 'WAITING'
      ? { label: 'Autorisé (en attente de capture)', color: 'text-amber-600' }
      : PAYMENT_LABELS[rent.payment] || { label: rent.payment, color: 'text-gray-600' }

  const isPendingTransfer =
    rent.payment === PaymentStatus.MID_TRANSFER_REQ ||
    rent.payment === PaymentStatus.REST_TRANSFER_REQ ||
    rent.payment === PaymentStatus.FULL_TRANSFER_REQ

  const isTransferDone =
    rent.payment === PaymentStatus.MID_TRANSFER_DONE ||
    rent.payment === PaymentStatus.REST_TRANSFER_DONE ||
    rent.payment === PaymentStatus.FULL_TRANSFER_DONE

  const can50 =
    rent.payment === PaymentStatus.CLIENT_PAID &&
    (rent.status === 'RESERVED' || rent.status === 'CHECKIN' || rent.product?.contract)

  const canRest = rent.payment === PaymentStatus.MID_TRANSFER_DONE

  const canFull =
    rent.payment === PaymentStatus.CLIENT_PAID &&
    (rent.status === 'RESERVED' || rent.status === 'CHECKOUT' || rent.product?.contract)

  const hasActions = can50 || canRest || canFull

  return (
    <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
      <div className='px-6 py-4 border-b border-gray-100'>
        <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
          <CreditCard className='h-5 w-5 text-blue-600' />
          Paiement & transferts
        </h2>
      </div>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          {/* Payment status */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>Statut du paiement</span>
            <span className={`text-sm font-semibold ${paymentInfo.color}`}>
              {paymentInfo.label}
            </span>
          </div>

          {/* Amounts grid */}
          {prices && (
            <>
              <Separator />
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-xl bg-blue-50 border border-blue-100 p-3 text-center'>
                  <p className='text-xs text-blue-500 mb-1'>Disponible</p>
                  <p className='text-lg font-bold text-blue-700'>
                    {formatCurrencySafe(prices.availablePrice)}
                  </p>
                </div>
                <div className='rounded-xl bg-orange-50 border border-orange-100 p-3 text-center'>
                  <p className='text-xs text-orange-500 mb-1'>En attente</p>
                  <p className='text-lg font-bold text-orange-700'>
                    {formatCurrencySafe(prices.pendingPrice)}
                  </p>
                </div>
                <div className='rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center'>
                  <p className='text-xs text-emerald-500 mb-1'>Reçu</p>
                  <p className='text-lg font-bold text-emerald-700'>
                    {formatCurrencySafe(prices.transferredPrice)}
                  </p>
                </div>
                <div className='rounded-xl bg-gray-50 border border-gray-200 p-3 text-center'>
                  <p className='text-xs text-gray-500 mb-1'>Commission</p>
                  <p className='text-lg font-bold text-gray-700'>{prices.commission}%</p>
                </div>
              </div>
            </>
          )}

          {/* Info message */}
          <div className='rounded-lg bg-gray-50 border border-gray-200 p-3'>
            <p className='text-xs text-gray-600'>
              Le prix disponible représente ce que vous pouvez demander maintenant.
              {rent.product?.contract &&
                ' Avec un contrat, vous pouvez demander le paiement dès la réservation confirmée.'}
            </p>
          </div>

          {/* Payment request buttons */}
          {hasActions && (
            <>
              <Separator />
              <div className='space-y-2'>
                <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                  Demandes de paiement
                </p>

                {can50 && (
                  <Button
                    variant='outline'
                    className='w-full justify-between h-auto py-3 rounded-xl border-blue-200 hover:bg-blue-50'
                    onClick={() => onPaymentRequest(PaymentStatus.MID_TRANSFER_REQ)}
                    disabled={updating}
                  >
                    <div className='flex items-center gap-3'>
                      <Banknote className='h-4 w-4 text-blue-600' />
                      <div className='text-left'>
                        <p className='font-medium text-gray-900'>Demander 50%</p>
                        <p className='text-xs text-gray-500'>Moitié du montant dû</p>
                      </div>
                    </div>
                    <span className='font-bold text-blue-700'>
                      {formatCurrencySafe(paymentAmounts.halfAmount)}
                    </span>
                  </Button>
                )}

                {canRest && (
                  <Button
                    variant='outline'
                    className='w-full justify-between h-auto py-3 rounded-xl border-orange-200 hover:bg-orange-50'
                    onClick={() => onPaymentRequest(PaymentStatus.REST_TRANSFER_REQ)}
                    disabled={updating}
                  >
                    <div className='flex items-center gap-3'>
                      <Banknote className='h-4 w-4 text-orange-600' />
                      <div className='text-left'>
                        <p className='font-medium text-gray-900'>Demander le reste</p>
                        <p className='text-xs text-gray-500'>Solde restant du paiement</p>
                      </div>
                    </div>
                    <span className='font-bold text-orange-700'>
                      {formatCurrencySafe(paymentAmounts.halfAmount)}
                    </span>
                  </Button>
                )}

                {canFull && (
                  <Button
                    variant='outline'
                    className='w-full justify-between h-auto py-3 rounded-xl border-emerald-200 hover:bg-emerald-50'
                    onClick={() => onPaymentRequest(PaymentStatus.FULL_TRANSFER_REQ)}
                    disabled={updating}
                  >
                    <div className='flex items-center gap-3'>
                      <Banknote className='h-4 w-4 text-emerald-600' />
                      <div className='text-left'>
                        <p className='font-medium text-gray-900'>Demander le total</p>
                        <p className='text-xs text-gray-500'>Montant intégral dû</p>
                      </div>
                    </div>
                    <span className='font-bold text-emerald-700'>
                      {formatCurrencySafe(paymentAmounts.fullAmount)}
                    </span>
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Pending transfer notice */}
          {isPendingTransfer && (
            <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm'>
                <p className='font-medium text-amber-800'>Demande en cours</p>
                <p className='text-amber-700'>
                  Votre demande de paiement a été envoyée aux administrateurs et est en cours de
                  traitement.
                </p>
              </div>
            </div>
          )}

          {/* Transfer done notice */}
          {isTransferDone && (
            <div className='flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-3'>
              <CheckCircle2 className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm'>
                <p className='font-medium text-green-800'>Paiement approuvé</p>
                <p className='text-green-700'>
                  Votre demande de paiement a été approuvée et le virement va être effectué.
                </p>
              </div>
            </div>
          )}

          {/* Debug Section - Only visible to admins/host managers or in dev mode */}
          {(showSensitiveInfo || process.env.NODE_ENV === 'development') && (
            <DebugSection
              rent={rent}
              prices={prices}
              calculatePaymentAmounts={() => paymentAmounts}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
