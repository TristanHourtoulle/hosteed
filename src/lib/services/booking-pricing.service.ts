'use server'
import prisma from '@/lib/prisma'
import { ProductPromotion, PricingPriority, SpecialPrices } from '@prisma/client'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DailyPriceBreakdown {
  date: Date
  basePrice: number
  finalPrice: number
  promotionApplied: boolean
  promotionDiscount?: number
  specialPriceApplied: boolean
  specialPriceValue?: number
  savings: number
  appliedPromotion?: ProductPromotion | null
  appliedSpecialPrice?: SpecialPrices | null
}

export interface BookingPriceResult {
  dailyBreakdown: DailyPriceBreakdown[]
  subtotal: number
  totalSavings: number
  averageNightlyPrice: number
  numberOfNights: number
  promotionApplied: boolean
  specialPriceApplied: boolean
  priority: PricingPriority
}

export interface BookingValidationResult {
  isValid: boolean
  errors: string[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Récupérer les paramètres de tarification d'un hôte
 */
async function getHostPricingSettings(
  userId?: string
): Promise<{ promotionPriority: PricingPriority }> {
  // Si pas d'userId valide, retourner les paramètres par défaut
  if (!userId) {
    return {
      promotionPriority: 'MOST_ADVANTAGEOUS', // Le plus avantageux pour le client par défaut
    }
  }

  let settings = await prisma.hostPricingSettings.findUnique({
    where: { userId },
  })

  // Créer les paramètres par défaut si ils n'existent pas
  if (!settings) {
    try {
      settings = await prisma.hostPricingSettings.create({
        data: {
          userId,
          promotionPriority: 'MOST_ADVANTAGEOUS', // Le plus avantageux pour le client par défaut
        },
      })
    } catch (error) {
      // Si la création échoue (ex: userId invalide), retourner les paramètres par défaut
      console.warn('Failed to create HostPricingSettings for userId:', userId, error)
      return {
        promotionPriority: 'MOST_ADVANTAGEOUS',
      }
    }
  }

  return {
    promotionPriority: settings.promotionPriority,
  }
}

/**
 * Récupérer la promotion active pour un produit à une date donnée
 */
async function getActivePromotionForDate(
  productId: string,
  date: Date
): Promise<ProductPromotion | null> {
  const promotion = await prisma.productPromotion.findFirst({
    where: {
      productId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return promotion
}

/**
 * Récupérer le prix spécial actif pour un produit à une date donnée
 */
async function getActiveSpecialPriceForDate(
  productId: string,
  date: Date
): Promise<SpecialPrices | null> {
  const currentDay = date.toLocaleDateString('en-US', { weekday: 'long' }) as
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday'

  const specialPrices = await prisma.specialPrices.findMany({
    where: {
      productId,
      activate: true,
      day: {
        has: currentDay,
      },
    },
  })

  // Filtrer par dates
  const validSpecialPrices = specialPrices.filter(sp => {
    if (!sp.startDate && !sp.endDate) return true

    if (sp.startDate && sp.endDate) {
      return date >= sp.startDate && date <= sp.endDate
    } else if (sp.startDate) {
      return date >= sp.startDate
    } else if (sp.endDate) {
      return date <= sp.endDate
    }

    return true
  })

  return validSpecialPrices.length > 0 ? validSpecialPrices[0] : null
}

/**
 * Appliquer la logique de tarification pour un jour donné
 */
function applyPricingLogicForDay(
  basePrice: number,
  promotion: ProductPromotion | null,
  specialPrice: SpecialPrices | null,
  priority: PricingPriority,
  date: Date
): DailyPriceBreakdown {
  const breakdown: DailyPriceBreakdown = {
    date,
    basePrice,
    finalPrice: basePrice,
    promotionApplied: false,
    specialPriceApplied: false,
    savings: 0,
  }

  switch (priority) {
    case 'PROMOTION_FIRST':
      if (promotion) {
        const discountedPrice = basePrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = discountedPrice
        breakdown.savings = basePrice - discountedPrice
        breakdown.appliedPromotion = promotion
        return breakdown
      }
      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
        breakdown.finalPrice = specialPriceValue
        breakdown.savings = basePrice - specialPriceValue
        breakdown.appliedSpecialPrice = specialPrice
        return breakdown
      }
      break

    case 'SPECIAL_PRICE_FIRST':
      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
        breakdown.finalPrice = specialPriceValue
        breakdown.savings = basePrice - specialPriceValue
        breakdown.appliedSpecialPrice = specialPrice
        return breakdown
      }
      if (promotion) {
        const discountedPrice = basePrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = discountedPrice
        breakdown.savings = basePrice - discountedPrice
        breakdown.appliedPromotion = promotion
        return breakdown
      }
      break

    case 'MOST_ADVANTAGEOUS':
      const priceWithPromo = promotion
        ? basePrice * (1 - promotion.discountPercentage / 100)
        : basePrice
      const priceWithSpecial = specialPrice ? parseFloat(specialPrice.pricesEuro) : basePrice

      const lowestPrice = Math.min(priceWithPromo, priceWithSpecial, basePrice)

      if (lowestPrice === priceWithPromo && promotion) {
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = priceWithPromo
        breakdown.savings = basePrice - priceWithPromo
        breakdown.appliedPromotion = promotion
        return breakdown
      } else if (lowestPrice === priceWithSpecial && specialPrice) {
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = priceWithSpecial
        breakdown.finalPrice = priceWithSpecial
        breakdown.savings = basePrice - priceWithSpecial
        breakdown.appliedSpecialPrice = specialPrice
        return breakdown
      }
      break

    case 'STACK_DISCOUNTS':
      let finalPrice = basePrice

      if (promotion) {
        finalPrice = finalPrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.appliedPromotion = promotion
      }

      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        const specialDiscount = (basePrice - specialPriceValue) / basePrice
        finalPrice = finalPrice * (1 - specialDiscount)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
        breakdown.appliedSpecialPrice = specialPrice
      }

      breakdown.finalPrice = finalPrice
      breakdown.savings = basePrice - finalPrice
      return breakdown
  }

  // Pas de réduction appliquée
  return breakdown
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Calculer le prix COMPLET d'une réservation incluant TOUT
 * - Prix de base jour par jour avec promotions et special prices
 * - Extras sélectionnés
 * - Commissions (hôte et client)
 * Cette fonction retourne un breakdown complet pour affichage et stockage
 */
export async function calculateCompleteBookingPrice(
  productId: string,
  startDate: Date,
  endDate: Date,
  guestCount: number,
  selectedExtras: Array<{ extraId: string; quantity: number }>,
  ownerId?: string
): Promise<{
  // Prix de base et réductions
  basePricing: BookingPriceResult
  // Extras
  extrasTotal: number
  extrasDetails: Array<{
    extraId: string
    name: string
    quantity: number
    pricePerUnit: number
    total: number
  }>
  // Commissions
  subtotalBeforeCommission: number // Subtotal + Extras
  clientCommission: number
  hostCommission: number
  platformAmount: number
  hostAmount: number
  // Total final
  totalAmount: number
  // Résumé pour affichage
  summary: {
    numberOfNights: number
    averageNightlyPrice: number
    subtotal: number
    totalSavings: number
    extrasTotal: number
    clientCommission: number
    totalAmount: number
    promotionApplied: boolean
    specialPriceApplied: boolean
  }
}> {
  // 1. Calculer le prix de base jour par jour avec promotions et special prices
  const basePricing = await calculateBookingPrice(productId, startDate, endDate, ownerId)

  // 2. Récupérer le produit pour obtenir le typeId (pour les commissions)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      typeId: true,
      extras: {
        where: {
          id: { in: selectedExtras.map(e => e.extraId) },
        },
      },
    },
  })

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  // 3. Calculer le coût des extras
  let extrasTotal = 0
  const extrasDetails: Array<{
    extraId: string
    name: string
    quantity: number
    pricePerUnit: number
    total: number
  }> = []

