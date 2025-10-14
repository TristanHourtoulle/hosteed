'use server'
import prisma from '@/lib/prisma'
import { ProductPromotion, PricingPriority, SpecialPrices } from '@prisma/client'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreatePromotionInput {
  productId: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  createdById: string
}

export interface CreatePromotionResult {
  promotion?: ProductPromotion
  hasOverlap?: boolean
  overlappingPromotions?: ProductPromotion[]
}

export interface PriceBreakdown {
  basePrice: number
  promotionApplied: boolean
  promotionDiscount?: number
  specialPriceApplied: boolean
  specialPriceValue?: number
  finalPrice: number
  savings?: number
}

export interface FinalPriceResult {
  finalPrice: number
  originalPrice: number
  appliedPromotion?: ProductPromotion | null
  appliedSpecialPrice?: SpecialPrices | null
  breakdown: PriceBreakdown
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Trouve les promotions qui se chevauchent avec les dates données
 */
export async function findOverlappingPromotions(
  productId: string,
  startDate: Date,
  endDate: Date,
  excludePromotionId?: string
): Promise<ProductPromotion[]> {
  const overlapping = await prisma.productPromotion.findMany({
    where: {
      productId,
      isActive: true,
      id: excludePromotionId ? { not: excludePromotionId } : undefined,
      OR: [
        // La nouvelle promotion commence pendant une promotion existante
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } }
          ]
        },
        // La nouvelle promotion se termine pendant une promotion existante
        {
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: endDate } }
          ]
        },
        // La nouvelle promotion englobe une promotion existante
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } }
          ]
        }
      ]
    },
    include: {
      product: {
        select: {
          name: true
        }
      }
    }
  })

  return overlapping
}

/**
 * Crée une promotion (vérifie d'abord les chevauchements)
 */
export async function createPromotion(
  data: CreatePromotionInput
): Promise<CreatePromotionResult> {
  // 1. Vérifier les promotions qui se chevauchent
  const overlapping = await findOverlappingPromotions(
    data.productId,
    data.startDate,
    data.endDate
  )

  if (overlapping.length > 0) {
    return {
      hasOverlap: true,
      overlappingPromotions: overlapping
    }
  }

  // 2. Vérifier que la promotion ne fait pas perdre d'argent à la plateforme
  const isValid = await validatePromotionCommission(
    data.productId,
    data.discountPercentage
  )

  if (!isValid) {
    throw new Error(
      'Cette réduction est trop importante. La plateforme ne pourrait pas couvrir ses frais. Veuillez réduire le pourcentage de réduction.'
    )
  }

  // 3. Créer la promotion
  const promotion = await prisma.productPromotion.create({
    data: {
      productId: data.productId,
      discountPercentage: data.discountPercentage,
      startDate: data.startDate,
      endDate: data.endDate,
      createdById: data.createdById,
      isActive: true
    },
    include: {
      product: {
        select: {
          name: true
        }
      }
    }
  })

  return { promotion }
}

/**
 * Confirmer la création d'une promotion et désactiver les anciennes qui se chevauchent
 */
export async function confirmPromotionWithOverlap(
  data: CreatePromotionInput,
  overlappingIds: string[]
): Promise<ProductPromotion> {
  return await prisma.$transaction(async (tx) => {
    // 1. Créer la nouvelle promotion
    const newPromotion = await tx.productPromotion.create({
      data: {
        productId: data.productId,
        discountPercentage: data.discountPercentage,
        startDate: data.startDate,
        endDate: data.endDate,
        createdById: data.createdById,
        isActive: true
      }
    })

    // 2. Désactiver les anciennes promotions et lier la relation
    await tx.productPromotion.updateMany({
      where: { id: { in: overlappingIds } },
      data: {
        isActive: false,
        replacedById: newPromotion.id
      }
    })

    return newPromotion
  })
}

/**
 * Mettre à jour une promotion existante
 */
export async function updatePromotion(
  id: string,
  data: Partial<CreatePromotionInput>
): Promise<ProductPromotion> {
  // Vérifier les chevauchements si les dates changent
  if (data.startDate || data.endDate) {
    const current = await prisma.productPromotion.findUnique({
      where: { id }
    })

    if (!current) {
      throw new Error('Promotion non trouvée')
    }

    const overlapping = await findOverlappingPromotions(
      data.productId || current.productId,
      data.startDate || current.startDate,
      data.endDate || current.endDate,
      id // Exclure la promotion actuelle
    )

    if (overlapping.length > 0) {
      throw new Error(
        'Les nouvelles dates se chevauchent avec une autre promotion existante'
      )
    }
  }

  return await prisma.productPromotion.update({
    where: { id },
    data: {
      discountPercentage: data.discountPercentage,
      startDate: data.startDate,
      endDate: data.endDate
    }
  })
}

/**
 * Annuler une promotion (soft delete)
 */
export async function cancelPromotion(id: string): Promise<ProductPromotion> {
  return await prisma.productPromotion.update({
    where: { id },
    data: { isActive: false }
  })
}

