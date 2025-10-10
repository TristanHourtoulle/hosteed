/**
 * Withdrawal Service
 *
 * Gère le système de retrait pour les hôtes:
 * - Calcul du solde disponible basé sur les réservations
 * - Création et gestion des demandes de retrait
 * - Gestion des comptes de paiement
 * - Workflow de validation et de paiement
 */

import { prisma } from '@/lib/prisma'
import {
  PaymentMethod,
  WithdrawalType,
  WithdrawalStatus,
  PaymentStatus,
  type PaymentAccount,
  type WithdrawalRequest,
  type Prisma,
} from '@prisma/client'

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface HostBalance {
  userId: string
  totalEarned: number // Total gagné de toutes les réservations
  totalWithdrawn: number // Total déjà retiré
  availableBalance: number // Solde disponible
  pendingWithdrawals: number // Montant en attente de retrait
  canWithdraw50Percent: boolean // Peut retirer 50%
  canWithdraw100Percent: boolean // Peut retirer 100%
  amount50Percent: number // Montant disponible à 50%
  amount100Percent: number // Montant disponible à 100%
}

export interface PaymentAccountData {
  method: PaymentMethod
  accountHolderName: string
  // SEPA
  iban?: string
  // Pripeo
  cardNumber?: string
  cardEmail?: string
  // Mobile Money
  mobileNumber?: string
  // PayPal
  paypalUsername?: string
  paypalEmail?: string
  paypalPhone?: string
  paypalIban?: string
  // MoneyGram
  moneygramFullName?: string
  moneygramPhone?: string
}

export interface WithdrawalRequestData {
  userId: string
  amount: number
  withdrawalType: WithdrawalType
  paymentAccountId?: string
  paymentMethod: PaymentMethod
  paymentDetails: Record<string, any>
  notes?: string
}

// ============================================
// CALCUL DU SOLDE
// ============================================

/**
 * Calcule le solde disponible pour un hôte basé sur ses réservations payées
 *
 * Logique:
 * - Réservations avec statut CLIENT_PAID ou MID_TRANSFER_DONE = montant disponible
 * - Total retiré = somme des retraits avec statut PAID
 * - Solde disponible = Total gagné - Total retiré - Retraits en attente
 */
export async function calculateHostBalance(userId: string): Promise<HostBalance> {
  // 1. Récupérer toutes les réservations payées de l'hôte
  const paidRents = await prisma.rent.findMany({
    where: {
      product: {
        userManager: BigInt(userId),
      },
      payment: {
        in: [PaymentStatus.CLIENT_PAID, PaymentStatus.MID_TRANSFER_DONE, PaymentStatus.FULL_TRANSFER_DONE],
      },
    },
    select: {
      id: true,
      prices: true,
      payment: true,
    },
  })

  // 2. Calculer le total gagné (en soustrayant les commissions)
  const totalEarned = paidRents.reduce((sum, rent) => {
    const price = parseFloat(rent.prices)
    // TODO: Récupérer la commission réelle pour chaque réservation
    // Pour l'instant, on utilise le prix total
    return sum + price
  }, 0)

  // 3. Calculer le total déjà retiré
  const withdrawnRequests = await prisma.withdrawalRequest.findMany({
    where: {
      userId,
      status: WithdrawalStatus.PAID,
    },
    select: {
      amount: true,
    },
  })

  const totalWithdrawn = withdrawnRequests.reduce((sum, req) => sum + req.amount, 0)

  // 4. Calculer les retraits en attente
  const pendingRequests = await prisma.withdrawalRequest.findMany({
    where: {
      userId,
      status: {
        in: [WithdrawalStatus.PENDING, WithdrawalStatus.ACCOUNT_VALIDATION, WithdrawalStatus.APPROVED],
      },
    },
    select: {
      amount: true,
    },
  })

  const pendingWithdrawals = pendingRequests.reduce((sum, req) => sum + req.amount, 0)

  // 5. Calculer le solde disponible
  const availableBalance = totalEarned - totalWithdrawn - pendingWithdrawals

  // 6. Déterminer les montants disponibles selon le type de retrait
  const amount50Percent = availableBalance * 0.5
  const amount100Percent = availableBalance

  return {
    userId,
    totalEarned,
    totalWithdrawn,
    availableBalance,
    pendingWithdrawals,
    canWithdraw50Percent: amount50Percent > 0,
    canWithdraw100Percent: amount100Percent > 0,
    amount50Percent,
    amount100Percent,
  }
}

