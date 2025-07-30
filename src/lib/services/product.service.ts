// TODO: refactor this file because it's larger than 200 lines
'use server'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
import { findAllUserByRoles } from '@/lib/services/user.service'
import { createValidationHistory } from '@/lib/services/validation.service'
import { ProductValidation } from '@prisma/client'
import { CreateProductInput } from '@/lib/interface/userInterface'

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
      return product
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la recherche du produit:', error)
    return null
  }
}

export async function findAllProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        validate: ProductValidation.Approve,
      },
      include: {
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
      },
    })

    return products
  } catch (error) {
    console.error('Erreur lors de la recherche des produits:', error)
    return null
  }
}

export async function findAllProductByHostId(id: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        user: {
          some: {
            id: {
              equals: id,
            },
          },
        },
      },
      include: {
        img: true,
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
      },
    })

    return products
  } catch (error) {
    console.error("Erreur lors de la recherche des produits de l'hôte:", error)
    return null
  }
}

export async function createProduct(data: CreateProductInput) {
  try {
    // Créer d'abord le produit de base
    const createdProduct = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        longitude: Number(data.longitude),
        latitude: Number(data.latitude),
        basePrice: data.basePrice,
        priceMGA: data.priceMGA,
        room: data.room ? BigInt(data.room) : null,
        bathroom: data.bathroom ? BigInt(data.bathroom) : null,
        arriving: Number(data.arriving),
        leaving: Number(data.leaving),
        autoAccept: false,
        phone: data.phone || '',
        categories: BigInt(0),
        validate: ProductValidation.NotVerified,
        userManager: BigInt(0),
        type: { connect: { id: data.typeId } },
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

    // Envoyer les emails aux administrateurs
    const admin = await findAllUserByRoles('ADMIN')
    admin?.map(async user => {
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
    })

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

    return product
  } catch (error) {
    console.error('Erreur lors du rejet du produit:', error)
    return null
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
      admin?.forEach(async user => {
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
      })
    }

    return updatedProduct
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    return null
  }
}
