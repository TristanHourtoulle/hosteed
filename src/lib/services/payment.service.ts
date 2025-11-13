'use server'
import prisma from '@/lib/prisma'
import { Product, PaymentStatus, RentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'
import { sendEmailFromTemplate } from '@/lib/services/email.service'

interface PayablePrices {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  transferredPrice: number
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

    // Use new pricing fields with fallback to legacy calculation
    let price: number
    let totalPrice: number
    let commission: number

    if (rent.hostAmount !== null && rent.hostAmount !== undefined) {
      // New pricing system
      price = Number(rent.hostAmount)
      totalPrice = Number(rent.totalAmount || rent.prices)
      commission = Number(rent.hostCommission || 0)
    } else {
      // Legacy calculation for old reservations
      totalPrice = Number(rent.prices)
      commission = rent.product.commission
      price = totalPrice - totalPrice * (commission / 100)
    }

    const product = rent.product as Product & { contract: boolean }

    let availablePrice = 0
    let pendingPrice = 0
    let transferredPrice = 0

    // Calcul du prix disponible
    if (product.contract && rent.payment === PaymentStatus.CLIENT_PAID) {
      availablePrice = price
    } else if (
      rent.status === (RentStatus.CHECKIN || RentStatus.RESERVED) &&
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

    // Calcul du prix déjà viré à l'hébergeur
    switch (rent.payment) {
      case PaymentStatus.MID_TRANSFER_DONE:
        transferredPrice = price / 2
        break
      case PaymentStatus.REST_TRANSFER_DONE:
        // Si on a fait le virement du reste, cela signifie qu'on a déjà fait le virement partiel
        transferredPrice = price
        break
      case PaymentStatus.FULL_TRANSFER_DONE:
        transferredPrice = price
        break
      default:
        transferredPrice = 0
    }

    return {
      totalPricesPayable: price,
      availablePrice,
      pendingPrice,
      transferredPrice,
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
    console.log('Creating payment request:', { rentId, type, userId, notes, method })

    const rent = await prisma.rent.findUnique({
      where: { id: rentId },
      include: {
        product: {
          include: {
            owner: true,
          },
        },
        user: true, // Locataire
      },
    })

    if (!rent) throw new Error('No rent found with this ID')

    console.log('Rent details:', {
      status: rent.status,
      payment: rent.payment,
      hasContract: !!rent.product.contract,
    })

    // Trouver l'hôte (propriétaire du produit)
    const host = rent.product.owner
    if (!host) throw new Error('No host found for this product')

    // Use new pricing fields with fallback to legacy calculation
    let price: number
    let totalPrice: number
    let commission: number

    if (rent.hostAmount !== null && rent.hostAmount !== undefined) {
      // New pricing system
      price = Number(rent.hostAmount)
      totalPrice = Number(rent.totalAmount || rent.prices)
      commission = Number(rent.hostCommission || 0)
    } else {
      // Legacy calculation for old reservations
      totalPrice = Number(rent.prices)
      commission = rent.product.commission
      price = totalPrice - totalPrice * (commission / 100)
    }

    let payrequest
    let requestedAmount = price

    if (
      type == PaymentStatus.FULL_TRANSFER_REQ &&
      (rent.status == RentStatus.RESERVED ||
        rent.status == RentStatus.CHECKOUT ||
        rent.product.contract)
    ) {
      payrequest = await prisma.payRequest.create({
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
      requestedAmount = price
    } else if (
      type == PaymentStatus.MID_TRANSFER_REQ &&
      (rent.status == RentStatus.RESERVED ||
        rent.status == RentStatus.CHECKIN ||
        rent.product.contract)
    ) {
      const tempPrices = price / 2
      payrequest = await prisma.payRequest.create({
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
      requestedAmount = tempPrices
    } else if (
      type == PaymentStatus.REST_TRANSFER_REQ &&
      rent.payment == PaymentStatus.MID_TRANSFER_DONE
    ) {
      const tempPrices = price / 2
      payrequest = await prisma.payRequest.create({
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
      requestedAmount = tempPrices
    } else {
      console.log('Payment request rejected - conditions not met:', {
        type,
        rentStatus: rent.status,
        rentPayment: rent.payment,
        hasContract: !!rent.product.contract,
      })
      throw new Error(
        `Invalid payment request type (${type}) or rent status (${rent.status}). Payment status: ${rent.payment}`
      )
    }

    if (!payrequest) throw new Error('Failed to create payment request')

    console.log('Payment request created successfully:', payrequest.id)

    const updateRent = await prisma.rent.update({
      where: { id: rentId },
      data: {
        payment: type,
      },
    })
    if (!updateRent) throw new Error('Impossible to update rent')

    // Préparer les variables pour les templates email
    const getPaymentTypeLabel = (paymentType: PaymentStatus) => {
      switch (paymentType) {
        case PaymentStatus.FULL_TRANSFER_REQ:
          return 'Demande de paiement intégral'
        case PaymentStatus.MID_TRANSFER_REQ:
          return 'Demande de paiement de 50%'
        case PaymentStatus.REST_TRANSFER_REQ:
          return 'Demande du solde restant'
        default:
          return 'Demande de paiement'
      }
    }

    const getPaymentMethodLabel = (paymentMethod: PaymentMethod) => {
      switch (paymentMethod) {
        case PaymentMethod.SEPA_VIREMENT:
          return 'Virement SEPA'
        case PaymentMethod.TAPTAP:
          return 'Taptap'
        case PaymentMethod.PAYPAL:
          return 'PayPal'
        case PaymentMethod.INTERNATIONAL:
          return 'Virement International'
        case PaymentMethod.OTHER:
          return 'Autre'
        default:
          return 'Non spécifié'
      }
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    const formatAmount = (amount: number) => {
      return amount.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      })
    }

    const emailVariables = {
      hostName: (host.name || 'Hôte') + (host.lastname ? ' ' + host.lastname : ''),
      hostEmail: host.email,
      guestName:
        (rent.user.name || 'Locataire') + (rent.user.lastname ? ' ' + rent.user.lastname : ''),
      guestEmail: rent.user.email,
      paymentType: getPaymentTypeLabel(type),
      paymentMethod: getPaymentMethodLabel(method),
      amount: formatAmount(requestedAmount),
      totalPrice: formatAmount(totalPrice),
      commission: rent.product.commission.toString(),
      productTitle: rent.product.name,
      startDate: formatDate(rent.arrivingDate),
      endDate: formatDate(rent.leavingDate),
      requestDate: formatDate(new Date()),
      notes: notes || '',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/host/reservations/${rentId}`,
      reservationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reservations/${rentId}`,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/payment`,
    }

    // Envoi d'emails en parallèle (sans bloquer en cas d'erreur)
    try {
      // Email à l'hôte (confirmation)
      await sendEmailFromTemplate(
        'payment-request-host',
        host.email,
        `Demande de paiement envoyée - ${rent.product.name}`,
        emailVariables
      )

      // Email au locataire (information)
      await sendEmailFromTemplate(
        'payment-request-guest',
        rent.user.email,
        `Information - Demande de paiement en cours - ${rent.product.name}`,
        emailVariables
      )

      // Email aux administrateurs
      if (process.env.ADMIN_EMAIL) {
        await sendEmailFromTemplate(
          'payment-request-admin',
          process.env.ADMIN_EMAIL,
          `[ADMIN] Nouvelle demande de paiement - ${rent.product.name}`,
          emailVariables
        )
      }

      console.log('Emails de demande de paiement envoyés avec succès')
    } catch (emailError) {
      console.error("Erreur lors de l'envoi des emails:", emailError)
      // Ne pas faire échouer la création de la demande si les emails échouent
    }

    return {
      success: true,
      payRequest: payrequest,
      message: 'Demande de paiement créée avec succès',
    }
  } catch (e) {
    console.error('Error in createPayRequest:', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Erreur inconnue',
    }
  }
}

export async function getAllPaymentRequest() {
  try {
    console.log('Searching for all payment requests...')
    const request = await prisma.payRequest.findMany({
      // Supprimer le filtre pour récupérer toutes les demandes
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        rent: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        // Trier par ID décroissant pour avoir les plus récentes en premier
        id: 'desc',
      },
    })
    console.log(`Found ${request.length} payment requests`)
    return { payRequest: request }
  } catch (error) {
    console.error('Error in getAllPaymentRequest:', error)
    throw error
  }
}

export async function getPaymentRequestById(id: string) {
  try {
    console.log(`Searching for payment request with id: ${id}`)
    const request = await prisma.payRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        rent: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!request) {
      throw new Error('Payment request not found')
    }

    // Transformer les données pour correspondre à l'interface attendue
    const transformedRequest = {
      ...request,
      createdAt: new Date().toISOString(), // Valeur par défaut car le modèle n'a pas ce champ
      updatedAt: new Date().toISOString(), // Valeur par défaut car le modèle n'a pas ce champ
      rent: {
        ...request.rent,
        checkIn: request.rent.arrivingDate.toISOString(),
        checkOut: request.rent.leavingDate.toISOString(),
        totalPrice: Number(request.rent.prices),
        product: {
          ...request.rent.product,
          address: request.rent.product.name, // Utiliser le nom comme adresse pour l'instant
        },
      },
    }

    console.log(`Found payment request: ${request.id}`)
    return transformedRequest
  } catch (error) {
    console.error('Error in getPaymentRequestById:', error)
    throw error
  }
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

export async function rejectPaymentRequest(id: string, reason: string) {
  try {
    console.log('Rejecting payment request:', id, 'Reason:', reason)

    const payRequest = await prisma.payRequest.findUnique({
      where: { id },
      include: {
        user: true,
        rent: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!payRequest) throw new Error('Payment Request not found')

    // Mettre à jour le statut de la demande
    const updateReq = await prisma.payRequest.update({
      where: { id: id },
      data: {
        status: PaymentReqStatus.REFUSED,
        notes: reason, // Ajouter la raison du refus aux notes
      },
    })

    // Remettre le statut de rent à l'état précédent
    let previousStatus: PaymentStatus = PaymentStatus.CLIENT_PAID
    if (payRequest.PaymentRequest === PaymentStatus.REST_TRANSFER_REQ) {
      previousStatus = PaymentStatus.MID_TRANSFER_DONE
    }

    const updateRent = await prisma.rent.update({
      where: { id: updateReq.rentId },
      data: {
        payment: previousStatus,
      },
    })

    // Envoyer un email de notification du refus
    try {
      const emailVariables = {
        hostName:
          (payRequest.user.name || 'Hôte') +
          (payRequest.user.lastname ? ' ' + payRequest.user.lastname : ''),
        amount: Number(payRequest.prices).toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }),
        productTitle: payRequest.rent.product.name,
        reason: reason,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/host/reservations/${payRequest.rentId}`,
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Email variables for rejection:', emailVariables)
      }

      // Envoyer l'email de refus
      await sendEmailFromTemplate(
        'payment-request-rejected',
        payRequest.user.email,
        `Demande de paiement refusée - ${payRequest.rent.product.name}`,
        emailVariables
      )

      console.log('Email de refus envoyé avec succès à:', payRequest.user.email)
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de refus:", emailError)
      // Ne pas faire échouer la demande si l'email ne peut pas être envoyé
    }

    return { request: updateReq, rent: updateRent }
  } catch (e) {
    console.error('Error in rejectPaymentRequest:', e)
    throw e
  }
}

export async function requestPaymentInfo(id: string, infoRequest: string) {
  try {
    console.log('Requesting info for payment request:', id, 'Info:', infoRequest)

    const payRequest = await prisma.payRequest.findUnique({
      where: { id },
      include: {
        user: true,
        rent: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!payRequest) throw new Error('Payment Request not found')

    // Pour l'instant, on utilise RECEIVED et on ajoute l'info dans les notes
    // On pourrait ajouter un nouveau statut INFO_REQUESTED dans le futur
    const updateReq = await prisma.payRequest.update({
      where: { id: id },
      data: {
        notes: `${payRequest.notes || ''}\n\n[INFO DEMANDÉE]: ${infoRequest}`,
      },
    })

    // Envoyer un email de demande d'informations
    try {
      const emailVariables = {
        hostName:
          (payRequest.user.name || 'Hôte') +
          (payRequest.user.lastname ? ' ' + payRequest.user.lastname : ''),
        amount: Number(payRequest.prices).toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }),
        productTitle: payRequest.rent.product.name,
        infoRequest: infoRequest,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/host/reservations/${payRequest.rentId}`,
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Email variables for info request:', emailVariables)
      }

      // Envoyer l'email de demande d'informations
      await sendEmailFromTemplate(
        'payment-request-info-needed',
        payRequest.user.email,
        `Informations supplémentaires requises - ${payRequest.rent.product.name}`,
        emailVariables
      )

      console.log("Email de demande d'informations envoyé avec succès à:", payRequest.user.email)
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de demande d'info:", emailError)
      // Ne pas faire échouer la demande si l'email ne peut pas être envoyé
    }
    return updateReq
  } catch (e) {
    console.error('Error in requestPaymentInfo:', e)
    throw e
  }
}
