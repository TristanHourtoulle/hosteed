'use server'
import prisma from '@/lib/prisma'
import { ProductPromotion, PricingPriority, SpecialPrices } from '@prisma/client'

/**
 * Structural minimum required by {@link applyPricingLogicForDay}: it only reads
 * `pricesEuro`. Lets the shared per-day pricing logic accept both the
 * establishment-level `SpecialPrices` and the per-type `RoomTypeSpecialPrice`
 * (identical field shape keyed by `roomTypeId`) without behavior change.
 */
export type SpecialPriceLike = Pick<SpecialPrices, 'pricesEuro'> & Partial<SpecialPrices>

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
  appliedSpecialPrice?: SpecialPriceLike | null
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
  specialPrice: SpecialPriceLike | null,
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

  // 3. Validate date range
  if (startDate >= endDate) {
    throw new Error('End date must be after start date')
  }

  // 4. Calculer le prix pour chaque jour
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

// ============================================
// PER-ROOM-TYPE PRICING (hotel multi-room)
// ============================================

/**
 * A single priced room-type line of a hotel booking.
 */
export interface HotelBookingPriceLine {
  roomTypeId: string
  quantity: number
  /** `RoomType.basePrice` snapshot — Lot 4 stores this on `RentRoomType.unitPrice`. */
  unitPrice: string
  /** Day-by-day price for ONE room of this type. */
  unitPricing: BookingPriceResult
  /** `unitPricing.subtotal * quantity`. */
  lineSubtotal: number
}

/**
 * Full multi-room-type booking price. Canonical result consumed by the guest
 * booking flow + Stripe (Lot 4). `totalAmount` = Σ line subtotals + extras,
 * then commissions.
 */
/** A priced extra line, mirroring `calculateCompleteBookingPrice.extrasDetails`. */
export interface HotelBookingExtraDetail {
  extraId: string
  name: string
  quantity: number
  pricePerUnit: number
  total: number
}

export interface HotelBookingPriceResult {
  lines: HotelBookingPriceLine[]
  /** Rooms subtotal = Σ `lineSubtotal`. */
  subtotal: number
  extrasTotal: number
  /** Per-extra breakdown (used to persist `RentExtra` rows). */
  extrasDetails: HotelBookingExtraDetail[]
  totalSavings: number
  clientCommission: number
  hostCommission: number
  platformAmount: number
  hostAmount: number
  totalAmount: number
  summary: {
    numberOfNights: number
    subtotal: number
    totalSavings: number
    extrasTotal: number
    clientCommission: number
    totalAmount: number
    promotionApplied: boolean
    specialPriceApplied: boolean
  }
}

/**
 * Resolve the active promotion for a room type on a given date.
 * A type-specific promotion (`roomTypeId === X`) takes precedence over a
 * product-wide one (`roomTypeId === null`); this is deterministic, NOT
 * "most advantageous".
 */
