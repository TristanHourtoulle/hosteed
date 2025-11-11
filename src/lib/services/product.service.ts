// TODO: refactor this file because it's larger than 200 lines
'use server'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { findAllUserByRoles } from '@/lib/services/user.service'
import { createValidationHistory } from '@/lib/services/validation.service'
import { ProductValidation } from '@prisma/client'
import { CreateProductInput } from '@/lib/interface/userInterface'
import { invalidateProductCache } from '@/lib/cache/invalidation'
import { create as createHotel, findHotelByManagerId } from '@/lib/services/hotel.service'
import { createSpecialPrices } from '@/lib/services/specialPrices.service'

// Interface pour les données SEO
export interface SEOData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

// Générer un slug à partir du nom du produit
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-+/g, '-') // Tirets multiples → simple
    .replace(/^-|-$/g, '') // Supprimer tirets début/fin
}

// Assurer l'unicité du slug
async function ensureUniqueSlug(baseSlug: string, excludeProductId?: string): Promise<string> {
  let uniqueSlug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: uniqueSlug,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
    })

    if (!existing) break

    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }

  return uniqueSlug
}

// Interfaces pour typer les prix spéciaux
interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: string[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
  productId: string
}

interface ProductWithSpecialPrice {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  originalBasePrice?: string
  specialPriceApplied?: boolean
  specialPriceInfo?: {
    id: string
    pricesEuro: string
    day: string[]
    startDate: Date | null
    endDate: Date | null
  }
  [key: string]: unknown // Pour les autres propriétés du produit
}

// Fonction utilitaire pour filtrer les prix spéciaux par dates et jour
function filterActiveSpecialPrices(specialPrices: SpecialPrice[], currentDate: Date = new Date()) {
  const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }) // Ex: "Monday", "Tuesday", etc.

  return specialPrices.filter(sp => {
    // Vérifier si le prix spécial est activé
    if (!sp.activate) return false

    // Vérifier si le jour actuel est dans la liste des jours du prix spécial
    if (!sp.day || !sp.day.includes(currentDay)) return false

    // Si pas de dates définies, inclure le prix spécial
    if (!sp.startDate && !sp.endDate) return true

    // Vérifier si la date actuelle est dans la plage
    const startDate = sp.startDate ? new Date(sp.startDate) : null
    const endDate = sp.endDate ? new Date(sp.endDate) : null

    if (startDate && endDate) {
      return currentDate >= startDate && currentDate <= endDate
    } else if (startDate) {
      return currentDate >= startDate
    } else if (endDate) {
      return currentDate <= endDate
    }

    return true
  })
}

// Fonction pour récupérer les prix spéciaux d'un produit avec Prisma ORM
async function getSpecialPricesForProduct(productId: string) {
  try {
    const specialPrices = await prisma.specialPrices.findMany({
      where: {
        productId: productId,
      },
    })
    return specialPrices
  } catch (error) {
    console.error('Erreur lors de la récupération des prix spéciaux:', error)
    return []
  }
}

// Fonction pour appliquer le prix spécial au produit
function applySpecialPriceToProduct(
  product: ProductWithSpecialPrice,
  specialPrices: SpecialPrice[]
) {
  if (!specialPrices || specialPrices.length === 0) {
    return product
  }

  // Prendre le premier prix spécial valide (on pourrait aussi prendre le plus récent ou le plus avantageux)
  const activeSpecialPrice = specialPrices[0]

  if (activeSpecialPrice && activeSpecialPrice.pricesEuro) {
    // Remplacer le basePrice par le prix spécial en euros
    return {
      ...product,
      basePrice: activeSpecialPrice.pricesEuro,
      originalBasePrice: product.basePrice, // Garder une référence au prix original
      specialPriceApplied: true,
      specialPriceInfo: {
        pricesMga: activeSpecialPrice.pricesMga,
        pricesEuro: activeSpecialPrice.pricesEuro,
        day: activeSpecialPrice.day,
        startDate: activeSpecialPrice.startDate,
        endDate: activeSpecialPrice.endDate,
      },
    }
  }

  return product
}

export async function findProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        img: {
          take: 10, // ✅ Limite les images à 10 au lieu de TOUTES
        },
        type: true,
        equipments: {
          take: 20, // ✅ Limite les équipements
        },
        servicesList: {
          take: 20, // ✅ Limite les services
        },
        mealsList: {
          take: 10, // ✅ Limite les repas
        },
        options: {
          take: 10, // ✅ Limite les options
        },
        rents: {
          take: 5, // ✅ Limite les réservations récentes
          orderBy: { id: 'desc' },
        },
        discount: {
          take: 5, // ✅ Limite les réductions
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        securities: {
          take: 10, // ✅ Limite les éléments de sécurité
        },
        includedServices: {
          take: 15, // ✅ Limite les services inclus
        },
        extras: {
          take: 15, // ✅ Limite les extras
        },
        highlights: {
          take: 10, // ✅ Limite les points forts
        },
        hotel: true, // Inclure les informations hôtel
        rules: true, // Inclure les règles
        nearbyPlaces: {
          take: 10, // ✅ Limite les lieux à proximité
        },
        transportOptions: {
          take: 10, // ✅ Limite les options de transport
        },
        propertyInfo: true, // Inclure les informations de propriété
        // specialPrices: true, // Temporairement désactivé car le modèle n'est pas généré
        promotions: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          select: {
            id: true,
            discountPercentage: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        reviews: {
          where: {
            approved: true,
          },
          take: 10, // ✅ Limite les avis à 10 au lieu de TOUS
          select: {
            id: true,
            title: true,
            text: true,
            grade: true,
            welcomeGrade: true,
            staff: true,
            comfort: true,
            equipment: true,
            cleaning: true,
            visitDate: true,
            publishDate: true,
            approved: true,
          },
        },
      },
    })
    if (product) {
      // Récupérer et filtrer les prix spéciaux activés et dans les dates actuelles
      const specialPrices = await getSpecialPricesForProduct(product.id)
      const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)

      // Appliquer le prix spécial au produit si applicable
      const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

      // Ajouter les prix spéciaux filtrés au produit
      return {
        ...productWithSpecialPrice,
        specialPrices: filteredSpecialPrices,
      }
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la recherche du produit:', error)
    return null
  }
}

/**
 * Find a product by slug or ID (with fallback)
 * This allows accessing products via SEO-friendly URLs while maintaining backward compatibility
 */