// ============================================
// GESTION DES COMPTES DE PAIEMENT
// ============================================

/**
 * Créer un nouveau compte de paiement pour un hôte
 */
export async function createPaymentAccount(
  userId: string,
  data: PaymentAccountData
): Promise<PaymentAccount> {
  // Valider les champs requis selon la méthode de paiement
  validatePaymentAccountData(data)

  // Si c'est le premier compte, le marquer comme défaut
  const existingAccounts = await prisma.paymentAccount.count({
    where: { userId },
  })

  const isDefault = existingAccounts === 0

  return prisma.paymentAccount.create({
    data: {
      userId,
      ...data,
      isDefault,
      isValidated: false,
    },
  })
}

/**
 * Récupérer tous les comptes de paiement d'un hôte
 */
export async function getPaymentAccounts(userId: string): Promise<PaymentAccount[]> {
  return prisma.paymentAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
}

/**
 * Définir un compte de paiement comme compte par défaut
 */
export async function setDefaultPaymentAccount(
  userId: string,
  accountId: string
): Promise<PaymentAccount> {
  // Retirer le flag default des autres comptes
  await prisma.paymentAccount.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  })

  // Définir le nouveau compte par défaut
  return prisma.paymentAccount.update({
    where: { id: accountId, userId },
    data: { isDefault: true },
  })
}

/**
 * Valider un compte de paiement (Admin uniquement)
 */
export async function validatePaymentAccount(
  accountId: string,
  adminId: string
): Promise<PaymentAccount> {
  return prisma.paymentAccount.update({
    where: { id: accountId },
    data: {
      isValidated: true,
      validatedAt: new Date(),
      validatedBy: adminId,
    },
  })
}

/**
 * Supprimer un compte de paiement
 */
export async function deletePaymentAccount(
  userId: string,
  accountId: string
): Promise<void> {
  // Vérifier qu'il n'y a pas de retraits en attente avec ce compte
  const pendingWithdrawals = await prisma.withdrawalRequest.count({
    where: {
      paymentAccountId: accountId,
      status: {
        in: [WithdrawalStatus.PENDING, WithdrawalStatus.ACCOUNT_VALIDATION, WithdrawalStatus.APPROVED],
      },
    },
  })

  if (pendingWithdrawals > 0) {
    throw new Error('Impossible de supprimer un compte avec des retraits en attente')
  }

  await prisma.paymentAccount.delete({
    where: { id: accountId, userId },
  })
}

// ============================================
// GESTION DES DEMANDES DE RETRAIT
// ============================================

/**
 * Créer une nouvelle demande de retrait
 */
export async function createWithdrawalRequest(
  data: WithdrawalRequestData
): Promise<WithdrawalRequest> {
  const { userId, amount, withdrawalType, paymentAccountId, paymentMethod, paymentDetails, notes } = data

  // 1. Vérifier le solde disponible
  const balance = await calculateHostBalance(userId)

  const maxAmount = withdrawalType === WithdrawalType.PARTIAL_50
    ? balance.amount50Percent
    : balance.amount100Percent

  if (amount > maxAmount) {
    throw new Error(`Montant demandé (${amount}€) supérieur au montant disponible (${maxAmount}€)`)
  }

  if (amount <= 0) {
    throw new Error('Le montant doit être supérieur à 0')
  }

  // 2. Vérifier si le compte de paiement est validé
  let status = WithdrawalStatus.PENDING

  if (paymentAccountId) {
    const account = await prisma.paymentAccount.findUnique({
      where: { id: paymentAccountId },
    })

    if (!account) {
      throw new Error('Compte de paiement introuvable')
    }

    if (!account.isValidated) {
      status = WithdrawalStatus.ACCOUNT_VALIDATION
    }
  } else {
    // Nouveau compte, nécessite validation
    status = WithdrawalStatus.ACCOUNT_VALIDATION
  }

  // 3. Créer la demande de retrait
  return prisma.withdrawalRequest.create({
    data: {
      userId,
      amount,
      availableBalance: balance.availableBalance,
      withdrawalType,
      paymentAccountId,
      paymentMethod,
      paymentDetails,
      notes,
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      paymentAccount: true,
    },
  })
}

/**
 * Récupérer toutes les demandes de retrait d'un hôte
 */