/**
 * Récupérer la promotion active pour un produit à une date donnée
 */
export async function getActivePromotionForProduct(
  productId: string,
  date: Date = new Date()
): Promise<ProductPromotion | null> {
  const promotion = await prisma.productPromotion.findFirst({
    where: {
      productId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return promotion
}

/**
 * Récupérer les promotions actives pour plusieurs produits
 */
export async function getPromotionsForProducts(
  productIds: string[],
  date: Date = new Date()
): Promise<Map<string, ProductPromotion>> {
  const promotions = await prisma.productPromotion.findMany({
    where: {
      productId: { in: productIds },
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date }
    }
  })

  const promotionMap = new Map<string, ProductPromotion>()
  promotions.forEach((promo) => {
    // Prendre la première promotion pour chaque produit (ne devrait y en avoir qu'une normalement)
    if (!promotionMap.has(promo.productId)) {
      promotionMap.set(promo.productId, promo)
    }
  })

  return promotionMap
}

/**
 * Récupérer toutes les promotions d'un produit
 */
export async function getPromotionsByProduct(
  productId: string
): Promise<ProductPromotion[]> {
  return await prisma.productPromotion.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })
}

/**
 * Récupérer toutes les promotions d'un hôte
 */
export async function getPromotionsByHost(
  hostId: string
): Promise<ProductPromotion[]> {
  return await prisma.productPromotion.findMany({
    where: {
      product: {
        user: {
          some: {
            id: hostId
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          address: true,
          img: {
            select: { img: true },
            take: 1
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })
}

/**
 * Valider qu'une promotion ne fait pas perdre d'argent à la plateforme
 */
export async function validatePromotionCommission(
  productId: string,
  discountPercentage: number
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      type: {
        include: {
          commission: true
        }
      }
    }
  })

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  const basePrice = parseFloat(product.basePrice)
  const discountedPrice = basePrice * (1 - discountPercentage / 100)

  // Récupérer les commissions
  const commission = product.type.commission

  if (!commission) {
    // Pas de commission configurée, on autorise
    return true
  }

  const hostCommission =
    (discountedPrice * commission.hostCommissionRate) / 100 +
    commission.hostCommissionFixed

  const clientCommission =
    (discountedPrice * commission.clientCommissionRate) / 100 +
    commission.clientCommissionFixed

  const platformRevenue = hostCommission + clientCommission

  // La plateforme doit gagner au minimum 1€
  return platformRevenue >= 1
}

// ============================================
// PRICING LOGIC
// ============================================

/**
 * Récupérer les paramètres de tarification d'un hôte
 */
export async function getHostPricingSettings(
  userId: string
): Promise<{ promotionPriority: PricingPriority }> {
  let settings = await prisma.hostPricingSettings.findUnique({
    where: { userId }
  })

  // Créer les paramètres par défaut si ils n'existent pas
  if (!settings) {
    settings = await prisma.hostPricingSettings.create({
      data: {
        userId,
        promotionPriority: 'PROMOTION_FIRST'
      }
    })
  }

  return {
    promotionPriority: settings.promotionPriority
  }
}

/**
 * Mettre à jour les paramètres de tarification d'un hôte
 */
export async function updateHostPricingSettings(
  userId: string,
  settings: { promotionPriority: PricingPriority }
) {
  return await prisma.hostPricingSettings.upsert({
    where: { userId },
    update: {
      promotionPriority: settings.promotionPriority
    },
    create: {
      userId,
      promotionPriority: settings.promotionPriority
    }
  })
}

/**
 * Récupérer le prix spécial actif pour un produit
 */
async function getActiveSpecialPrice(
  productId: string,
  date: Date = new Date()
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
        has: currentDay
      }
    }
  })

  // Filtrer par dates
  const validSpecialPrices = specialPrices.filter((sp) => {
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
 * Appliquer la logique de tarification selon la priorité
 */
function applyPricingLogic(
  basePrice: number,
  promotion: ProductPromotion | null,
  specialPrice: SpecialPrices | null,
  priority: PricingPriority
): FinalPriceResult {
  const breakdown: PriceBreakdown = {
    basePrice,
    promotionApplied: false,
    specialPriceApplied: false,
    finalPrice: basePrice
  }

  switch (priority) {
    case 'PROMOTION_FIRST':
      if (promotion) {
        const discountedPrice =
          basePrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = discountedPrice
        breakdown.savings = basePrice - discountedPrice
        return {
          finalPrice: discountedPrice,
          originalPrice: basePrice,
          appliedPromotion: promotion,
          appliedSpecialPrice: null,
          breakdown
        }
      }
      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
        breakdown.finalPrice = specialPriceValue
        breakdown.savings = basePrice - specialPriceValue
        return {
          finalPrice: specialPriceValue,
          originalPrice: basePrice,
          appliedPromotion: null,
          appliedSpecialPrice: specialPrice,
          breakdown
        }
      }
      break

    case 'SPECIAL_PRICE_FIRST':
      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
        breakdown.finalPrice = specialPriceValue
        breakdown.savings = basePrice - specialPriceValue
        return {
          finalPrice: specialPriceValue,
          originalPrice: basePrice,
          appliedPromotion: null,
          appliedSpecialPrice: specialPrice,
          breakdown
        }
      }
      if (promotion) {
        const discountedPrice =
          basePrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = discountedPrice
        breakdown.savings = basePrice - discountedPrice
        return {
          finalPrice: discountedPrice,
          originalPrice: basePrice,
          appliedPromotion: promotion,
          appliedSpecialPrice: null,
          breakdown
        }
      }
      break

    case 'MOST_ADVANTAGEOUS':
      const priceWithPromo = promotion
        ? basePrice * (1 - promotion.discountPercentage / 100)
        : basePrice
      const priceWithSpecial = specialPrice
        ? parseFloat(specialPrice.pricesEuro)
        : basePrice

      const lowestPrice = Math.min(priceWithPromo, priceWithSpecial, basePrice)

      if (lowestPrice === priceWithPromo && promotion) {
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
        breakdown.finalPrice = priceWithPromo
        breakdown.savings = basePrice - priceWithPromo
        return {
          finalPrice: priceWithPromo,
          originalPrice: basePrice,
          appliedPromotion: promotion,
          appliedSpecialPrice: null,
          breakdown
        }
      } else if (lowestPrice === priceWithSpecial && specialPrice) {
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = priceWithSpecial
        breakdown.finalPrice = priceWithSpecial
        breakdown.savings = basePrice - priceWithSpecial
        return {
          finalPrice: priceWithSpecial,
          originalPrice: basePrice,
          appliedPromotion: null,
          appliedSpecialPrice: specialPrice,
          breakdown
        }
      }
      break

    case 'STACK_DISCOUNTS':
      let finalPrice = basePrice

      if (promotion) {
        finalPrice = finalPrice * (1 - promotion.discountPercentage / 100)
        breakdown.promotionApplied = true
        breakdown.promotionDiscount = promotion.discountPercentage
      }

      if (specialPrice) {
        const specialPriceValue = parseFloat(specialPrice.pricesEuro)
        const specialDiscount =
          (basePrice - specialPriceValue) / basePrice
        finalPrice = finalPrice * (1 - specialDiscount)
        breakdown.specialPriceApplied = true
        breakdown.specialPriceValue = specialPriceValue
      }

      breakdown.finalPrice = finalPrice
      breakdown.savings = basePrice - finalPrice

      return {
        finalPrice,
        originalPrice: basePrice,
        appliedPromotion: promotion,
        appliedSpecialPrice: specialPrice,
        breakdown
      }
  }

  // Pas de réduction appliquée
  return {
    finalPrice: basePrice,
    originalPrice: basePrice,
    appliedPromotion: null,
    appliedSpecialPrice: null,
    breakdown
  }
}