export async function findProductBySlugOrId(slugOrId: string) {
  try {
    // First, try to find by slug
    let product = await prisma.product.findUnique({
      where: { slug: slugOrId },
      include: {
        img: { take: 10 },
        type: true,
        equipments: { take: 20 },
        servicesList: { take: 20 },
        mealsList: { take: 10 },
        options: { take: 10 },
        rents: { take: 5, orderBy: { id: 'desc' } },
        discount: { take: 5 },
        user: { select: { name: true, email: true, image: true } },
        securities: { take: 10 },
        includedServices: { take: 15 },
        extras: { take: 15 },
        highlights: { take: 10 },
        hotel: true,
        rules: true,
        nearbyPlaces: { take: 10 },
        transportOptions: { take: 10 },
        propertyInfo: true,
        promotions: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          select: {
            id: true,
            discountPercentage: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        reviews: {
          where: { approved: true },
          take: 10,
          select: {
            id: true,
            title: true,
            text: true,
            grade: true,
            welcomeGrade: true,
            staff: true,
            comfort: true,
            equipment: true,
            cleaning: true,
            visitDate: true,
            publishDate: true,
            approved: true,
          },
        },
      },
    })

    // If not found by slug, try by ID (fallback for old URLs)
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: slugOrId },
        include: {
          img: { take: 10 },
          type: true,
          equipments: { take: 20 },
          servicesList: { take: 20 },
          mealsList: { take: 10 },
          options: { take: 10 },
          rents: { take: 5, orderBy: { id: 'desc' } },
          discount: { take: 5 },
          user: { select: { name: true, email: true, image: true } },
          securities: { take: 10 },
          includedServices: { take: 15 },
          extras: { take: 15 },
          highlights: { take: 10 },
          hotel: true,
          rules: true,
          nearbyPlaces: { take: 10 },
          transportOptions: { take: 10 },
          propertyInfo: true,
          promotions: {
            where: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
            select: {
              id: true,
              discountPercentage: true,
              startDate: true,
              endDate: true,
              isActive: true,
            },
          },
          reviews: {
            where: { approved: true },
            take: 10,
            select: {
              id: true,
              title: true,
              text: true,
              grade: true,
              welcomeGrade: true,
              staff: true,
              comfort: true,
              equipment: true,
              cleaning: true,
              visitDate: true,
              publishDate: true,
              approved: true,
            },
          },
        },
      })
    }

    if (product) {
      // Apply special prices
      const specialPrices = await getSpecialPricesForProduct(product.id)
      const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)
      const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

      return {
        ...productWithSpecialPrice,
        specialPrices: filteredSpecialPrices,
      }
    }

    return null
  } catch (error) {
    console.error('Erreur lors de la recherche du produit par slug ou ID:', error)
    return null
  }
}

// Legacy function - use findAllProductsPaginated instead
export async function findAllProducts() {
  return findAllProductsPaginated({
    page: 1,
    limit: 50,
    imageMode: 'medium', // Max 5 images for better performance
  })
}

// Optimized function for public API endpoints (homepage, search, etc.)
export async function findAllProductsForPublic({
  page = 1,
  limit = 20,
  includeSpecialPrices = false,
}: {
  page?: number
  limit?: number
  includeSpecialPrices?: boolean
} = {}) {
  return findAllProductsPaginated({
    page,
    limit,
    includeSpecialPrices,
    imageMode: 'medium', // CRITICAL: Only 5 images per product for public views
    includeLightweight: false,
  })
}

