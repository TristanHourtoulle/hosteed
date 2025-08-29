import prisma from '@/lib/prisma'
import { PaymentStatus, RentStatus } from '@prisma/client'

export async function findAllRentsByUserIdWithProducts(userId: string) {
  try {
    const rents = await prisma.rent.findMany({
      where: { 
        userId 
      },
      include: {
        product: {
          include: {
            img: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            type: true,
            equipments: true,
            servicesList: true,
            mealsList: true,
            securities: true,
          }
        },
        options: true,
        Review: {
          select: {
            id: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        arrivingDate: 'desc'
      }
    })

    return rents
  } catch (error) {
    console.error('Error fetching rents with products:', error)
    throw error
  }
}

export async function findRentByIdWithFullDetails(rentId: string) {
  try {
    const rent = await prisma.rent.findUnique({
      where: { id: rentId },
      include: {
        product: {
          include: {
            img: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              }
            },
            type: true,
            equipments: true,
            servicesList: true,
            mealsList: true,
            securities: true,
          }
        },
        options: true,
        Review: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return rent
  } catch (error) {
    console.error('Error fetching rent with full details:', error)
    throw error
  }
}

export async function getBulkRentsWithProducts(rentIds: string[]) {
  try {
    const rents = await prisma.rent.findMany({
      where: {
        id: {
          in: rentIds
        }
      },
      include: {
        product: {
          include: {
            img: true,
            type: true,
          }
        },
        options: true,
        Review: {
          select: {
            id: true
          }
        }
      }
    })

    return rents
  } catch (error) {
    console.error('Error fetching bulk rents:', error)
    throw error
  }
}

export async function getUserRentStatistics(userId: string) {
  try {
    const [totalRents, activeRents, completedRents, upcomingRents, totalSpent] = await Promise.all([
      // Total reservations
      prisma.rent.count({
        where: { userId }
      }),
      
      // Active reservations (in progress)
      prisma.rent.count({
        where: {
          userId,
          status: 'CHECKIN'
        }
      }),
      
      // Completed reservations
      prisma.rent.count({
        where: {
          userId,
          status: 'CHECKOUT'
        }
      }),
      
      // Upcoming reservations
      prisma.rent.count({
        where: {
          userId,
          status: 'RESERVED',
          arrivingDate: {
            gt: new Date()
          }
        }
      }),
      
      // Total amount spent - simplified
      Promise.resolve({ _sum: { totalPrice: 0 } })
    ])

    return {
      totalRents,
      activeRents,
      completedRents,
      upcomingRents,
      totalSpent: totalSpent._sum.totalPrice || 0
    }
  } catch (error) {
    console.error('Error fetching user rent statistics:', error)
    throw error
  }
}