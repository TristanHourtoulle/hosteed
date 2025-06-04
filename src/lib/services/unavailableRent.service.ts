'use server'
import { prisma } from '@/lib/prisma';
import { RentStatus } from '@prisma/client';

export interface UnavailableRentService {
  id: string;
  start: string;
  end: string;
  productId: string;
}

export async function findUnavailableByRentId(requestId: string) {
  try {
    const product = await prisma.unAvailableProduct.findUnique({
      where: {
        id: requestId
      },
    });

    if (!product) {
      throw new Error('Réservation non trouvée');
    }

    return product;
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    throw error;
  }
}

export async function createUnavailableRent(productId: string, startDate: Date, endDate: Date) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      throw new Error('La date de début ne peut pas être antérieure à aujourd\'hui');
    }
    if (endDate < startDate) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: productId,
        status: RentStatus.RESERVED,
        OR: [
          {
            arrivingDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            leavingDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            arrivingDate: {
              lte: startDate
            },
            leavingDate: {
              gte: endDate
            }
          }
        ]
      }
    });

    if (existingRents.length > 0) {
      throw new Error('Il existe déjà des réservations sur cette période');
    }
    const existingUnavailable = await prisma.unAvailableProduct.findMany({
      where: {
        productId: productId,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            startDate: {
              lte: startDate
            },
            endDate: {
              gte: endDate
            }
          }
        ]
      }
    });

    if (existingUnavailable.length > 0) {
      throw new Error('Il existe déjà une période d\'indisponibilité sur ces dates');
    }

    const request = await prisma.unAvailableProduct.create({
      data: {
        startDate: startDate,
        endDate: endDate,
        product: {
          connect: {
            id: productId,
          }
        }
      }
    });
    return request;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