export async function findAllProductsPaginated({
  page = 1,
  limit = 20,
  includeSpecialPrices = false,
  includeLightweight = false,
  imageMode = 'medium', // 'lightweight' (1 image), 'medium' (5 images), 'full' (all images)
}: {
  page?: number
  limit?: number
  includeSpecialPrices?: boolean
  includeLightweight?: boolean
  imageMode?: 'lightweight' | 'medium' | 'full'
} = {}) {
  try {
    const skip = (page - 1) * limit

    // Lightweight includes for admin lists - CRITICAL: Only 1 image for performance
    const lightweightIncludes = {
      img: {
        take: 1, // Only first image for list views
        select: {
          id: true,
          img: true,
        },
      },
      type: {
        select: { name: true, id: true },
      },
      equipments: false,
      securities: false,
      servicesList: false,
      mealsList: false,
      options: false,
      reviews: false,
      PromotedProduct: false,
    }

    // Medium includes for public lists - Max 5 images
    const mediumIncludes = {
      img: {
        take: 5, // Maximum 5 images for public product lists
        select: {
          id: true,
          img: true,
        },
      },
      type: {
        select: { name: true, id: true },
      },
      equipments: false,
      securities: false,
      servicesList: false,
      mealsList: false,
      options: false,
      reviews: false,
      PromotedProduct: false,
    }

    // Full includes for detailed views
    const fullIncludes = {
      img: true,
      type: true,
      equipments: true,
      securities: true,
      servicesList: true,
      mealsList: true,
      options: true,
      reviews: {
        where: {
          approved: true,
        },
        select: {
          grade: true,
          welcomeGrade: true,
          staff: true,
          comfort: true,
          equipment: true,
          cleaning: true,
        },
      },
      PromotedProduct: {
        where: {
          active: true,
          start: {
            lte: new Date(),
          },
          end: {
            gte: new Date(),
          },
        },
      },
    }

    // Choose includes based on imageMode and lightweightFlag
    let selectedIncludes
    if (includeLightweight || imageMode === 'lightweight') {
      selectedIncludes = lightweightIncludes
    } else if (imageMode === 'medium') {
      selectedIncludes = mediumIncludes
    } else {
      selectedIncludes = fullIncludes
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: {
          validate: {
            in: [ProductValidation.Approve, ProductValidation.ModificationPending],
          },
          isDraft: false,
        },
        include: selectedIncludes,
        skip,
        take: limit,
        orderBy: { id: 'desc' }, // Latest first
      }),
      prisma.product.count({
        where: {
          validate: {
            in: [ProductValidation.Approve, ProductValidation.ModificationPending],
          },
          isDraft: false,
        },
      }),
    ])

    // Only process special prices if requested and not lightweight
    let productsWithSpecialPrices = products
    if (includeSpecialPrices && !includeLightweight) {
      // Optimize: Get all special prices in one query
      const productIds = products.map(p => p.id)
      const allSpecialPrices = await prisma.specialPrices.findMany({
        where: {
          productId: { in: productIds },
          activate: true,
        },
      })

      // Group by productId for efficient lookup
      const specialPricesByProduct = allSpecialPrices.reduce(
        (acc, sp) => {
          if (!acc[sp.productId]) acc[sp.productId] = []
          acc[sp.productId].push(sp)
          return acc
        },
        {} as Record<string, typeof allSpecialPrices>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productsWithSpecialPrices = (products as any[]).map((product: any) => {
        const specialPrices = specialPricesByProduct[product.id] || []
        const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)
        const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

        return {
          ...productWithSpecialPrice,
          specialPrices: filteredSpecialPrices,
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    }

    return {
      products: productsWithSpecialPrices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    }
  } catch (error) {
    console.error('Erreur lors de la recherche des produits:', error)
    return null
  }
}

// Legacy function - use findAllProductByHostIdPaginated instead
export async function findAllProductByHostId(id: string) {
  const result = await findAllProductByHostIdPaginated(id, { page: 1, limit: 100 })
  return result?.products || null
}

export async function findAllProductByHostIdPaginated(
  hostId: string,
  {
    page = 1,
    limit = 20,
    includeSpecialPrices = false,
    includeLightweight = false,
    imageMode = 'medium',
  }: {
    page?: number
    limit?: number
    includeSpecialPrices?: boolean
    includeLightweight?: boolean
    imageMode?: 'lightweight' | 'medium' | 'full'
  } = {}
) {
  try {
    const skip = (page - 1) * limit

    const lightweightIncludes = {
      img: {
        take: 1, // Only 1 image for lightweight mode
        select: { id: true, img: true },
      },
      type: {
        select: { name: true, id: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      promotions: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: {
          id: true,
          discountPercentage: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
    }

    const mediumIncludes = {
      img: {
        take: 5, // Max 5 images for host dashboard
        select: { id: true, img: true },
      },
      type: {
        select: { name: true, id: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      promotions: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: {
          id: true,
          discountPercentage: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
    }

    const fullIncludes = {
      img: true, // All images only for individual product views
      type: true,
      equipments: true,
      securities: true,
      servicesList: true,
      mealsList: true,
      options: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      promotions: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: {
          id: true,
          discountPercentage: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: {
          user: {
            some: {
              id: {
                equals: hostId,
              },
            },
          },
          isDraft: false,
        },
        include:
          includeLightweight || imageMode === 'lightweight'
            ? lightweightIncludes
            : imageMode === 'medium'
              ? mediumIncludes
              : fullIncludes,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      prisma.product.count({
        where: {
          user: {
            some: {
              id: {
                equals: hostId,
              },
            },
          },
          isDraft: false,
        },
      }),
    ])

    let productsWithSpecialPrices = products
    if (includeSpecialPrices && !includeLightweight) {
      // Optimize special prices fetching
      const productIds = products.map(p => p.id)
      const allSpecialPrices = await prisma.specialPrices.findMany({
        where: {
          productId: { in: productIds },
          activate: true,
        },
      })

      const specialPricesByProduct = allSpecialPrices.reduce(
        (acc, sp) => {
          if (!acc[sp.productId]) acc[sp.productId] = []
          acc[sp.productId].push(sp)
          return acc
        },
        {} as Record<string, typeof allSpecialPrices>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productsWithSpecialPrices = (products as any[]).map((product: any) => {
        const specialPrices = specialPricesByProduct[product.id] || []
        const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)
        const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

        return {
          ...productWithSpecialPrice,
          specialPrices: filteredSpecialPrices,
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    }

    return {
      products: productsWithSpecialPrices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    }
  } catch (error) {
    console.error("Erreur lors de la recherche des produits de l'hôte:", error)
    return null
  }
}

export async function createProduct(data: CreateProductInput) {
  try {
    // Log des données reçues pour debug
    console.log('=== CreateProduct Debug ===')
    console.log('Data received:', JSON.stringify(data, null, 2))

    // Validation des données essentielles
    if (!data.name || !data.description || !data.address || !data.typeId) {
      throw new Error('Champs obligatoires manquants: name, description, address, ou typeId')
    }

    if (!data.basePrice || !data.priceMGA) {
      throw new Error('Prix obligatoires manquants: basePrice ou priceMGA')
    }

    if (isNaN(Number(data.arriving)) || isNaN(Number(data.leaving))) {
      throw new Error("Heures d'arrivée et de départ invalides")
    }

    if (!data.userId || data.userId.length === 0) {
      throw new Error('Aucun utilisateur assigné au produit')
    }

    // Validate that related entities exist before connecting
    const [
      existingEquipments,
      existingServices,
      existingMeals,
      existingSecurities,
      existingIncludedServices,
      existingExtras,
      existingHighlights,
    ] = await Promise.all([
      prisma.equipment.findMany({ where: { id: { in: data.equipments } }, select: { id: true } }),
      prisma.services.findMany({ where: { id: { in: data.services } }, select: { id: true } }),
      prisma.meals.findMany({ where: { id: { in: data.meals } }, select: { id: true } }),
      prisma.security.findMany({ where: { id: { in: data.securities } }, select: { id: true } }),
      data.includedServices && data.includedServices.length > 0
        ? prisma.includedService.findMany({
            where: { id: { in: data.includedServices } },
            select: { id: true },
          })
        : Promise.resolve([]),
      data.extras && data.extras.length > 0
        ? prisma.productExtra.findMany({ where: { id: { in: data.extras } }, select: { id: true } })
        : Promise.resolve([]),
      data.highlights && data.highlights.length > 0
        ? prisma.propertyHighlight.findMany({
            where: { id: { in: data.highlights } },
            select: { id: true },
          })
        : Promise.resolve([]),
    ])

    // Extract valid IDs
    const validEquipmentIds = existingEquipments.map(e => e.id)
    const validServiceIds = existingServices.map(s => s.id)
    const validMealIds = existingMeals.map(m => m.id)
    const validSecurityIds = existingSecurities.map(s => s.id)
    const validIncludedServiceIds = existingIncludedServices.map(s => s.id)
    const validExtraIds = existingExtras.map(e => e.id)
    const validHighlightIds = existingHighlights.map(h => h.id)

    // Log warnings for invalid IDs
    const invalidEquipments = data.equipments.filter(id => !validEquipmentIds.includes(id))
    const invalidServices = data.services.filter(id => !validServiceIds.includes(id))
    const invalidMeals = data.meals.filter(id => !validMealIds.includes(id))
    const invalidSecurities = data.securities.filter(id => !validSecurityIds.includes(id))

    if (invalidEquipments.length > 0) console.warn('Invalid equipment IDs:', invalidEquipments)
    if (invalidServices.length > 0) console.warn('Invalid service IDs:', invalidServices)
    if (invalidMeals.length > 0) console.warn('Invalid meal IDs:', invalidMeals)
    if (invalidSecurities.length > 0) console.warn('Invalid security IDs:', invalidSecurities)

    // Générer le slug si des données SEO sont fournies
    let slug: string | null = null
    if (data.seoData?.slug || data.seoData?.metaTitle) {
      const baseSlug =
        data.seoData.slug || generateSlugFromName(data.seoData.metaTitle || data.name)
      slug = await ensureUniqueSlug(baseSlug)
    }

    // Créer d'abord le produit de base
    const createdProduct = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        completeAddress: data.completeAddress || null,
        longitude: Number(data.longitude),
        latitude: Number(data.latitude),
        basePrice: data.basePrice,
        priceMGA: data.priceMGA,
        room: data.room ? BigInt(data.room) : null,
        bathroom: data.bathroom ? BigInt(data.bathroom) : null,
        surface: data.surface ? BigInt(data.surface) : null,
        arriving: Number(data.arriving),
        leaving: Number(data.leaving),
        autoAccept: data.autoAccept || false,
        accessibility: data.accessibility || false,
        petFriendly: data.petFriendly || false,
        phone: data.phone || '',
        phoneCountry: data.phoneCountry || 'MG',
        proximityLandmarks: data.proximityLandmarks || [],
        minPeople: data.minPeople ? BigInt(data.minPeople) : null,
        maxPeople: data.maxPeople ? BigInt(data.maxPeople) : null,
        categories: BigInt(0),
        validate: ProductValidation.NotVerified,
        userManager: BigInt(0),
        // Gestion du nombre de chambres disponibles pour les hôtels
        availableRooms: data.hotelInfo ? data.hotelInfo.availableRooms : null,
        // Champs SEO
        metaTitle: data.seoData?.metaTitle || null,
        metaDescription: data.seoData?.metaDescription || null,
        keywords: data.seoData?.keywords || null,
        slug: slug,
        type: { connect: { id: data.typeId } },
        ownerId: Array.isArray(data.userId) ? data.userId[0] : data.userId,
        equipments: {
          connect: validEquipmentIds.map(equipmentId => ({ id: equipmentId })),
        },
        servicesList: {
          connect: validServiceIds.map(serviceId => ({ id: serviceId })),
        },
        mealsList: {
          connect: validMealIds.map(mealId => ({ id: mealId })),
        },
        securities: {
          connect: validSecurityIds.map(securityId => ({ id: securityId })),
        },
        includedServices: {
          connect: validIncludedServiceIds.map(serviceId => ({ id: serviceId })),
        },
        extras: {
          connect: validExtraIds.map(extraId => ({ id: extraId })),
        },
        highlights: {
          connect: validHighlightIds.map(highlightId => ({ id: highlightId })),
        },
        img: {
          create: data.images.map(img => ({ img })),
        },
      },
    })

    // Ensuite, mettre à jour avec les relations supplémentaires
    if (data.nearbyPlaces && data.nearbyPlaces.length > 0) {
      for (const place of data.nearbyPlaces) {
        await prisma.product.update({
          where: { id: createdProduct.id },
          data: {
            nearbyPlaces: {
              create: {
                name: place.name,
                distance: Number(place.distance),
                duration: Number(place.duration),
                transport: place.transport,
              },
            },
          },
        })
      }
    }

    if (data.transportOptions && data.transportOptions.length > 0) {
      for (const option of data.transportOptions) {
        await prisma.product.update({
          where: { id: createdProduct.id },
          data: {
            transportOptions: {
              create: {
                name: option.name,
                description: option.description || '',
              },
            },
          },
        })
      }
    }

    if (data.propertyInfo) {
      await prisma.product.update({
        where: { id: createdProduct.id },
        data: {
          propertyInfo: {
            create: {
              hasStairs: Boolean(data.propertyInfo.hasStairs),
              hasElevator: Boolean(data.propertyInfo.hasElevator),
              hasHandicapAccess: Boolean(data.propertyInfo.hasHandicapAccess),
              hasPetsOnProperty: Boolean(data.propertyInfo.hasPetsOnProperty),
              additionalNotes: data.propertyInfo.additionalNotes || '',
            },
          },
        },
      })
    }

    // TODO: Ajouter le modèle CancellationPolicy au schéma Prisma
    /*
    if (data.cancellationPolicy) {
      await prisma.product.update({
        where: { id: createdProduct.id },
        data: {
          cancellationPolicy: {
            create: {
              freeCancellationHours: Number(data.cancellationPolicy.freeCancellationHours),
              partialRefundPercent: Number(data.cancellationPolicy.partialRefundPercent),
              additionalTerms: data.cancellationPolicy.additionalTerms || '',
            },
          },
        },
      })
    }
    */

    // Créer les prix spéciaux si fournis
    console.log('=== Special Prices Debug ===')
    console.log('data.specialPrices:', data.specialPrices)
    console.log('data.specialPrices length:', data.specialPrices?.length)

    if (data.specialPrices && data.specialPrices.length > 0) {
      console.log('Creating special prices...')
      for (const specialPrice of data.specialPrices) {
        console.log('Creating special price:', specialPrice)
        try {
          // Utiliser la fonction createSpecialPrices du service
          const result = await createSpecialPrices(
            specialPrice.pricesMga,
            specialPrice.pricesEuro,
            specialPrice.day,
            specialPrice.startDate,
            specialPrice.endDate,
            specialPrice.activate,
            createdProduct.id
          )
          console.log('Special price created successfully:', result)
        } catch (error) {
          console.error('Error creating special price:', error)
        }
      }
    } else {
      console.log('No special prices to create')
    }

    // Créer automatiquement les règles avec les heures converties en format string
    const formatHour = (hour: number | string): string => {
      const hourNumber = typeof hour === 'string' ? parseInt(hour, 10) : hour
      return `${hourNumber.toString().padStart(2, '0')}:00`
    }

    await prisma.rules.create({
      data: {
        productId: createdProduct.id,
        checkInTime: formatHour(data.arriving),
        checkOutTime: formatHour(data.leaving),
        smokingAllowed: false,
        petsAllowed: false,
        eventsAllowed: false,
        selfCheckIn: false,
      },
    })

    // Gestion spécifique aux hôtels
    if (data.isHotel && data.hotelInfo) {
      try {
        // Vérifier si l'utilisateur a déjà un hôtel avec ce nom
        const managerId = data.userId[0] // Premier utilisateur comme manager
        const existingHotels = await findHotelByManagerId({ id: managerId })

        let hotelId: string | null = null

        if (existingHotels && Array.isArray(existingHotels)) {
          // Chercher un hôtel existant avec le même nom
          const existingHotel = existingHotels.find(
            hotel => hotel.name.toLowerCase() === data.hotelInfo!.name.toLowerCase()
          )

          if (existingHotel) {
            hotelId = existingHotel.id
            console.log(`Hôtel existant trouvé: ${existingHotel.name} (ID: ${hotelId})`)
          }
        }

        // Si aucun hôtel existant, en créer un nouveau
        if (!hotelId) {
          const newHotel = await createHotel({
            name: data.hotelInfo.name,
            number: data.phone || '', // Utiliser le téléphone ou string vide
            adress: data.address,
            manager: managerId,
          })

          if (newHotel && typeof newHotel === 'object' && 'id' in newHotel) {
            hotelId = newHotel.id
            console.log(`Nouvel hôtel créé: ${data.hotelInfo.name} (ID: ${hotelId})`)
          }
        }

        // Associer le produit (chambre) à l'hôtel
        if (hotelId) {
          await prisma.product.update({
            where: { id: createdProduct.id },
            data: {
              hotel: {
                connect: { id: hotelId },
              },
            },
          })
          console.log(`Produit associé à l'hôtel: ${hotelId}`)
        }
      } catch (hotelError) {
        console.error("Erreur lors de la gestion de l'hôtel:", hotelError)
        // Ne pas faire échouer la création du produit pour un problème d'hôtel
      }
    }

    // Récupérer le produit avec toutes ses relations
    const finalProduct = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        img: true,
        type: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        options: true,
        nearbyPlaces: true,
        transportOptions: true,
        propertyInfo: true,
        // cancellationPolicy: true, // TODO: Ajouter quand le modèle sera créé
      },
    })

    // Envoyer les emails aux administrateurs (non bloquant)
    try {
      const admin = await findAllUserByRoles('ADMIN')
      if (admin && admin.length > 0) {
        // Utiliser Promise.all pour gérer correctement les promesses
        const emailPromises = admin.map(async user => {
          try {
            await sendTemplatedMail(
              user.email,
              'Une nouvelle annonce est en attente de validation',
              'annonce-postee.html',
              {
                name: user.name || 'Administrateur',
                productName: data.name,
                annonceUrl: process.env.NEXTAUTH_URL + '/host/' + createdProduct.id,
              }
            )
          } catch (emailError) {
            console.error('Erreur envoi email admin:', emailError)
            // Ne pas faire échouer la création du produit pour un problème d'email
          }
        })

        // Envoi asynchrone sans attendre la fin pour ne pas bloquer
        Promise.allSettled(emailPromises).catch(error => {
          console.error("Erreur lors de l'envoi des emails:", error)
        })
      }
    } catch (adminError) {
      console.error('Erreur lors de la récupération des admins:', adminError)
      // Ne pas faire échouer la création du produit
    }

    // Invalider le cache après création
    await invalidateProductCache()

    return finalProduct
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

export async function findProductByValidation(validationStatus: ProductValidation) {
  try {
    const request = await prisma.product.findMany({
      where: {
        validate: validationStatus,
      },
      include: {
        img: true,
        user: true,
      },
    })
    if (!request) return null
    return request
  } catch (e) {
    console.error('Erreur lors de la recherche des produits:', e)
    return null
  }
}

export async function validateProduct(id: string) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { validate: ProductValidation.Approve },
      include: {
        user: true,
        img: true,
      },
    })
    if (product) {
      if (!product.user || !Array.isArray(product.user)) {
        console.error('Les utilisateurs du produit ne sont pas disponibles')
        return null
      }
      product.user.map(async user => {
        await sendTemplatedMail(
          user.email,
          'Votre annonce a été validée',
          'annonce-approved.html',
          {
            name: user.name || '',
            productName: product.name,
            annonceUrl: process.env.NEXTAUTH_URL + '/host/' + product.id,
          }
        )
      })
    }

    // Invalider le cache après validation
    await invalidateProductCache(id)

    return product
  } catch (error) {
    console.error('Erreur lors de la validation du produit:', error)
    return null
  }
}

export async function rejectProduct(id: string) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { validate: ProductValidation.Refused },
      include: {
        user: true,
      },
    })

    if (product) {
      if (!product.user || !Array.isArray(product.user)) {
        console.error('Les utilisateurs du produit ne sont pas disponibles')
        return null
      }
      product.user.map(async user => {
        await sendTemplatedMail(
          user.email,
          'Votre annonce a été rejetée',
          'annonce-rejected.html',
          {
            productName: product.name,
          }
        )
      })
    }

    // Invalider le cache après rejet
    await invalidateProductCache(id)

    return product
  } catch (error) {
    console.error('Erreur lors du rejet du produit:', error)
    return null
  }
}

