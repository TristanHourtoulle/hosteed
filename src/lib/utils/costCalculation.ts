import { ExtraPriceType } from '@prisma/client'

interface BookingDetails {
  startDate: Date
  endDate: Date
  guestCount: number
}

interface ExtraWithPricing {
  id: string
  name: string
  description?: string | null
  priceEUR: number
  priceMGA: number
  type: ExtraPriceType
}

export function calculateExtrasCost(
  selectedExtras: ExtraWithPricing[],
  bookingDetails: BookingDetails,
  currency: 'EUR' | 'MGA' = 'EUR'
): number {
  if (!selectedExtras.length) return 0

  const { startDate, endDate, guestCount } = bookingDetails
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return selectedExtras.reduce((total, extra) => {
    const basePrice = currency === 'EUR' ? extra.priceEUR : extra.priceMGA

    let multiplier = 1

    switch (extra.type) {
      case 'PER_DAY':
        multiplier = numberOfDays
        break
      case 'PER_PERSON':
        multiplier = guestCount
        break
      case 'PER_DAY_PERSON':
        multiplier = numberOfDays * guestCount
        break
      case 'PER_BOOKING':
        multiplier = 1
        break
      default:
        multiplier = 1
    }

    return total + (basePrice * multiplier)
  }, 0)
}

export function getExtraCostPreview(
  extra: ExtraWithPricing,
  numberOfDays: number,
  guestCount: number,
  currency: 'EUR' | 'MGA' = 'EUR'
): { cost: number; description: string } {
  const basePrice = currency === 'EUR' ? extra.priceEUR : extra.priceMGA
  const currencySymbol = currency === 'EUR' ? '€' : 'Ar'
  
  let cost = basePrice
  let description = `${basePrice}${currencySymbol}`

  switch (extra.type) {
    case 'PER_DAY':
      cost = basePrice * numberOfDays
      description = `${basePrice}${currencySymbol} × ${numberOfDays} jour${numberOfDays > 1 ? 's' : ''} = ${cost}${currencySymbol}`
      break
    case 'PER_PERSON':
      cost = basePrice * guestCount
      description = `${basePrice}${currencySymbol} × ${guestCount} personne${guestCount > 1 ? 's' : ''} = ${cost}${currencySymbol}`
      break
    case 'PER_DAY_PERSON':
      cost = basePrice * numberOfDays * guestCount
      description = `${basePrice}${currencySymbol} × ${numberOfDays} jour${numberOfDays > 1 ? 's' : ''} × ${guestCount} personne${guestCount > 1 ? 's' : ''} = ${cost}${currencySymbol}`
      break
    case 'PER_BOOKING':
      cost = basePrice
      description = `${basePrice}${currencySymbol} par réservation`
      break
  }

  return { cost, description }
}

export function calculateTotalBookingCost(
  basePrice: number,
  numberOfDays: number,
  selectedExtras: ExtraWithPricing[],
  bookingDetails: BookingDetails,
  currency: 'EUR' | 'MGA' = 'EUR'
): {
  baseTotal: number
  extrasTotal: number
  grandTotal: number
} {
  const baseTotal = basePrice * numberOfDays
  const extrasTotal = calculateExtrasCost(selectedExtras, bookingDetails, currency)
  const grandTotal = baseTotal + extrasTotal

  return {
    baseTotal,
    extrasTotal,
    grandTotal
  }
}