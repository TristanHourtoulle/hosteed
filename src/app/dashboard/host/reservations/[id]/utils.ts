import { RentWithDates } from '@/lib/services/rents.service'
import { PaymentAmounts } from './types'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatNumber'

export const calculatePaymentAmounts = (rent: RentWithDates | null): PaymentAmounts => {
  if (!rent?.prices) return { halfAmount: 0, fullAmount: 0 }

  const totalPrice = Number(rent.prices)
  const commission = rent.product?.commission || 0
  const netAmount = totalPrice - totalPrice * (commission / 100)

  return {
    halfAmount: netAmount / 2,
    fullAmount: netAmount,
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
