'use server'
import prisma from '@/lib/prisma'
import { RentStatus } from '@prisma/client'

export interface UnavailableRentService {
  id: string
  start: string
  end: string
  productId: string
}

export interface UnavailableProduct {
  id: string
  startDate: Date
  endDate: Date
  productId: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FormattedUnavailability {
  id: string
  title: string
  description: string | null
  start: string
  end: string
  productId: string
  propertyName?: string
  type: 'unavailability'
}

export async function findUnavailableByRentId(requestId: string) {
  try {
    const product = await prisma.unAvailableProduct.findUnique({
      where: {
        id: requestId,
      },
    })

    if (!product) {
      throw new Error('Réservation non trouvée')
    }

    return product
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error)
    throw error
  }
}

export async function createUnavailableRent(
  productId: string,
  startDate: Date,
  endDate: Date,
  title: string,
  description?: string | null
) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startDate < today) {
      throw new Error("La date de début ne peut pas être antérieure à aujourd'hui")
    }
    if (endDate < startDate) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début')
    }
    if (!title || title.trim() === '') {
      throw new Error('Le titre est obligatoire')
    }
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: productId,
        status: RentStatus.RESERVED,
        OR: [
          {
            arrivingDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            leavingDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            arrivingDate: {
              lte: startDate,
            },
            leavingDate: {
              gte: endDate,
            },
          },
        ],
      },
    })

    if (existingRents.length > 0) {
      throw new Error('Il existe déjà des réservations sur cette période')
    }
    const existingUnavailable = await prisma.unAvailableProduct.findMany({
      where: {
        productId: productId,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            startDate: {
              lte: startDate,
            },
            endDate: {
              gte: endDate,
            },
          },
        ],
      },
    })

    if (existingUnavailable.length > 0) {
      throw new Error("Il existe déjà une période d'indisponibilité sur ces dates")
    }

    const request = await prisma.unAvailableProduct.create({
      data: {
        startDate: startDate,
        endDate: endDate,
        title: title.trim(),
        description: description?.trim() || null,
        product: {
          connect: {
            id: productId,
          },
        },
      },
    })
    return request
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function updateUnavailableRent(
  id: string,
  data: {
    startDate?: Date
    endDate?: Date
    title?: string
    description?: string | null
  }
) {
  try {
    // Vérifier que l'indisponibilité existe
    const existing = await prisma.unAvailableProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Indisponibilité non trouvée')
    }

    // Vérifier les dates si elles changent
    const newStartDate = data.startDate || existing.startDate
    const newEndDate = data.endDate || existing.endDate

    if (newEndDate < newStartDate) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début')
    }

    if (data.title !== undefined && (!data.title || data.title.trim() === '')) {
      throw new Error('Le titre est obligatoire')
    }

    // Vérifier chevauchements avec réservations
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: existing.productId,
        status: RentStatus.RESERVED,
        OR: [
          {
            arrivingDate: {
              gte: newStartDate,
              lte: newEndDate,
            },
          },
          {
            leavingDate: {
              gte: newStartDate,
              lte: newEndDate,
            },
          },
          {
            arrivingDate: {
              lte: newStartDate,
            },
            leavingDate: {
              gte: newEndDate,
            },
          },
        ],
      },
    })

    if (existingRents.length > 0) {
      throw new Error('Il existe déjà des réservations sur cette période')
    }

    // Vérifier chevauchements avec autres indisponibilités (exclure la courante)
    const existingUnavailable = await prisma.unAvailableProduct.findMany({
      where: {
        productId: existing.productId,
        id: { not: id }, // Exclure l'indisponibilité courante
        OR: [
          {
            startDate: {
              gte: newStartDate,
              lte: newEndDate,
            },
          },
          {
            endDate: {
              gte: newStartDate,
              lte: newEndDate,
            },
          },
          {
            startDate: {
              lte: newStartDate,
            },
            endDate: {
              gte: newEndDate,
            },
          },
        ],
      },
    })

    if (existingUnavailable.length > 0) {
      throw new Error("Il existe déjà une période d'indisponibilité sur ces dates")
    }

    // Mettre à jour
    const updateData: {
      startDate?: Date
      endDate?: Date
      title?: string
      description?: string | null
    } = {}
    if (data.startDate) updateData.startDate = data.startDate
    if (data.endDate) updateData.endDate = data.endDate
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null

    return await prisma.unAvailableProduct.update({
      where: { id },
      data: updateData,
    })
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function deleteUnavailableRent(id: string) {
  try {
    const existing = await prisma.unAvailableProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Indisponibilité non trouvée')
    }

    await prisma.unAvailableProduct.delete({
      where: { id },
    })

    return { success: true }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function findUnavailableByProductId(
  productId: string
): Promise<FormattedUnavailability[]> {
  try {
    const unavailabilities = await prisma.unAvailableProduct.findMany({
      where: { productId },
      orderBy: { startDate: 'asc' },
    })

    return unavailabilities.map(u => ({
      id: u.id,
      title: u.title,
      description: u.description,
      start: u.startDate.toISOString(),
      end: u.endDate.toISOString(),
      productId: u.productId,
      type: 'unavailability' as const,
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des indisponibilités:', error)
    throw error
  }
}

export async function findUnavailableByHostId(hostId: string): Promise<FormattedUnavailability[]> {
  try {
    const unavailabilities = await prisma.unAvailableProduct.findMany({
      where: {
        product: {
          user: {
            some: { id: hostId },
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return unavailabilities.map(u => ({
      id: u.id,
      title: u.title,
      description: u.description,
      start: u.startDate.toISOString(),
      end: u.endDate.toISOString(),
      productId: u.product.id,
      propertyName: u.product.name,
      type: 'unavailability' as const,
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des indisponibilités:', error)
    throw error
  }
}
