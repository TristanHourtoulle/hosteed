// TODO: refactor this file because it's larger than 200 lines
'use server'
import { RentStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface FormattedRent {
  id: string
  title: string
  start: string
  end: string
  propertyId: string
  propertyName: string
  status: RentStatus
}

export interface RentDetails {
  id: string
  productId: string
  productName: string
  userId: string
  userName: string
  numberPeople: number
  notes: string
  prices: number
  arrivingDate: string
  leavingDate: string
  status: RentStatus
  payment: string
}

export async function checkHotelRoomAvailability(
  productId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; message?: string; availableRooms?: number }> {
  try {
    // Récupérer les informations du produit (chambre d'hôtel)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        availableRooms: true,
        name: true,
        hotel: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!product || !product.availableRooms) {
      return {
        available: false,
        message: 'Informations sur le nombre de chambres non disponibles',
      }
    }

    // Compter le nombre de réservations confirmées sur cette période
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: productId,
        status: RentStatus.RESERVED,
        OR: [
          // Réservation qui commence pendant la période
          {
            arrivingDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Réservation qui se termine pendant la période
          {
            leavingDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Réservation qui englobe la période
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

    const bookedRooms = existingRents.length
    const availableRooms = product.availableRooms - bookedRooms

    // Vérifier s'il existe des périodes d'indisponibilité (maintenance, etc.)
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
      return {
        available: false,
        message: "Cette période est marquée comme indisponible par l'hébergeur",
        availableRooms: 0,
      }
    }

    return {
      available: availableRooms > 0,
      message:
        availableRooms > 0
          ? `${availableRooms} chambre(s) disponible(s) sur ${product.availableRooms}`
          : 'Aucune chambre disponible pour cette période',
      availableRooms: availableRooms,
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité hôtel:', error)
    return {
      available: false,
      message: 'Erreur lors de la vérification de disponibilité',
    }
  }
}

export async function checkRentIsAvailable(
  productId: string,
  startDate: Date,
  endDate: Date
): Promise<{ available: boolean; message?: string }> {
  try {
    // Vérifier d'abord si c'est un produit d'hôtel avec plusieurs chambres
    const productInfo = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        availableRooms: true,
        hotel: {
          select: { id: true },
        },
      },
    })

    // Si c'est un hôtel avec plusieurs chambres, utiliser la logique hôtel
    if (productInfo?.availableRooms && productInfo.availableRooms > 1) {
      const hotelAvailability = await checkHotelRoomAvailability(productId, startDate, endDate)
      return {
        available: hotelAvailability.available,
        message: hotelAvailability.message,
      }
    }

    // Sinon, utiliser la logique classique (une seule unité)
    // Vérifier s'il existe des réservations sur cette période
    // Logique "nuit d'hôtel" : une réservation du 12 au 13 occupe la nuit du 12
    // donc le 13 est libre pour une nouvelle arrivée
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: productId,
        status: RentStatus.RESERVED,
        OR: [
          // Réservation qui commence pendant la période (arrivingDate < endDate car endDate est exclu)
          {
            arrivingDate: {
              gte: startDate,
              lt: endDate,
            },
          },
          // Réservation qui se termine pendant la période (leavingDate > startDate car on peut arriver le jour du départ)
          {
            leavingDate: {
              gt: startDate,
              lt: endDate,
            },
          },
          // Réservation qui englobe la période
          {
            arrivingDate: {
              lt: startDate,
            },
            leavingDate: {
              gt: endDate,
            },
          },
        ],
      },
    })

    if (existingRents.length > 0) {
      return {
        available: false,
        message: 'Il existe déjà des réservations sur cette période',
      }
    }

    // Vérifier s'il existe des périodes d'indisponibilité
    // Logique "nuit d'hôtel" : un blocage du 12 au 13 bloque la nuit du 12
    // donc le 13 est libre pour une nouvelle arrivée
    const existingUnavailable = await prisma.unAvailableProduct.findMany({
      where: {
        productId: productId,
        OR: [
          // Période qui commence pendant la période demandée (startDate < endDate car endDate est exclu)
          {
            startDate: {
              gte: startDate,
              lt: endDate,
            },
          },
          // Période qui se termine pendant la période demandée (endDate > startDate car on peut arriver le jour de fin)
          {
            endDate: {
              gt: startDate,
              lt: endDate,
            },
          },
          // Période qui englobe la période demandée
          {
            startDate: {
              lt: startDate,
            },
            endDate: {
              gt: endDate,
            },
          },
        ],
      },
    })
    console.log(existingUnavailable)

    if (existingUnavailable.length > 0) {
      return {
        available: false,
        message: 'Le produit est indisponible sur cette période',
      }
    }

    return { available: true }
  } catch (error) {
    console.error('Erreur lors de la vérification de la disponibilité:', error)
    throw error
  }
}

export async function findAllReservationsByHostId(hostId: string): Promise<FormattedRent[]> {
  try {
    const rents = await prisma.rent.findMany({
      where: {
        product: {
          ownerId: hostId,
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
      orderBy: {
        arrivingDate: 'asc',
      },
    })

    return rents.map(rent => ({
      id: rent.id,
      title: `Réservation #${rent.id}`,
      start: rent.arrivingDate.toISOString(),
      end: rent.leavingDate.toISOString(),
      propertyId: rent.productId,
      propertyName: rent.product.name,
      status: rent.status,
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error)
    throw error
  }
}

export async function findRentById(rentId: string): Promise<RentDetails> {
  try {
    const rent = await prisma.rent.findUnique({
      where: {
        id: rentId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!rent) {
      throw new Error('Réservation non trouvée')
    }

    return {
      id: rent.id,
      productId: rent.productId,
      productName: rent.product.name,
      userId: rent.userId,
      userName: rent.user.name || 'Anonyme',
      numberPeople: Number(rent.numberPeople),
      notes: rent.notes ? String(rent.notes) : '',
      prices: Number(rent.prices),
      arrivingDate: rent.arrivingDate.toISOString(),
      leavingDate: rent.leavingDate.toISOString(),
      status: rent.status,
      payment: rent.payment,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error)
    throw error
  }
}