async function getActivePromotionForRoomTypeDate(
  productId: string,
  roomTypeId: string,
  date: Date
): Promise<ProductPromotion | null> {
  const promotions = await prisma.productPromotion.findMany({
    where: {
      productId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
      OR: [{ roomTypeId }, { roomTypeId: null }],
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    promotions.find(p => p.roomTypeId === roomTypeId) ??
    promotions.find(p => p.roomTypeId === null) ??
    null
  )
}

/**
 * Resolve the active per-type special price for a room type on a given date.
 * Mirrors {@link getActiveSpecialPriceForDate} but keyed by `roomTypeId`.
 */
async function getActiveSpecialPriceForRoomTypeDate(
  roomTypeId: string,
  date: Date
): Promise<SpecialPriceLike | null> {
  const currentDay = date.toLocaleDateString('en-US', { weekday: 'long' }) as
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday'

  const specialPrices = await prisma.roomTypeSpecialPrice.findMany({
    where: {
      roomTypeId,
      activate: true,
      day: { has: currentDay },
    },
  })

  const validSpecialPrices = specialPrices.filter(sp => {
    if (!sp.startDate && !sp.endDate) return true
    if (sp.startDate && sp.endDate) return date >= sp.startDate && date <= sp.endDate
    if (sp.startDate) return date >= sp.startDate
    if (sp.endDate) return date <= sp.endDate
    return true
  })

  return validSpecialPrices.length > 0 ? validSpecialPrices[0] : null
}

/**
 * Day-by-day price for ONE room of a type, using `RoomType.basePrice`,
 * per-type special prices and per-type promotions.
 *
 * @param {string} roomTypeId - Room type identifier
 * @param {Date} startDate - Booking start date
 * @param {Date} endDate - Booking end date
 * @param {string} [ownerId] - Host id (for pricing-priority settings)
 * @returns {Promise<BookingPriceResult>} Per-type day-by-day pricing
 * @throws {Error} When the room type is unknown or the date range is invalid
 */
export async function calculateRoomTypeBookingPrice(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  ownerId?: string
): Promise<BookingPriceResult> {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { basePrice: true, productId: true },
  })

  if (!roomType) {
    throw new Error('Room type not found')
  }

  if (startDate >= endDate) {
    throw new Error('End date must be after start date')
  }

  const basePrice = parseFloat(roomType.basePrice)
  const settings = await getHostPricingSettings(ownerId)

  const dailyBreakdown: DailyPriceBreakdown[] = []
  const currentDate = new Date(startDate)
  currentDate.setHours(12, 0, 0, 0) // Midday to avoid timezone edge cases

  while (currentDate < endDate) {
    const promotion = await getActivePromotionForRoomTypeDate(
      roomType.productId,
      roomTypeId,
      currentDate
    )
    const specialPrice = await getActiveSpecialPriceForRoomTypeDate(roomTypeId, currentDate)

    dailyBreakdown.push(
      applyPricingLogicForDay(
        basePrice,
        promotion,
        specialPrice,
        settings.promotionPriority,
        new Date(currentDate)
      )
    )

    currentDate.setDate(currentDate.getDate() + 1)
  }

  const subtotal = dailyBreakdown.reduce((sum, day) => sum + day.finalPrice, 0)
  const totalSavings = dailyBreakdown.reduce((sum, day) => sum + day.savings, 0)
  const numberOfNights = dailyBreakdown.length
  const averageNightlyPrice = numberOfNights > 0 ? subtotal / numberOfNights : 0

  return {
    dailyBreakdown,
    subtotal,
    totalSavings,
    averageNightlyPrice,
    numberOfNights,
    promotionApplied: dailyBreakdown.some(day => day.promotionApplied),
    specialPriceApplied: dailyBreakdown.some(day => day.specialPriceApplied),
    priority: settings.promotionPriority,
  }
}

/**
 * Full multi-room-type booking price (canonical signature consumed by Lot 4).
 * Prices each selected room type day-by-day, sums line subtotals, adds extras,
 * then applies commissions on the aggregated rooms subtotal.
 *
 * @param {string} productId - Product (establishment) identifier
 * @param {Array<{ roomTypeId: string; quantity: number }>} lines - Selected room types + quantities
 * @param {Date} startDate - Booking start date
 * @param {Date} endDate - Booking end date
 * @param {number} guestCount - Number of guests (for PER_PERSON extras)
 * @param {Array<{ extraId: string; quantity: number }>} selectedExtras - Selected extras
 * @param {string} [ownerId] - Host id (for pricing-priority settings)
 * @returns {Promise<HotelBookingPriceResult>} Full priced hotel booking
 * @throws {Error} When `lines` is empty or the product is not found
 */
