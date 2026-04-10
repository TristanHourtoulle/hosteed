'use server'

import prisma from '@/lib/prisma'
import { ProductValidation, PaymentStatus, WithdrawalStatus } from '@prisma/client'

export interface AdminDashboardStats {
  // Actionable — drives the "Priorités" list
  productsWaitingValidation: number
  reviewsPendingModeration: number
  withdrawalsPending: number

  // Monthly KPIs — the hero row
  rentsThisMonth: number
  revenueThisMonth: number
  newUsersThisWeek: number
  productsWaiting: number

  // Context metrics — secondary row
  usersTotal: number
  productsActive: number
  rentsYearly: number
}

/**
 * Returns all the counts and sums needed to render the admin dashboard home
 * in a single parallel fetch. Each individual query is cheap and indexed.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Any payment state beyond NOT_PAID counts as a realized booking.
    const paidPaymentStates: PaymentStatus[] = [
      PaymentStatus.CLIENT_PAID,
      PaymentStatus.MID_TRANSFER_REQ,
      PaymentStatus.MID_TRANSFER_DONE,
      PaymentStatus.REST_TRANSFER_REQ,
      PaymentStatus.REST_TRANSFER_DONE,
      PaymentStatus.FULL_TRANSFER_REQ,
      PaymentStatus.FULL_TRANSFER_DONE,
    ]

    const [
      usersTotal,
      newUsersThisWeek,
      productsActive,
      productsWaiting,
      rentsThisMonth,
      rentsYearly,
      revenueThisMonthAgg,
      reviewsPendingModeration,
      withdrawalsPending,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.product.count({
        where: { validate: ProductValidation.Approve, isDraft: false },
      }),
      prisma.product.count({
        where: {
          isDraft: false,
          validate: {
            in: [ProductValidation.NotVerified, ProductValidation.RecheckRequest],
          },
        },
      }),
      prisma.rent.count({
        where: {
          arrivingDate: { gte: startOfMonth, lt: startOfNextMonth },
          payment: { in: paidPaymentStates },
        },
      }),
      prisma.rent.count({
        where: {
          arrivingDate: { gte: startOfYear, lt: startOfNextYear },
          payment: { in: paidPaymentStates },
        },
      }),
      prisma.rent.aggregate({
        _sum: { totalAmount: true },
        where: {
          arrivingDate: { gte: startOfMonth, lt: startOfNextMonth },
          payment: { in: paidPaymentStates },
        },
      }),
      prisma.review.count({ where: { approved: false } }),
      prisma.withdrawalRequest.count({
        where: {
          status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.ACCOUNT_VALIDATION] },
        },
      }),
    ])

    return {
      productsWaitingValidation: productsWaiting,
      reviewsPendingModeration,
      withdrawalsPending,
      rentsThisMonth,
      revenueThisMonth: revenueThisMonthAgg._sum.totalAmount ?? 0,
      newUsersThisWeek,
      productsWaiting,
      usersTotal,
      productsActive,
      rentsYearly,
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stats dashboard admin:', error)
    return null
  }
}

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
