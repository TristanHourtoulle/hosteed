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
        productId: productId
      }
    })
    return specialPrices
  } catch (error) {
    console.error('Erreur lors de la récupération des prix spéciaux:', error)
    return []
  }
}

// Fonction utilitaire pour valider la cohérence des champs de certification
function validateCertificationFields(isCertificated: boolean, certificationDate?: Date | string | null, certificatedBy?: string | null) {
  if (isCertificated) {
    if (!certificationDate || !certificatedBy) {
      throw new Error('Si isCertificated est true, certificationDate et certificatedBy sont obligatoires')
    }
  }
  return true
}

// Fonction pour appliquer le prix spécial au produit
function applySpecialPriceToProduct(product: ProductWithSpecialPrice, specialPrices: SpecialPrice[]) {
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
        endDate: activeSpecialPrice.endDate
      }
    }
  }

  return product
}

export async function findProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        img: true,
        type: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        options: true,
        rents: true,
        discount: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        securities: true,
        includedServices: true,
        extras: true,
        highlights: true,
        hotel: true, // Inclure les informations hôtel
        rules: true, // Inclure les règles
        nearbyPlaces: true, // Inclure les lieux à proximité
        transportOptions: true, // Inclure les options de transport
        propertyInfo: true, // Inclure les informations de propriété
        certificatedRelation: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // specialPrices: true, // Temporairement désactivé car le modèle n'est pas généré
        reviews: {
          where: {
            approved: true,
          },
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
        specialPrices: filteredSpecialPrices
      }
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la recherche du produit:', error)
    return null
  }
}

// Legacy function - use findAllProductsPaginated instead
export async function findAllProducts() {
  return findAllProductsPaginated({
    page: 1,
    limit: 50,
    imageMode: 'medium' // Max 5 images for better performance
  })
}

// Optimized function for public API endpoints (homepage, search, etc.)
export async function findAllProductsForPublic({
  page = 1,
  limit = 20,
  includeSpecialPrices = false
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
    includeLightweight: false
  })
}