export async function calculateHotelBookingPrice(
  productId: string,
  lines: Array<{ roomTypeId: string; quantity: number }>,
  startDate: Date,
  endDate: Date,
  guestCount: number,
  selectedExtras: Array<{ extraId: string; quantity: number }>,
  ownerId?: string
): Promise<HotelBookingPriceResult> {
  if (!lines || lines.length === 0) {
    throw new Error('At least one room type must be selected')
  }

  // 1. Fetch base prices + capacity for all selected room types (snapshot for
  //    unitPrice and authoritative guest-capacity enforcement).
  const roomTypeIds = lines.map(l => l.roomTypeId)
  const roomTypes = await prisma.roomType.findMany({
    where: { id: { in: roomTypeIds } },
    select: { id: true, basePrice: true, capacity: true },
  })
  const basePriceById = new Map(roomTypes.map(rt => [rt.id, rt.basePrice]))

  // Enforce the guest count against the selected room types' total capacity.
  // Authoritative — never trust the client. Rule:
  //   guestCount <= Σ(RoomType.capacity × quantity)
  // A missing room type contributes 0 seats so tampered ids cannot inflate it.
  const capacityById = new Map(roomTypes.map(rt => [rt.id, rt.capacity]))
  const totalCapacity = lines.reduce(
    (sum, line) => sum + (capacityById.get(line.roomTypeId) ?? 0) * line.quantity,
    0
  )
  if (guestCount > totalCapacity) {
    throw new Error(
      `Le nombre de voyageurs (${guestCount}) dépasse la capacité maximale des chambres ` +
        `sélectionnées (${totalCapacity} personne${totalCapacity > 1 ? 's' : ''} au total). ` +
        `Veuillez réduire le nombre de voyageurs ou ajouter des chambres.`
    )
  }

  // 2. Price each line day-by-day.
  const pricedLines: HotelBookingPriceLine[] = []
  for (const line of lines) {
    const unitPricing = await calculateRoomTypeBookingPrice(
      line.roomTypeId,
      startDate,
      endDate,
      ownerId
    )
    pricedLines.push({
      roomTypeId: line.roomTypeId,
      quantity: line.quantity,
      unitPrice: basePriceById.get(line.roomTypeId) ?? '0',
      unitPricing,
      lineSubtotal: unitPricing.subtotal * line.quantity,
    })
  }

  const roomsSubtotal = pricedLines.reduce((sum, l) => sum + l.lineSubtotal, 0)
  const totalSavings = pricedLines.reduce(
    (sum, l) => sum + l.unitPricing.totalSavings * l.quantity,
    0
  )
  const numberOfNights = pricedLines[0].unitPricing.numberOfNights

  // 3. Fetch product (typeId for commissions) + selected extras.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      typeId: true,
      extras: {
        where: { id: { in: selectedExtras.map(e => e.extraId) } },
      },
    },
  })

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  // 4. Compute extras (same multiplier rules as calculateCompleteBookingPrice).
  let extrasTotal = 0
  const extrasDetails: Array<{
    extraId: string
    name: string
    quantity: number
    pricePerUnit: number
    total: number
  }> = []

  for (const selectedExtra of selectedExtras) {
    const extra = product.extras.find(e => e.id === selectedExtra.extraId)
    if (!extra) continue

    const pricePerUnit = extra.priceEUR
    let multiplier = selectedExtra.quantity

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

  // 5. Commissions on aggregated rooms subtotal (+ extras).
  const { calculateTotalRentPrice } = await import('./commission.service')
  const commissionCalc = await calculateTotalRentPrice(
    numberOfNights > 0 ? roomsSubtotal / numberOfNights : roomsSubtotal,
    numberOfNights,
    extrasTotal,
    product.typeId
  )

  const totalAmount = commissionCalc.totalPrice

  return {
    lines: pricedLines,
    subtotal: roomsSubtotal,
    extrasTotal,
    extrasDetails,
    totalSavings,
    clientCommission: commissionCalc.clientCommission,
    hostCommission: commissionCalc.hostCommission,
    platformAmount: commissionCalc.hostCommission + commissionCalc.clientCommission,
    hostAmount: commissionCalc.hostReceives,
    totalAmount,
    summary: {
      numberOfNights,
      subtotal: roomsSubtotal,
      totalSavings,
      extrasTotal,
      clientCommission: commissionCalc.clientCommission,
      totalAmount,
      promotionApplied: pricedLines.some(l => l.unitPricing.promotionApplied),
      specialPriceApplied: pricedLines.some(l => l.unitPricing.specialPriceApplied),
    },
  }
}
