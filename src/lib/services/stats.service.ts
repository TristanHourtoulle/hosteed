'use server'

import { prisma } from '@/lib/prisma'
import { ProductValidation } from '@prisma/client'

export async function getAdminStatsYearly() {
  try {
    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1) // 1er janvier de l'année en cours
    const endDate = new Date(currentYear, 11, 31) // 31 décembre de l'année en cours

    const users = await prisma.user.count()
    const product = await prisma.product.count({
      where: {
        validate: ProductValidation.Approve,
      },
    })
    const productWaiting = await prisma.product.count({
      where: {
        OR: [
          {
            validate: ProductValidation.RecheckRequest,
          },
          {
            validate: ProductValidation.NotVerified,
          },
        ],
      },
    })
    const rent = await prisma.rent.count({
      where: {
        AND: [
          {
            arrivingDate: {
              gte: startDate,
            },
          },
          {
            leavingDate: {
              lte: endDate,
            },
          },
          {
            payment: 'CLIENT_PAID',
          },
        ],
      },
    })

    return {
      users: users,
      product: product,
      productWaiting: productWaiting,
      rent: rent,
    }
  } catch (e) {
    console.error(e)
    return null
  }
}