export async function deleteRejectedProduct(id: string) {
  try {
    // Récupérer le produit avec ses utilisateurs avant suppression
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!product) {
      throw new Error('Produit non trouvé')
    }

    if (product.validate !== ProductValidation.Refused) {
      throw new Error('Seuls les produits rejetés peuvent être supprimés')
    }

    // Supprimer le produit (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
    await prisma.product.delete({
      where: { id },
    })

    // Invalider le cache après suppression
    await invalidateProductCache(id)

    return { success: true, productName: product.name, userEmails: product.user.map(u => u.email) }
  } catch (error) {
    console.error('Erreur lors de la suppression du produit rejeté:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

export async function deleteMultipleRejectedProducts(ids: string[]) {
  try {
    // Récupérer tous les produits avec leurs utilisateurs avant suppression
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        validate: ProductValidation.Refused, // Sécurité supplémentaire
      },
      include: {
        user: true,
      },
    })

    if (products.length === 0) {
      throw new Error('Aucun produit rejeté trouvé')
    }

    // Vérifier que tous les produits sont bien rejetés
    const nonRejectedProducts = products.filter(p => p.validate !== ProductValidation.Refused)
    if (nonRejectedProducts.length > 0) {
      throw new Error('Certains produits ne sont pas rejetés et ne peuvent pas être supprimés')
    }

    // Supprimer tous les produits en une seule transaction
    const deletedCount = await prisma.product.deleteMany({
      where: { id: { in: products.map(p => p.id) } },
    })

    // Invalider le cache pour tous les produits
    const cachePromises = products.map(p => invalidateProductCache(p.id))
    await Promise.allSettled(cachePromises)

    return {
      success: true,
      deletedCount: deletedCount.count,
      productNames: products.map(p => p.name),
      userEmails: [...new Set(products.flatMap(p => p.user.map(u => u.email)))], // Emails uniques
    }
  } catch (error) {
    console.error('Erreur lors de la suppression en masse:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

export async function resubmitProductWithChange(
  id: string,
  params: {
    name: string
    description: string
    address: string
    longitude: number
    latitude: number
    basePrice: string
    room: number | null
    bathroom: number | null
    arriving: number
    leaving: number
    typeId: string
    securities: string[]
    equipments: string[]
    services: string[]
    meals: string[]
    images: string[]
  },
  hostId?: string
) {
  try {
    // Récupérer le statut actuel avant la mise à jour
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { validate: true },
    })

    // Déterminer le nouveau statut
    let newValidationStatus: ProductValidation
    if (currentProduct?.validate === ProductValidation.RecheckRequest) {
      // Si une révision était demandée et que l'hôte fait des modifications,
      // le statut passe à "En attente" pour signaler à l'admin qu'il y a du nouveau travail
      newValidationStatus = ProductValidation.NotVerified
    } else {
      // Pour les autres cas, garder la logique actuelle
      newValidationStatus = ProductValidation.RecheckRequest
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: params.name,
        description: params.description,
        address: params.address,
        longitude: params.longitude,
        latitude: params.latitude,
        basePrice: params.basePrice,
        room: params.room ? BigInt(params.room) : null,
        bathroom: params.bathroom ? BigInt(params.bathroom) : null,
        arriving: params.arriving,
        leaving: params.leaving,
        validate: newValidationStatus,
        type: { connect: { id: params.typeId } },
        equipments: {
          set: params.equipments.map(equipmentId => ({ id: equipmentId })),
        },
        servicesList: {
          set: params.services.map(serviceId => ({ id: serviceId })),
        },
        mealsList: {
          set: params.meals.map(mealId => ({ id: mealId })),
        },
        securities: {
          set: params.securities.map(securityId => ({ id: securityId })),
        },
        img: {
          deleteMany: {},
          create: params.images.map(img => ({ img })),
        },
      },
      include: {
        img: true,
        type: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        options: true,
        user: true,
      },
    })

    if (updatedProduct && currentProduct) {
      // Créer un historique de validation
      if (hostId) {
        const reason =
          currentProduct.validate === ProductValidation.RecheckRequest
            ? "Modifications apportées par l'hôte suite à une demande de révision"
            : "Produit modifié par l'hôte"

        await createValidationHistory({
          productId: id,
          previousStatus: currentProduct.validate,
          newStatus: newValidationStatus,
          hostId: hostId,
          reason: reason,
          changes: {
            name: params.name,
            description: params.description,
            address: params.address,
            basePrice: params.basePrice,
            modifiedAt: new Date().toISOString(),
          },
        })
      }

      // Notifier les administrateurs
      const admin = await findAllUserByRoles('ADMIN')
      if (admin && admin.length > 0) {
        const emailPromises = admin.map(async user => {
          try {
            await sendTemplatedMail(
              user.email,
              'Une annonce a été modifiée et nécessite une nouvelle validation',
              'annonce-modifiee.html',
              {
                name: user.name || 'Administrateur',
                productName: params.name,
                annonceUrl: process.env.NEXTAUTH_URL + '/admin/validation/' + updatedProduct.id,
              }
            )
          } catch (emailError) {
            console.error('Erreur envoi email admin modification:', emailError)
          }
        })

        // Envoi asynchrone sans attendre
        Promise.allSettled(emailPromises).catch(error => {
          console.error("Erreur lors de l'envoi des emails de modification:", error)
        })
      }
    }

    return updatedProduct
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    return null
  }
}

