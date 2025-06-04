'use server'
import { prisma } from '@/lib/prisma';
import { RentStatus } from '@prisma/client';

export interface UnavailableRentService {
  id: string;
  start: string;
  end: string;
  productId: string;
}

export async function findUnavailableByRentId(requestId: string): Promise<UnavailableRentService> {
  try {
    const product = await prisma.UnAvailableProduct.findUnique({
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
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit pour la comparaison

    // Vérifier si les dates sont valides
    if (startDate < today) {
      throw new Error('La date de début ne peut pas être antérieure à aujourd\'hui');
    }

    if (endDate < startDate) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }

    // Vérifier s'il existe des réservations sur cette période
    const existingRents = await prisma.rent.findMany({
      where: {
        productId: productId,
        status: RentStatus.ACCEPTED,
        OR: [
          // Réservation qui commence pendant la période d'indisponibilité
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          // Réservation qui se termine pendant la période d'indisponibilité
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          // Réservation qui englobe la période d'indisponibilité
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

    if (existingRents.length > 0) {
      throw new Error('Il existe déjà des réservations sur cette période');
    }

    // Vérifier s'il existe déjà des périodes d'indisponibilité qui se chevauchent
    const existingUnavailable = await prisma.UnAvailableProduct.findMany({
      where: {
        productId: productId,
        OR: [
          // Période qui commence pendant la nouvelle période
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          // Période qui se termine pendant la nouvelle période
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          // Période qui englobe la nouvelle période
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

    const request = await prisma.UnAvailableProduct.create({
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