export async function findAllProductsPaginated({
  page = 1,
  limit = 20,
  includeSpecialPrices = false,
  includeLightweight = false,
  imageMode = 'medium' // 'lightweight' (1 image), 'medium' (5 images), 'full' (all images)
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
          img: true
        }
      },
      type: {
        select: { name: true, id: true }
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
          img: true
        }
      },
      type: {
        select: { name: true, id: true }
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
        certificatedRelation: {
            select: {
                id: true,
                name: true,
                email: true,
            },
        },
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
            in: [ProductValidation.Approve, ProductValidation.ModificationPending]
          },
          isDraft: false,
        },
        include: selectedIncludes,
        skip,
        take: limit,
        orderBy: { id: 'desc' } // Latest first
      }),
      prisma.product.count({
        where: {
          validate: {
            in: [ProductValidation.Approve, ProductValidation.ModificationPending]
          },
          isDraft: false,
        }
      })
    ])

    // Only process special prices if requested and not lightweight
    let productsWithSpecialPrices = products
    if (includeSpecialPrices && !includeLightweight) {
      // Optimize: Get all special prices in one query
      const productIds = products.map(p => p.id)
      const allSpecialPrices = await prisma.specialPrices.findMany({
        where: {
          productId: { in: productIds },
          activate: true
        }
      })

      // Group by productId for efficient lookup
      const specialPricesByProduct = allSpecialPrices.reduce((acc, sp) => {
        if (!acc[sp.productId]) acc[sp.productId] = []
        acc[sp.productId].push(sp)
        return acc
      }, {} as Record<string, typeof allSpecialPrices>)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productsWithSpecialPrices = (products as any[]).map((product: any) => {
        const specialPrices = specialPricesByProduct[product.id] || []
        const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)
        const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

        return {
          ...productWithSpecialPrice,
          specialPrices: filteredSpecialPrices
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
        hasPrev: page > 1
      }
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
    imageMode = 'medium'
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
        select: { id: true, img: true }
      },
      type: {
        select: { name: true, id: true }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    }

    const mediumIncludes = {
      img: {
        take: 5, // Max 5 images for host dashboard
        select: { id: true, img: true }
      },
      type: {
        select: { name: true, id: true }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
        include: includeLightweight || imageMode === 'lightweight' ? lightweightIncludes
                : imageMode === 'medium' ? mediumIncludes
                : fullIncludes,
        skip,
        take: limit,
        orderBy: { id: 'desc' }
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
        }
      })
    ])

    let productsWithSpecialPrices = products
    if (includeSpecialPrices && !includeLightweight) {
      // Optimize special prices fetching
      const productIds = products.map(p => p.id)
      const allSpecialPrices = await prisma.specialPrices.findMany({
        where: {
          productId: { in: productIds },
          activate: true
        }
      })

      const specialPricesByProduct = allSpecialPrices.reduce((acc, sp) => {
        if (!acc[sp.productId]) acc[sp.productId] = []
        acc[sp.productId].push(sp)
        return acc
      }, {} as Record<string, typeof allSpecialPrices>)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productsWithSpecialPrices = (products as any[]).map((product: any) => {
        const specialPrices = specialPricesByProduct[product.id] || []
        const filteredSpecialPrices = filterActiveSpecialPrices(specialPrices)

        // Appliquer le prix spécial au produit si applicable
        const productWithSpecialPrice = applySpecialPriceToProduct(product, filteredSpecialPrices)

        return {
          ...productWithSpecialPrice,
          specialPrices: filteredSpecialPrices
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
        hasPrev: page > 1
      }
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

    // Validation des champs de certification
    if (data.isCertificated !== undefined) {
      validateCertificationFields(data.isCertificated, data.certificationDate, data.certificatedBy)
    }

    // Préparer les données de base
    const productData: {
      name: string
      description: string
      address: string
      longitude: number
      latitude: number
      basePrice: string
      priceMGA: string
      room: number | null
      bathroom: number | null
      arriving: number
      leaving: number
      autoAccept: boolean
      phone: string
      phoneCountry: string
      maxPeople: number | null
      categories: number
      validate: ProductValidation
      userManager: number
      availableRooms: number | null
      isCertificated: boolean | undefined
      certificationDate: Date | undefined
      certificatedBy?: string
      typeId: string
      user: { connect: { id: string }[] }
      equipments: { connect: { id: string }[] }
      servicesList: { connect: { id: string }[] }
      mealsList: { connect: { id: string }[] }
      securities: { connect: { id: string }[] }
      includedServices: { connect: { id: string }[] }
      extras: { connect: { id: string }[] }
      highlights: { connect: { id: string }[] }
      img: { create: { img: string }[] }
    } = {
      name: data.name,
      description: data.description,
      address: data.address,
      longitude: Number(data.longitude),
      latitude: Number(data.latitude),
      basePrice: data.basePrice,
      priceMGA: data.priceMGA,
      room: data.room ? Number(data.room) : null,
      bathroom: data.bathroom ? Number(data.bathroom) : null,
      arriving: Number(data.arriving),
      leaving: Number(data.leaving),
      autoAccept: false,
      phone: data.phone || '',
      phoneCountry: data.phoneCountry || 'MG',
      maxPeople: data.maxPeople ? Number(data.maxPeople) : null,
      categories: 0,
      validate: ProductValidation.NotVerified,
      userManager: 0,
      // Gestion du nombre de chambres disponibles pour les hôtels
      availableRooms: data.hotelInfo ? data.hotelInfo.availableRooms : null,
      // Champs de certification
      isCertificated: data.isCertificated,
      certificationDate: data.isCertificated && data.certificationDate ? new Date(data.certificationDate) : undefined,
      certificatedBy: data.isCertificated && data.certificatedBy ? data.certificatedBy : undefined,
      typeId: data.typeId,
      user: {
        connect: data.userId.map(id => ({ id })),
      },
      equipments: {
        connect: data.equipments.map(equipmentId => ({ id: equipmentId })),
      },
      servicesList: {
        connect: data.services.map(serviceId => ({ id: serviceId })),
      },
      mealsList: {
        connect: data.meals.map(mealId => ({ id: mealId })),
      },
      securities: {
        connect: data.securities.map(securityId => ({ id: securityId })),
      },
      includedServices: {
        connect: data.includedServices?.map(serviceId => ({ id: serviceId })) || [],
      },
      extras: {
        connect: data.extras?.map(extraId => ({ id: extraId })) || [],
      },
      highlights: {
        connect: data.highlights?.map(highlightId => ({ id: highlightId })) || [],
      },
      img: {
        create: data.images.map(img => ({ img })),
      },
    }

    // La relation certificatedRelation sera automatiquement gérée par Prisma via le champ certificatedBy

    // Créer le produit
    const createdProduct = await prisma.product.create({
      data: productData,
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
          const existingHotel = existingHotels.find(hotel =>
            hotel.name.toLowerCase() === data.hotelInfo!.name.toLowerCase()
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
        console.error('Erreur lors de la gestion de l\'hôtel:', hotelError)
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
    }

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
        validate: ProductValidation.Refused // Sécurité supplémentaire
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
      userEmails: [...new Set(products.flatMap(p => p.user.map(u => u.email)))] // Emails uniques
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
    // Champs de certification
    isCertificated?: boolean
    certificationDate?: Date | string | null
    certificatedBy?: string
  },
  hostId?: string
) {
  try {
    // Validation des champs de certification si fournis
    if (params.isCertificated !== undefined) {
      validateCertificationFields(params.isCertificated, params.certificationDate, params.certificatedBy)
    }

    // Récupérer le statut actuel avant la mise à jour
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { validate: true, isCertificated: true },
    })

    // Déterminer le nouveau statut seulement si ce ne sont pas uniquement les champs de certification qui changent
    let newValidationStatus: ProductValidation
    let shouldChangeValidationStatus = true

    // Vérifier si seuls les champs de certification sont modifiés
    // On considère que c'est une modification de certification uniquement si :
    // 1. isCertificated est fourni (modification de certification)
    // 2. certificatedBy est fourni (admin qui fait la modification)
    // 3. La certification change réellement
    const isCertificationOnlyChange = params.isCertificated !== undefined &&
                                     params.certificatedBy &&
                                     currentProduct?.isCertificated !== params.isCertificated

    console.log('Debug certification:', {
      isCertificatedProvided: params.isCertificated !== undefined,
      certificatedByProvided: !!params.certificatedBy,
      currentCertificated: currentProduct?.isCertificated,
      newCertificated: params.isCertificated,
      certificationChanged: currentProduct?.isCertificated !== params.isCertificated,
      isCertificationOnlyChange,
      shouldChangeValidationStatus: !isCertificationOnlyChange,
      hostId: !!hostId
    })

    if (isCertificationOnlyChange) {
      // C'est uniquement une modification de certification, ne pas changer le statut de validation
      shouldChangeValidationStatus = false
      newValidationStatus = currentProduct?.validate || ProductValidation.NotVerified
      console.log('Certification uniquement détectée - statut préservé:', newValidationStatus)
    } else {
      // Logique normale pour les autres modifications
      shouldChangeValidationStatus = true
      if (currentProduct?.validate === ProductValidation.RecheckRequest) {
        // Si une révision était demandée et que l'hôte fait des modifications,
        // le statut passe à "En attente" pour signaler à l'admin qu'il y a du nouveau travail
        newValidationStatus = ProductValidation.NotVerified
      } else {
        // Pour les autres cas, garder la logique actuelle
        newValidationStatus = ProductValidation.RecheckRequest
      }
      console.log('Modification normale détectée - statut changé vers:', newValidationStatus)
    }

    // Construire l'objet de données de manière conditionnelle
    const updateData: {
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
      type: { connect: { id: string } }
      equipments: { set: { id: string }[] }
      servicesList: { set: { id: string }[] }
      mealsList: { set: { id: string }[] }
      securities: { set: { id: string }[] }
      img: { deleteMany: Record<string, never>; create: { img: string }[] }
      validate?: ProductValidation
      isCertificated?: boolean
      certificationDate?: Date | null
      certificatedRelation?: { connect: { id: string } } | { disconnect: true }
    } = {
      name: params.name,
      description: params.description,
      address: params.address,
      longitude: params.longitude,
      latitude: params.latitude,
      basePrice: params.basePrice,
      room: params.room ? Number(params.room) : null,
      bathroom: params.bathroom ? Number(params.bathroom) : null,
      arriving: params.arriving,
      leaving: params.leaving,
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
    }

    // Ajouter le statut de validation seulement si ce n'est pas une modification de certification uniquement
    if (shouldChangeValidationStatus) {
      updateData.validate = newValidationStatus
    }

    if (params.isCertificated !== undefined) {
      updateData.isCertificated = params.isCertificated
      updateData.certificationDate = params.isCertificated && params.certificationDate ? new Date(params.certificationDate) : null

      if (params.isCertificated && params.certificatedBy) {
        updateData.certificatedRelation = { connect: {
          id: params.certificatedBy
          }}
      } else {
        updateData.certificatedRelation = { disconnect: true,}
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
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
      // Créer un historique de validation pour les modifications seulement si le statut change
      console.log('Debug historique validation:', {
        hostId: !!hostId,
        shouldChangeValidationStatus,
        currentStatus: currentProduct.validate,
        newStatus: newValidationStatus,
        statusChanged: currentProduct.validate !== newValidationStatus,
        willCreateHistory: !!(hostId && shouldChangeValidationStatus && currentProduct.validate !== newValidationStatus),
        isCertificationOnlyChange: isCertificationOnlyChange
      })

      // Ne pas créer d'historique de validation si c'est uniquement une modification de certification
      if (hostId && shouldChangeValidationStatus && currentProduct.validate !== newValidationStatus && !isCertificationOnlyChange) {
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

      // Créer un historique spécifique pour les changements de certification
      if (params.isCertificated !== undefined && params.certificatedBy) {
        // Comparer l'état de certification avant et après
        if (currentProduct && currentProduct.isCertificated !== params.isCertificated) {
          const certificationReason = params.isCertificated
            ? "Produit certifié par un administrateur"
            : "Certification du produit retirée par un administrateur"

          await createValidationHistory({
            productId: id,
            previousStatus: currentProduct.validate,
            newStatus: currentProduct.validate, // Le statut de validation ne change pas pour la certification
            adminId: params.certificatedBy,
            hostId: hostId,
            reason: certificationReason,
            changes: {
              certification: {
                previous: currentProduct.isCertificated,
                new: params.isCertificated,
                certificatedBy: params.certificatedBy,
                certificationDate: params.certificationDate,
                modifiedAt: new Date().toISOString(),
              },
            },
          })
        }
      }

      // Notifier les administrateurs seulement si le statut de validation change
      if (shouldChangeValidationStatus) {
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

    // Préparer les données de base pour le draft
    const draftData: {
      name: string
      description: string
      address: string
      basePrice: string
      priceMGA: string
      room: number | null
      bathroom: number | null
      arriving: number
      leaving: number
      autoAccept: boolean
      equipement: number | null
      meal: number | null
      services: number | null
      security: number | null
      minRent: number | null
      maxRent: number | null
      advanceRent: number | null
      delayTime: number | null
      categories: number
      minPeople: number | null
      maxPeople: number | null
      commission: number
      validate: ProductValidation
      userManager: number
      typeId: string
      phone: string
      phoneCountry: string
      latitude: number
      longitude: number
      certified: boolean
      contract: boolean
      sizeRoom: number | null
      availableRooms: number | null
      isCertificated: boolean
      certificationDate: Date | undefined
      certificatedBy?: string
      isDraft: boolean
      originalProductId: string
      img: { create: { img: string }[] }
      equipments: { connect: { id: string }[] }
      servicesList: { connect: { id: string }[] }
      mealsList: { connect: { id: string }[] }
      securities: { connect: { id: string }[] }
      includedServices: { connect: { id: string }[] }
      extras: { connect: { id: string }[] }
      highlights: { connect: { id: string }[] }
      user: { connect: { id: string }[] }
      nearbyPlaces: { create: { name: string; distance: number; duration: number; transport: string }[] }
      transportOptions: { create: { name: string; description?: string }[] }
    } = {
      // Copy all basic fields
      name: originalProduct.name,
      description: originalProduct.description,
      address: originalProduct.address,
      basePrice: originalProduct.basePrice,
      priceMGA: originalProduct.priceMGA,
      room: originalProduct.room ? Number(originalProduct.room) : null,
      bathroom: originalProduct.bathroom ? Number(originalProduct.bathroom) : null,
      arriving: originalProduct.arriving,
      leaving: originalProduct.leaving,
      autoAccept: originalProduct.autoAccept,
      equipement: originalProduct.equipement ? Number(originalProduct.equipement) : null,
      meal: originalProduct.meal ? Number(originalProduct.meal) : null,
      services: originalProduct.services ? Number(originalProduct.services) : null,
      security: originalProduct.security ? Number(originalProduct.security) : null,
      minRent: originalProduct.minRent ? Number(originalProduct.minRent) : null,
      maxRent: originalProduct.maxRent ? Number(originalProduct.maxRent) : null,
      advanceRent: originalProduct.advanceRent ? Number(originalProduct.advanceRent) : null,
      delayTime: originalProduct.delayTime ? Number(originalProduct.delayTime) : null,
      categories: Number(originalProduct.categories),
      minPeople: originalProduct.minPeople ? Number(originalProduct.minPeople) : null,
      maxPeople: originalProduct.maxPeople ? Number(originalProduct.maxPeople) : null,
      commission: originalProduct.commission,
      validate: ProductValidation.NotVerified,
      userManager: Number(originalProduct.userManager),
      typeId: originalProduct.typeId,
      phone: originalProduct.phone,
      phoneCountry: originalProduct.phoneCountry,
      latitude: originalProduct.latitude,
      longitude: originalProduct.longitude,
      certified: originalProduct.certified,
      contract: originalProduct.contract,
      sizeRoom: originalProduct.sizeRoom,
      availableRooms: originalProduct.availableRooms,

      // Copy certification fields avec logique conditionnelle
      isCertificated: originalProduct.isCertificated,
      certificationDate: originalProduct.isCertificated ? originalProduct.certificationDate || undefined : undefined,
      certificatedBy: originalProduct.isCertificated ? originalProduct.certificatedBy || undefined : undefined,

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
          description: transport.description || undefined,
        })),
      },
    }

    // La relation certificatedRelation sera automatiquement gérée par Prisma via le champ certificatedBy

    // Create the draft product
    const draft = await prisma.product.create({
      data: draftData,
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

    // Préparer les données de mise à jour
    const updateData: {
      name: string
      description: string
      address: string
      basePrice: string
      priceMGA: string
      room: number | null
      bathroom: number | null
      arriving: number
      leaving: number
      autoAccept: boolean
      equipement: number | null
      meal: number | null
      services: number | null
      security: number | null
      minRent: number | null
      maxRent: number | null
      advanceRent: number | null
      delayTime: number | null
      categories: number
      minPeople: number | null
      maxPeople: number | null
      commission: number
      validate: ProductValidation
      phone: string
      phoneCountry: string
      latitude: number
      longitude: number
      certified: boolean
      contract: boolean
      sizeRoom: number | null
      availableRooms: number | null
      isCertificated: boolean
      certificationDate: Date | undefined
      certificatedBy?: string
      img: { deleteMany: Record<string, never>; create: { img: string }[] }
      equipments: { set: { id: string }[] }
      servicesList: { set: { id: string }[] }
      mealsList: { set: { id: string }[] }
      securities: { set: { id: string }[] }
      includedServices: { set: { id: string }[] }
      extras: { set: { id: string }[] }
      highlights: { set: { id: string }[] }
      nearbyPlaces: { deleteMany: Record<string, never>; create: { name: string; distance: number; duration: number; transport: string }[] }
      transportOptions: { deleteMany: Record<string, never>; create: { name: string; description?: string }[] }
    } = {
      // Update all basic fields
      name: draft.name,
      description: draft.description,
      address: draft.address,
      basePrice: draft.basePrice,
      priceMGA: draft.priceMGA,
      room: draft.room ? Number(draft.room) : null,
      bathroom: draft.bathroom ? Number(draft.bathroom) : null,
      arriving: draft.arriving,
      leaving: draft.leaving,
      autoAccept: draft.autoAccept,
      equipement: draft.equipement ? Number(draft.equipement) : null,
      meal: draft.meal ? Number(draft.meal) : null,
      services: draft.services ? Number(draft.services) : null,
      security: draft.security ? Number(draft.security) : null,
      minRent: draft.minRent ? Number(draft.minRent) : null,
      maxRent: draft.maxRent ? Number(draft.maxRent) : null,
      advanceRent: draft.advanceRent ? Number(draft.advanceRent) : null,
      delayTime: draft.delayTime ? Number(draft.delayTime) : null,
      categories: Number(draft.categories),
      minPeople: draft.minPeople ? Number(draft.minPeople) : null,
      maxPeople: draft.maxPeople ? Number(draft.maxPeople) : null,
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

      // Update certification fields avec logique conditionnelle
      isCertificated: draft.isCertificated,
      certificationDate: draft.isCertificated ? draft.certificationDate || undefined : undefined,
      certificatedBy: draft.isCertificated ? draft.certificatedBy || undefined : undefined,

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
          description: transport.description || undefined,
        })),
      },
    }

    // La relation certificatedRelation sera automatiquement gérée par Prisma via le champ certificatedBy

    // Update the original product with draft data
    const updatedProduct = await prisma.product.update({
      where: { id: draft.originalProductId },
      data: updateData,
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

// Update product without changing validation status or sending emails
export async function updateProduct(
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
    // Champs de certification
    isCertificated?: boolean
    certificationDate?: Date | string | null
    certificatedBy?: string
  }
) {
  try {
    // Construire l'objet de données de manière conditionnelle
    const updateData: {
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
      type: { connect: { id: string } }
      equipments: { set: { id: string }[] }
      servicesList: { set: { id: string }[] }
      mealsList: { set: { id: string }[] }
      securities: { set: { id: string }[] }
      img: { deleteMany: Record<string, never>; create: { img: string }[] }
      isCertificated?: boolean
      certificationDate?: Date | null
    } = {
      name: params.name,
      description: params.description,
      address: params.address,
      longitude: params.longitude,
      latitude: params.latitude,
      basePrice: params.basePrice,
      room: params.room ? Number(params.room) : null,
      bathroom: params.bathroom ? Number(params.bathroom) : null,
      arriving: params.arriving,
      leaving: params.leaving,
      // Ne pas modifier le statut de validation - garder le statut existant
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
    }

    // Ajouter les champs de certification avec logique conditionnelle
    if (params.isCertificated !== undefined) {
      updateData.isCertificated = params.isCertificated
      updateData.certificationDate = params.isCertificated && params.certificationDate ? new Date(params.certificationDate) : null

      if (params.isCertificated && params.certificatedBy) {
        (updateData as Record<string, unknown>).certificatedBy = params.certificatedBy
      } else {
        (updateData as Record<string, unknown>).certificatedBy = undefined
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        img: true,
        type: true,
        equipments: true,
        servicesList: true,
        mealsList: true,
        securities: true,
        user: true,
      },
    })

    // Invalider le cache après mise à jour
    await invalidateProductCache(id)

    return updatedProduct
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    return null
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