// Create a draft copy of an approved product for modification
export async function createDraftProduct(originalProductId: string) {
  try {
    // Get the original product with all relationships
    const originalProduct = await prisma.product.findUnique({
      where: { id: originalProductId },
      include: {
        img: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        securities: true,
        includedServices: true,
        extras: true,
        highlights: true,
        hotel: true,
        rules: true,
        nearbyPlaces: true,
        transportOptions: true,
        propertyInfo: true,
        options: true,
        typeRoom: true,
        user: true,
      },
    })

    if (!originalProduct) {
      throw new Error('Product not found')
    }

    // Create the draft product
    const draft = await prisma.product.create({
      data: {
        // Copy all basic fields
        name: originalProduct.name,
        description: originalProduct.description,
        address: originalProduct.address,
        basePrice: originalProduct.basePrice,
        priceMGA: originalProduct.priceMGA,
        room: originalProduct.room,
        bathroom: originalProduct.bathroom,
        arriving: originalProduct.arriving,
        leaving: originalProduct.leaving,
        autoAccept: originalProduct.autoAccept,
        equipement: originalProduct.equipement,
        meal: originalProduct.meal,
        services: originalProduct.services,
        security: originalProduct.security,
        minRent: originalProduct.minRent,
        maxRent: originalProduct.maxRent,
        advanceRent: originalProduct.advanceRent,
        delayTime: originalProduct.delayTime,
        categories: originalProduct.categories,
        minPeople: originalProduct.minPeople,
        maxPeople: originalProduct.maxPeople,
        commission: originalProduct.commission,
        validate: ProductValidation.NotVerified,
        userManager: originalProduct.userManager,
        typeId: originalProduct.typeId,
        phone: originalProduct.phone,
        phoneCountry: originalProduct.phoneCountry,
        latitude: originalProduct.latitude,
        longitude: originalProduct.longitude,
        certified: originalProduct.certified,
        contract: originalProduct.contract,
        sizeRoom: originalProduct.sizeRoom,
        availableRooms: originalProduct.availableRooms,

        // Mark as draft and link to original
        isDraft: true,
        originalProductId: originalProductId,

        // Copy relationships
        img: {
          create: originalProduct.img.map(img => ({ img: img.img })),
        },
        equipments: {
          connect: originalProduct.equipments.map(eq => ({ id: eq.id })),
        },
        servicesList: {
          connect: originalProduct.servicesList.map(srv => ({ id: srv.id })),
        },
        mealsList: {
          connect: originalProduct.mealsList.map(meal => ({ id: meal.id })),
        },
        securities: {
          connect: originalProduct.securities.map(sec => ({ id: sec.id })),
        },
        includedServices: {
          connect: originalProduct.includedServices.map(service => ({ id: service.id })),
        },
        extras: {
          connect: originalProduct.extras.map(extra => ({ id: extra.id })),
        },
        highlights: {
          connect: originalProduct.highlights.map(highlight => ({ id: highlight.id })),
        },
        user: {
          connect: originalProduct.user.map(u => ({ id: u.id })),
        },
        nearbyPlaces: {
          create: originalProduct.nearbyPlaces.map(place => ({
            name: place.name,
            distance: place.distance,
            duration: place.duration,
            transport: place.transport,
          })),
        },
        transportOptions: {
          create: originalProduct.transportOptions.map(transport => ({
            name: transport.name,
            description: transport.description,
          })),
        },
      },
    })

    // Update original product status to indicate a pending modification
    await prisma.product.update({
      where: { id: originalProductId },
      data: {
        validate: ProductValidation.ModificationPending,
      },
    })

    // Copy property info if exists
    if (originalProduct.propertyInfo) {
      await prisma.propertyInfo.create({
        data: {
          productId: draft.id,
          hasStairs: originalProduct.propertyInfo.hasStairs,
          hasElevator: originalProduct.propertyInfo.hasElevator,
          hasHandicapAccess: originalProduct.propertyInfo.hasHandicapAccess,
          hasPetsOnProperty: originalProduct.propertyInfo.hasPetsOnProperty,
          additionalNotes: originalProduct.propertyInfo.additionalNotes,
        },
      })
    }

    // Copy hotel info if exists
    if (originalProduct.hotel.length > 0) {
      await prisma.product.update({
        where: { id: draft.id },
        data: {
          hotel: {
            connect: originalProduct.hotel.map(hotel => ({ id: hotel.id })),
          },
        },
      })
    }

    return draft
  } catch (error) {
    console.error('Error creating draft product:', error)
    throw error
  }
}