export async function getWithdrawalRequests(
  userId: string,
  filters?: {
    status?: WithdrawalStatus | WithdrawalStatus[]
    limit?: number
    offset?: number
  }
): Promise<WithdrawalRequest[]> {
  const where: Prisma.WithdrawalRequestWhereInput = { userId }

  if (filters?.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status
  }

  return prisma.withdrawalRequest.findMany({
    where,
    include: {
      paymentAccount: true,
      processor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit,
    skip: filters?.offset,
  })
}

/**
 * Récupérer toutes les demandes de retrait (Admin)
 */
export async function getAllWithdrawalRequests(
  filters?: {
    status?: WithdrawalStatus | WithdrawalStatus[]
    limit?: number
    offset?: number
  }
): Promise<WithdrawalRequest[]> {
  const where: Prisma.WithdrawalRequestWhereInput = {}

  if (filters?.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status
  }

  return prisma.withdrawalRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      paymentAccount: true,
      processor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit,
    skip: filters?.offset,
  })
}

/**
 * Approuver une demande de retrait (Admin)
 */
export async function approveWithdrawalRequest(
  requestId: string,
  adminId: string,
  adminNotes?: string
): Promise<WithdrawalRequest> {
  return prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.APPROVED,
      processedBy: adminId,
      processedAt: new Date(),
      adminNotes,
    },
    include: {
      user: true,
      paymentAccount: true,
    },
  })
}

/**
 * Rejeter une demande de retrait (Admin)
 */
export async function rejectWithdrawalRequest(
  requestId: string,
  adminId: string,
  rejectionReason: string
): Promise<WithdrawalRequest> {
  return prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.REJECTED,
      processedBy: adminId,
      processedAt: new Date(),
      rejectionReason,
    },
    include: {
      user: true,
    },
  })
}

/**
 * Marquer une demande de retrait comme payée (Admin)
 */
export async function markWithdrawalAsPaid(
  requestId: string,
  adminId: string
): Promise<WithdrawalRequest> {
  return prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.PAID,
      processedBy: adminId,
      paidAt: new Date(),
    },
    include: {
      user: true,
      paymentAccount: true,
    },
  })
}

/**
 * Annuler une demande de retrait (Host uniquement, si encore en attente)
 */
export async function cancelWithdrawalRequest(
  requestId: string,
  userId: string
): Promise<WithdrawalRequest> {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Demande de retrait introuvable')
  }

  if (request.userId !== userId) {
    throw new Error('Non autorisé')
  }

  if (request.status !== WithdrawalStatus.PENDING && request.status !== WithdrawalStatus.ACCOUNT_VALIDATION) {
    throw new Error('Impossible d\'annuler une demande déjà traitée')
  }

  return prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.CANCELLED,
    },
  })
}

// ============================================
// VALIDATION DES DONNÉES
// ============================================

function validatePaymentAccountData(data: PaymentAccountData): void {
  const { method } = data

  switch (method) {
    case PaymentMethod.SEPA_VIREMENT:
      if (!data.iban) {
        throw new Error('IBAN requis pour SEPA')
      }
      break

    case PaymentMethod.PRIPEO:
      if (!data.cardNumber || !data.cardEmail) {
        throw new Error('Numéro de carte et email requis pour Pripeo')
      }
      break

    case PaymentMethod.MOBILE_MONEY:
      if (!data.mobileNumber) {
        throw new Error('Numéro de téléphone requis pour Mobile Money')
      }
      // Valider le format +261 XX XX XXX XX
      if (!data.mobileNumber.match(/^\+261\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{2}$/)) {
        throw new Error('Format de numéro invalide. Format attendu: +261 XX XX XXX XX')
      }
      break

    case PaymentMethod.PAYPAL:
      if (!data.paypalEmail) {
        throw new Error('Email requis pour PayPal')
      }
      break

    case PaymentMethod.MONEYGRAM:
      if (!data.moneygramFullName || !data.moneygramPhone) {
        throw new Error('Nom complet et téléphone requis pour MoneyGram')
      }
      break

    default:
      throw new Error(`Méthode de paiement non supportée: ${method}`)
  }
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupérer les statistiques de retrait pour un hôte
 */
export async function getWithdrawalStats(userId: string) {
  const balance = await calculateHostBalance(userId)

  const requests = await prisma.withdrawalRequest.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
    _sum: {
      amount: true,
    },
  })

  return {
    balance,
    requests: requests.map(r => ({
      status: r.status,
      count: r._count,
      totalAmount: r._sum.amount || 0,
    })),
  }
}
