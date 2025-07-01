'use server'
import prisma from '@/lib/prisma'
import { Product, PaymentStatus, RentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'
interface PayablePrices {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  commission: number
}

export async function getPayablePricesPerRent(rentId: string): Promise<PayablePrices> {
  try {
    const rent = await prisma.rent.findUnique({
      where: {
        id: rentId,
      },
      include: {
        product: true,
      },
    })

    if (!rent) throw new Error('Rent not found')
    if (!rent.product) throw new Error('Product not found')

    const totalPrice = Number(rent.prices)
    const commission = rent.product.commission
    const price = totalPrice - totalPrice * (commission / 100)
    const product = rent.product as Product & { contract: boolean }

    let availablePrice = 0
    let pendingPrice = 0

    // Calcul du prix disponible
    if (product.contract && rent.payment === PaymentStatus.CLIENT_PAID) {
      availablePrice = price
    } else if (
      rent.status === RentStatus.CHECKIN &&
      (rent.payment === PaymentStatus.CLIENT_PAID ||
        rent.payment === PaymentStatus.MID_TRANSFER_DONE)
    ) {
      availablePrice = price / 2
    } else if (rent.status === RentStatus.CHECKOUT) {
      if (rent.payment === PaymentStatus.CLIENT_PAID) {
        availablePrice = price
      } else if (rent.payment === PaymentStatus.MID_TRANSFER_DONE) {
        availablePrice = price / 2
      }
    } else if (!product.contract && rent.payment === PaymentStatus.CLIENT_PAID) {
      availablePrice = price
    }

    // Calcul du prix en attente
    switch (rent.payment) {
      case PaymentStatus.MID_TRANSFER_REQ:
        pendingPrice = price / 2
        break
      case PaymentStatus.REST_TRANSFER_REQ:
        pendingPrice = price / 2
        break
      case PaymentStatus.FULL_TRANSFER_REQ:
        pendingPrice = price
        break
      case PaymentStatus.MID_TRANSFER_DONE:
        if (!product.contract || rent.status === RentStatus.CHECKOUT) {
          pendingPrice = price / 2
        }
        break
      default:
        pendingPrice = 0
    }

    return {
      totalPricesPayable: price,
      availablePrice,
      pendingPrice,
      commission,
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function createPayRequest(
  rentId: string,
  type: PaymentStatus,
  userId: string,
  notes: string,
  method: PaymentMethod
) {
  try {
    const rent = await prisma.rent.findUnique({
      where: { id: rentId },
      include: {
        product: true,
      },
    })

    if (!rent) throw new Error('No rent found with this ID')
    const totalPrice = Number(rent.prices)
    const commission = rent.product.commission
    const price = totalPrice - totalPrice * (commission / 100)

    if (
      type == PaymentStatus.FULL_TRANSFER_REQ &&
      (rent.status == RentStatus.CHECKOUT || rent.product.contract)
    ) {
      const payrequest = await prisma.payRequest.create({
        data: {
          user: { connect: { id: userId } },
          PaymentRequest: type,
          prices: price.toString(),
          rent: { connect: { id: rent.id } },
          notes: notes,
          method: method,
          status: PaymentReqStatus.RECEIVED,
        },
      })
      if (!payrequest) throw new Error('Internal Error during the payment requests')
    } else if (
      type == PaymentStatus.MID_TRANSFER_REQ &&
      (rent.status == RentStatus.CHECKIN || rent.product.contract)
    ) {
      const tempPrices = price / 2
      const payrequest = await prisma.payRequest.create({
        data: {
          user: { connect: { id: userId } },
          PaymentRequest: type,
          prices: tempPrices.toString(),
          rent: { connect: { id: rent.id } },
          notes: notes,
          method: method,
          status: PaymentReqStatus.RECEIVED,
        },
      })
      if (!payrequest) throw new Error('Internal Error during the payment requests')
    } else if (
      type == PaymentStatus.REST_TRANSFER_REQ &&
      rent.payment == PaymentStatus.MID_TRANSFER_DONE
    ) {
      const tempPrices = price / 2
      const payrequest = await prisma.payRequest.create({
        data: {
          user: { connect: { id: userId } },
          PaymentRequest: type,
          prices: tempPrices.toString(),
          rent: { connect: { id: rent.id } },
          notes: notes,
          method: method,
          status: PaymentReqStatus.RECEIVED,
        },
      })
      if (!payrequest) throw new Error('Internal Error during the payment requests')
    }
    const updateRent = await prisma.rent.update({
      where: { id: rentId },
      data: {
        payment: type,
      },
    })
    if (!updateRent) throw new Error('Imposible to update rent')
  } catch (e) {
    console.error(e)
    return e
  }
}

export async function getAllPaymentRequest() {
  const request = await prisma.payRequest.findMany({
    where: {
      status: PaymentReqStatus.RECEIVED,
    },
  })
  return { payRequest: request }
}

export async function approvePaymentRequest(id: string) {
  try {
    const updateReq = await prisma.payRequest.update({
      where: { id: id },
      data: {
        status: PaymentReqStatus.DONE,
      },
    })
    if (!updateReq) throw new Error('Payment Request not found')
    let status
    switch (updateReq.PaymentRequest) {
      case PaymentStatus.REST_TRANSFER_REQ:
        status = PaymentStatus.REST_TRANSFER_DONE
        break
      case PaymentStatus.MID_TRANSFER_REQ:
        status = PaymentStatus.MID_TRANSFER_DONE
        break
      case PaymentStatus.FULL_TRANSFER_REQ:
        status = PaymentStatus.FULL_TRANSFER_DONE
        break
    }
    const updateRent = await prisma.rent.update({
      where: { id: updateReq.rentId },
      data: {
        payment: status,
      },
    })
    return { request: updateReq, rent: updateRent }
  } catch (e) {
    console.error(e)
    return
  }
}
