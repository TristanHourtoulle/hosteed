import { RentWithDates } from '@/lib/services/rents.service'
import { PaymentAmounts } from './types'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatNumber'

export const calculatePaymentAmounts = (rent: RentWithDates | null): PaymentAmounts => {
  if (!rent) return { halfAmount: 0, fullAmount: 0 }

  // Use new detailed pricing field - hostAmount already has commission deducted
  // Fallback to old calculation for legacy data that doesn't have new fields
  let hostAmount: number

  if (rent.hostAmount !== null && rent.hostAmount !== undefined) {
    hostAmount = Number(rent.hostAmount)
  } else if (rent.prices) {
    // Legacy calculation for old reservations
    const totalPrice = Number(rent.prices)
    const commission = rent.product?.commission || 0
    hostAmount = totalPrice - totalPrice * (commission / 100)
  } else {
    return { halfAmount: 0, fullAmount: 0 }
  }

  return {
    halfAmount: hostAmount / 2,
    fullAmount: hostAmount,
  }
}

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatCurrency = (amount: number) => {
  return formatCurrencyUtil(amount, 'EUR')
}
