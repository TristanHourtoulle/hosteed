'use server'
import { prisma } from '@/lib/prisma';
import { RentStatus } from '@prisma/client';

export interface FormattedRent {
  id: string;
  title: string;
  start: string;
  end: string;
  propertyId: string;
  propertyName: string;
  status: RentStatus;
}

export interface RentDetails {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  numberPeople: number;
  notes: string;
  prices: number;
  arrivingDate: string;
  leavingDate: string;
  status: RentStatus;
  payment: string;
}

export async function findAllReservationsByHostId(hostId: string): Promise<FormattedRent[]> {
  try {
    const rents = await prisma.rent.findMany({
      where: {
        product: {
          user: {
            some: {
              id: hostId
            }
          }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        arrivingDate: 'asc'
      }
    });

    return rents.map(rent => ({
      id: rent.id,
      title: `Réservation #${rent.id}`,
      start: rent.arrivingDate.toISOString(),
      end: rent.leavingDate.toISOString(),
      propertyId: rent.productId,
      propertyName: rent.product.name,
      status: rent.status
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    throw error;
  }
}

export async function findRentById(rentId: string): Promise<RentDetails> {
  try {
    const rent = await prisma.rent.findUnique({
      where: {
        id: rentId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!rent) {
      throw new Error('Réservation non trouvée');
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
      payment: rent.payment
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    throw error;
  }
}