  const numberOfNights = basePricing.numberOfNights

  for (const selectedExtra of selectedExtras) {
    const extra = product.extras.find(e => e.id === selectedExtra.extraId)
    if (!extra) continue

    const pricePerUnit = extra.priceEUR
    let multiplier = selectedExtra.quantity

    // Calculer le multiplicateur en fonction du type de prix
    switch (extra.type) {
      case 'PER_DAY':
        multiplier = numberOfNights * selectedExtra.quantity
        break
      case 'PER_PERSON':
        multiplier = guestCount * selectedExtra.quantity
        break
      case 'PER_DAY_PERSON':
        multiplier = numberOfNights * guestCount * selectedExtra.quantity
        break
      case 'PER_BOOKING':
        multiplier = selectedExtra.quantity
        break
    }

    const totalForExtra = pricePerUnit * multiplier
    extrasTotal += totalForExtra

    extrasDetails.push({
      extraId: extra.id,
      name: extra.name,
      quantity: multiplier,
      pricePerUnit,
      total: totalForExtra,
    })
  }

  // 4. Calculer les commissions sur (subtotal + extras)
  const subtotalBeforeCommission = basePricing.subtotal + extrasTotal

  // Import dynamique pour éviter les dépendances circulaires
  const { calculateTotalRentPrice } = await import('./commission.service')
  const commissionCalc = await calculateTotalRentPrice(
    basePricing.subtotal / numberOfNights, // Prix moyen par nuit (avec promos/special prices)
    numberOfNights,
    extrasTotal, // Frais additionnels (extras)
    product.typeId
  )