/**
 * Calculer le prix final d'un produit avec promotions et prix spéciaux
 */
export async function calculateFinalPrice(
  productId: string,
  userManagerId: string,
  date: Date = new Date()
): Promise<FinalPriceResult> {
  // 1. Récupérer le produit
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      basePrice: true
    }
  })

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  const basePrice = parseFloat(product.basePrice)

  // 2. Récupérer la promotion active
  const promotion = await getActivePromotionForProduct(productId, date)

  // 3. Récupérer le prix spécial actif
  const specialPrice = await getActiveSpecialPrice(productId, date)

  // 4. Récupérer les paramètres de tarification de l'hôte
  const settings = await getHostPricingSettings(userManagerId)

  // 5. Appliquer la logique de tarification
  return applyPricingLogic(
    basePrice,
    promotion,
    specialPrice,
    settings.promotionPriority
  )
}

/**
 * Récupérer les produits avec promotions actives
 */
export async function getProductsWithActivePromotions(filters?: {
  typeId?: string
  minDiscount?: number
  sortBy?: 'discount' | 'endDate' | 'price'
  limit?: number
  offset?: number
}) {
  const now = new Date()

  const where = {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
    ...(filters?.minDiscount && {
      discountPercentage: { gte: filters.minDiscount }
    }),
    ...(filters?.typeId && {
      product: {
        typeId: filters.typeId
      }
    })
  }

  const orderBy = (() => {
    switch (filters?.sortBy) {
      case 'discount':
        return { discountPercentage: 'desc' as const }
      case 'endDate':
        return { endDate: 'asc' as const }
      case 'price':
        return { product: { basePrice: 'asc' as const } }
      default:
        return { discountPercentage: 'desc' as const }
    }
  })()

  const promotions = await prisma.productPromotion.findMany({
    where,
    orderBy,
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
    include: {
      product: {
        include: {
          img: {
            take: 1
          },
          reviews: {
            where: { approved: true }
          },
          type: true
        }
      }
    }
  })

  return promotions
}