// Apply approved draft changes to the original product
export async function applyDraftChanges(draftId: string) {
  try {
    const draft = await prisma.product.findUnique({
      where: { id: draftId, isDraft: true },
      include: {
        img: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        securities: true,
        includedServices: true,
        extras: true,
        highlights: true,
        rules: true,
        nearbyPlaces: true,
        transportOptions: true,
        propertyInfo: true,
      },
    })

    if (!draft || !draft.originalProductId) {
      throw new Error('Draft product not found')
    }

    // Update the original product with draft data
    const updatedProduct = await prisma.product.update({
      where: { id: draft.originalProductId },
      data: {
        // Update all basic fields
        name: draft.name,
        description: draft.description,
        address: draft.address,
        basePrice: draft.basePrice,
        priceMGA: draft.priceMGA,
        room: draft.room,
        bathroom: draft.bathroom,
        arriving: draft.arriving,
        leaving: draft.leaving,
        autoAccept: draft.autoAccept,
        equipement: draft.equipement,
        meal: draft.meal,
        services: draft.services,
        security: draft.security,
        minRent: draft.minRent,
        maxRent: draft.maxRent,
        advanceRent: draft.advanceRent,
        delayTime: draft.delayTime,
        categories: draft.categories,
        minPeople: draft.minPeople,
        maxPeople: draft.maxPeople,
        commission: draft.commission,
        validate: ProductValidation.Approve,
        phone: draft.phone,
        phoneCountry: draft.phoneCountry,
        latitude: draft.latitude,
        longitude: draft.longitude,
        certified: draft.certified,
        contract: draft.contract,
        sizeRoom: draft.sizeRoom,
        availableRooms: draft.availableRooms,

        // Update relationships
        img: {
          deleteMany: {},
          create: draft.img.map(img => ({ img: img.img })),
        },
        equipments: {
          set: draft.equipments.map(eq => ({ id: eq.id })),
        },
        servicesList: {
          set: draft.servicesList.map(srv => ({ id: srv.id })),
        },
        mealsList: {
          set: draft.mealsList.map(meal => ({ id: meal.id })),
        },
        securities: {
          set: draft.securities.map(sec => ({ id: sec.id })),
        },
        includedServices: {
          set: draft.includedServices.map(service => ({ id: service.id })),
        },
        extras: {
          set: draft.extras.map(extra => ({ id: extra.id })),
        },
        highlights: {
          set: draft.highlights.map(highlight => ({ id: highlight.id })),
        },
        nearbyPlaces: {
          deleteMany: {},
          create: draft.nearbyPlaces.map(place => ({
            name: place.name,
            distance: place.distance,
            duration: place.duration,
            transport: place.transport,
          })),
        },
        transportOptions: {
          deleteMany: {},
          create: draft.transportOptions.map(transport => ({
            name: transport.name,
            description: transport.description,
          })),
        },
      },
    })

    // Update property info if exists
    if (draft.propertyInfo) {
      await prisma.propertyInfo.upsert({
        where: { productId: draft.originalProductId },
        update: {
          hasStairs: draft.propertyInfo.hasStairs,
          hasElevator: draft.propertyInfo.hasElevator,
          hasHandicapAccess: draft.propertyInfo.hasHandicapAccess,
          hasPetsOnProperty: draft.propertyInfo.hasPetsOnProperty,
          additionalNotes: draft.propertyInfo.additionalNotes,
        },
        create: {
          productId: draft.originalProductId,
          hasStairs: draft.propertyInfo.hasStairs,
          hasElevator: draft.propertyInfo.hasElevator,
          hasHandicapAccess: draft.propertyInfo.hasHandicapAccess,
          hasPetsOnProperty: draft.propertyInfo.hasPetsOnProperty,
          additionalNotes: draft.propertyInfo.additionalNotes,
        },
      })
    }

    // Delete the draft product (will cascade delete related data)
    await prisma.product.delete({
      where: { id: draftId },
    })

    // Invalidate cache
    await invalidateProductCache(draft.originalProductId)

    return updatedProduct
  } catch (error) {
    console.error('Error applying draft changes:', error)
    throw error
  }
}