  // 5. Calculer le total final
  const totalAmount = commissionCalc.totalPrice

  return {
    basePricing,
    extrasTotal,
    extrasDetails,
    subtotalBeforeCommission,
    clientCommission: commissionCalc.clientCommission,
    hostCommission: commissionCalc.hostCommission,
    platformAmount: commissionCalc.hostCommission + commissionCalc.clientCommission,
    hostAmount: commissionCalc.hostReceives,
    totalAmount,
    summary: {
      numberOfNights: basePricing.numberOfNights,
      averageNightlyPrice: basePricing.averageNightlyPrice,
      subtotal: basePricing.subtotal,
      totalSavings: basePricing.totalSavings,
      extrasTotal,
      clientCommission: commissionCalc.clientCommission,
      totalAmount,
      promotionApplied: basePricing.promotionApplied,
      specialPriceApplied: basePricing.specialPriceApplied,
    },
  }
}

/**
 * Calculer le prix d'une réservation jour par jour
 * Cette fonction gère les promotions ET les special prices de manière granulaire
 */
export async function calculateBookingPrice(
  productId: string,
  startDate: Date,
  endDate: Date,
  ownerId?: string
): Promise<BookingPriceResult> {
  // 1. Récupérer le produit
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      basePrice: true,
    },
  })

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  const basePrice = parseFloat(product.basePrice)

  // 2. Récupérer les paramètres de tarification de l'hôte
  const settings = await getHostPricingSettings(ownerId)

  // 3. Calculer le prix pour chaque jour
  const dailyBreakdown: DailyPriceBreakdown[] = []
  const currentDate = new Date(startDate)
  currentDate.setHours(12, 0, 0, 0) // Midi pour éviter les problèmes de timezone

  while (currentDate < endDate) {
    // Récupérer la promotion active pour ce jour
    const promotion = await getActivePromotionForDate(productId, currentDate)

    // Récupérer le prix spécial actif pour ce jour
    const specialPrice = await getActiveSpecialPriceForDate(productId, currentDate)

    // Appliquer la logique de tarification
    const dayBreakdown = applyPricingLogicForDay(
      basePrice,
      promotion,
      specialPrice,
      settings.promotionPriority,
      new Date(currentDate)
    )

    dailyBreakdown.push(dayBreakdown)

    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 4. Calculer les totaux
  const subtotal = dailyBreakdown.reduce((sum, day) => sum + day.finalPrice, 0)
  const totalSavings = dailyBreakdown.reduce((sum, day) => sum + day.savings, 0)
  const numberOfNights = dailyBreakdown.length
  const averageNightlyPrice = subtotal / numberOfNights

  const promotionApplied = dailyBreakdown.some(day => day.promotionApplied)
  const specialPriceApplied = dailyBreakdown.some(day => day.specialPriceApplied)

  return {
    dailyBreakdown,
    subtotal,
    totalSavings,
    averageNightlyPrice,
    numberOfNights,
    promotionApplied,
    specialPriceApplied,
    priority: settings.promotionPriority,
  }
}

/**
 * Valider une réservation avant de la créer
 */
export async function validateBooking(
  productId: string,
  startDate: Date,
  endDate: Date,
  guestCount: number
): Promise<BookingValidationResult> {
  const errors: string[] = []

  // 1. Vérifier que le produit existe
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      maxPeople: true,
      minPeople: true,
    },
  })

  if (!product) {
    errors.push('Produit non trouvé')
    return { isValid: false, errors }
  }

  // 2. Vérifier le nombre d'invités
  if (product.maxPeople && guestCount > product.maxPeople) {
    errors.push(
      `Le nombre maximum d'invités est de ${product.maxPeople}. Vous avez sélectionné ${guestCount} personne(s).`
    )
  }

  if (product.minPeople && guestCount < product.minPeople) {
    errors.push(
      `Le nombre minimum d'invités est de ${product.minPeople}. Vous avez sélectionné ${guestCount} personne(s).`
    )
  }

  // 3. Vérifier que les dates sont valides
  if (startDate >= endDate) {
    errors.push('La date de fin doit être après la date de début')
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (startDate < now) {
    errors.push('La date de début ne peut pas être dans le passé')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
