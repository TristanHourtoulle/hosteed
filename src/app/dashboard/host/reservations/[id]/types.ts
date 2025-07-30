import { RentWithDates } from '@/lib/services/rents.service'
import { PaymentStatus, PaymentMethod } from '@prisma/client'

export interface PayablePrices {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  transferredPrice: number
  commission: number
}

export interface PaymentRequestModalProps {
  isOpen: boolean
  paymentType: PaymentStatus | null
  prices: PayablePrices | null
  notes: string
  method: PaymentMethod
  updating: boolean
  onClose: () => void
  onNotesChange: (notes: string) => void
  onMethodChange: (method: PaymentMethod) => void
  onSubmit: () => void
}

export interface PaymentAmounts {
  halfAmount: number
  fullAmount: number
}

export interface DebugSectionProps {
  rent: RentWithDates | null
  prices: PayablePrices | null
  calculatePaymentAmounts: () => PaymentAmounts
}