// Reject and delete a draft product
export async function rejectDraftChanges(draftId: string, reason: string): Promise<void> {
  try {
    const draft = await prisma.product.findUnique({
      where: { id: draftId, isDraft: true },
      include: {
        user: true,
      },
    })

    if (!draft || !draft.originalProductId) {
      throw new Error('Draft product not found')
    }

    // Update original product status back to Approve
    await prisma.product.update({
      where: { id: draft.originalProductId },
      data: {
        validate: ProductValidation.Approve,
      },
    })

    // Send rejection email to host
    if (draft.user && draft.user.length > 0) {
      const host = draft.user[0]
      try {
        await sendTemplatedMail(
          host.email,
          'Votre demande de modification a été rejetée',
          'modification-rejected.html',
          {
            name: host.name || 'Hébergeur',
            productName: draft.name,
            reason: reason,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@hosteed.com',
          }
        )
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError)
      }
    }

    // Delete the draft product (will cascade delete related data)
    await prisma.product.delete({
      where: { id: draftId },
    })
  } catch (error) {
    console.error('Error rejecting draft changes:', error)
    throw error
  }
}

// Check if a product has a pending draft
export async function hasPendingDraft(productId: string): Promise<boolean> {
  const draft = await prisma.product.findFirst({
    where: {
      originalProductId: productId,
      isDraft: true,
    },
  })
  return !!draft
}

// Get draft product for an original product
export async function getDraftProduct(originalProductId: string) {
  return await prisma.product.findFirst({
    where: {
      originalProductId: originalProductId,
      isDraft: true,
    },
  })
}

/**
 * Interface for updating a product
 */
interface UpdateProductInput {
  name?: string
  description?: string
  address?: string
  completeAddress?: string | null
  longitude?: number | string
  latitude?: number | string
  basePrice?: string
  priceMGA?: string
  room?: number | string | null
  bathroom?: number | string | null
  arriving?: number | string
  leaving?: number | string
  phone?: string
  phoneCountry?: string
  proximityLandmarks?: string[]
  maxPeople?: number | null
  typeId?: string
  equipmentIds?: string[]
  serviceIds?: string[]
  mealIds?: string[]
  securityIds?: string[]
  includedServiceIds?: string[]
  extraIds?: string[]
  highlightIds?: string[]
  nearbyPlaces?: Array<{ name: string; distance: number; duration?: number; transport?: string }>
  isHotel?: boolean
  hotelInfo?: { name: string; availableRooms: number }
  // SEO data
  seoData?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    slug?: string
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, data: UpdateProductInput) {
  try {
    // Validate that related entities exist before connecting
    const validationPromises = []

    if (data.equipmentIds) {
      validationPromises.push(
        prisma.equipment.findMany({
          where: { id: { in: data.equipmentIds } },
          select: { id: true },
        })
      )
    }

    if (data.serviceIds) {
      validationPromises.push(
        prisma.services.findMany({
          where: { id: { in: data.serviceIds } },
          select: { id: true },
        })
      )
    }

    if (data.mealIds) {
      validationPromises.push(
        prisma.meals.findMany({
          where: { id: { in: data.mealIds } },
          select: { id: true },
        })
      )
    }

    if (data.securityIds) {
      validationPromises.push(
        prisma.security.findMany({
          where: { id: { in: data.securityIds } },
          select: { id: true },
        })
      )
    }

    if (data.includedServiceIds && data.includedServiceIds.length > 0) {
      validationPromises.push(
        prisma.includedService.findMany({
          where: { id: { in: data.includedServiceIds } },
          select: { id: true },
        })
      )
    }

    if (data.extraIds && data.extraIds.length > 0) {
      validationPromises.push(
        prisma.productExtra.findMany({
          where: { id: { in: data.extraIds } },
          select: { id: true },
        })
      )
    }

    if (data.highlightIds && data.highlightIds.length > 0) {
      validationPromises.push(
        prisma.propertyHighlight.findMany({
          where: { id: { in: data.highlightIds } },
          select: { id: true },
        })
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    // Basic fields
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.address !== undefined) updateData.address = data.address
    if (data.completeAddress !== undefined)
      updateData.completeAddress = data.completeAddress || null
    if (data.longitude !== undefined) updateData.longitude = Number(data.longitude)
    if (data.latitude !== undefined) updateData.latitude = Number(data.latitude)
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice
    if (data.priceMGA !== undefined) updateData.priceMGA = data.priceMGA
    if (data.room !== undefined) updateData.room = data.room ? BigInt(data.room) : null
    if (data.bathroom !== undefined)
      updateData.bathroom = data.bathroom ? BigInt(data.bathroom) : null
    if (data.arriving !== undefined) updateData.arriving = Number(data.arriving)
    if (data.leaving !== undefined) updateData.leaving = Number(data.leaving)
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.phoneCountry !== undefined) updateData.phoneCountry = data.phoneCountry
    if (data.proximityLandmarks !== undefined)
      updateData.proximityLandmarks = data.proximityLandmarks
    if (data.maxPeople !== undefined)
      updateData.maxPeople = data.maxPeople ? BigInt(data.maxPeople) : null
    if (data.typeId !== undefined) updateData.type = { connect: { id: data.typeId } }

    // Relations - disconnect all and reconnect with new values
    if (data.equipmentIds) {
      updateData.equipments = {
        set: [], // Disconnect all
        connect: data.equipmentIds.map(id => ({ id })),
      }
    }

    if (data.serviceIds) {
      updateData.servicesList = {
        set: [],
        connect: data.serviceIds.map(id => ({ id })),
      }
    }

    if (data.mealIds) {
      updateData.mealsList = {
        set: [],
        connect: data.mealIds.map(id => ({ id })),
      }
    }

    if (data.securityIds) {
      updateData.securities = {
        set: [],
        connect: data.securityIds.map(id => ({ id })),
      }
    }

    if (data.includedServiceIds) {
      updateData.includedServices = {
        set: [],
        connect: data.includedServiceIds.map(id => ({ id })),
      }
    }

    if (data.extraIds) {
      updateData.extras = {
        set: [],
        connect: data.extraIds.map(id => ({ id })),
      }
    }

    if (data.highlightIds) {
      updateData.highlights = {
        set: [],
        connect: data.highlightIds.map(id => ({ id })),
      }
    }

    // Nearby places
    if (data.nearbyPlaces) {
      // Delete existing and create new ones
      await prisma.nearbyPlace.deleteMany({
        where: { productId },
      })

      if (data.nearbyPlaces.length > 0) {
        updateData.nearbyPlaces = {
          create: data.nearbyPlaces.map(
            (place: { name: string; distance: number; duration?: number; transport?: string }) => ({
              name: place.name,
              distance: place.distance,
              duration: place.duration || 0,
              transport: place.transport || 'voiture',
            })
          ),
        }
      }
    }

    // Hotel info - just update availableRooms on Product
    if (data.isHotel !== undefined && data.isHotel && data.hotelInfo) {
      updateData.availableRooms = data.hotelInfo.availableRooms
    }

    // SEO data
    if (data.seoData) {
      if (data.seoData.metaTitle !== undefined) {
        updateData.metaTitle = data.seoData.metaTitle || null
      }
      if (data.seoData.metaDescription !== undefined) {
        updateData.metaDescription = data.seoData.metaDescription || null
      }
      if (data.seoData.keywords !== undefined) {
        updateData.keywords = data.seoData.keywords || null
      }
      // Gérer le slug avec vérification d'unicité
      if (data.seoData.slug !== undefined) {
        const baseSlug = data.seoData.slug || ''
        if (baseSlug) {
          updateData.slug = await ensureUniqueSlug(baseSlug, productId)
        } else {
          updateData.slug = null
        }
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        img: true,
        type: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        securities: true,
        includedServices: true,
        extras: true,
        highlights: true,
        nearbyPlaces: true,
        hotel: true,
      },
    })

    // Invalidate cache
    await invalidateProductCache()

    return updatedProduct
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}
