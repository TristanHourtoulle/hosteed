/**
 * API Route: Create Withdrawal Request (Host)
 * POST /api/withdrawals/create
 *
 * Permet à un hôte de créer une demande de retrait
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PaymentMethod, WithdrawalStatus, WithdrawalType } from '@prisma/client'
import { calculateHostBalance } from '@/lib/services/withdrawal.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, withdrawalType, paymentMethod, savePaymentMethod, paymentDetails } = body

    // Validation des paramètres
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    if (!withdrawalType || !['PARTIAL_50', 'FULL_100'].includes(withdrawalType)) {
      return NextResponse.json({ error: 'Type de retrait invalide' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Moyen de paiement requis' }, { status: 400 })
    }

    // Vérifier le solde disponible
    const balance = await calculateHostBalance(session.user.id)

    const maxAmount =
      withdrawalType === 'PARTIAL_50' ? balance.amount50Percent : balance.amount100Percent

    if (amount > maxAmount) {
      return NextResponse.json(
        { error: `Montant demandé (${amount}€) supérieur au montant disponible (${maxAmount}€)` },
        { status: 400 }
      )
    }

    // Créer un compte de paiement si l'utilisateur souhaite le sauvegarder
    let paymentAccountId: string | undefined

    if (savePaymentMethod && paymentDetails) {
      const paymentAccountData: Record<string, string | boolean> = {
        userId: session.user.id,
        method: paymentMethod,
        isValidated: false, // Nécessite validation admin
      }

      // Mapper les champs selon le moyen de paiement
      if (paymentMethod === 'SEPA_VIREMENT') {
        paymentAccountData.accountHolderName = paymentDetails.accountHolderName
        paymentAccountData.iban = paymentDetails.iban
      } else if (paymentMethod === 'PRIPEO') {
        paymentAccountData.accountHolderName = paymentDetails.accountHolderName
        paymentAccountData.cardNumber = paymentDetails.cardNumber
        paymentAccountData.cardEmail = paymentDetails.cardEmail
      } else if (paymentMethod === 'MOBILE_MONEY') {
        paymentAccountData.accountHolderName = paymentDetails.accountHolderName
        paymentAccountData.mobileNumber = paymentDetails.mobileNumber
      } else if (paymentMethod === 'PAYPAL') {
        paymentAccountData.accountHolderName = paymentDetails.paypalUsername
        paymentAccountData.paypalUsername = paymentDetails.paypalUsername
        paymentAccountData.paypalEmail = paymentDetails.paypalEmail
        paymentAccountData.paypalPhone = paymentDetails.paypalPhone
        paymentAccountData.paypalIban = paymentDetails.paypalIban
      } else if (paymentMethod === 'MONEYGRAM') {
        paymentAccountData.accountHolderName = paymentDetails.moneygramFullName
        paymentAccountData.moneygramFullName = paymentDetails.moneygramFullName
        paymentAccountData.moneygramPhone = paymentDetails.moneygramPhone
      }

      const paymentAccount = await prisma.paymentAccount.create({
        data: {
          userId: paymentAccountData.userId as string,
          method: paymentAccountData.method as PaymentMethod,
          accountHolderName: paymentAccountData.accountHolderName as string,
          isValidated: paymentAccountData.isValidated as boolean,
          iban: paymentAccountData.iban as string | undefined,
          cardNumber: paymentAccountData.cardNumber as string | undefined,
          cardEmail: paymentAccountData.cardEmail as string | undefined,
          mobileNumber: paymentAccountData.mobileNumber as string | undefined,
          paypalUsername: paymentAccountData.paypalUsername as string | undefined,
          paypalEmail: paymentAccountData.paypalEmail as string | undefined,
          paypalPhone: paymentAccountData.paypalPhone as string | undefined,
          paypalIban: paymentAccountData.paypalIban as string | undefined,
          moneygramFullName: paymentAccountData.moneygramFullName as string | undefined,
          moneygramPhone: paymentAccountData.moneygramPhone as string | undefined,
        },
      })

      paymentAccountId = paymentAccount.id
    }

    // Déterminer le statut initial
    const status: WithdrawalStatus = paymentAccountId
      ? WithdrawalStatus.ACCOUNT_VALIDATION // Nouveau compte = validation requise
      : WithdrawalStatus.PENDING

    // Créer la demande de retrait
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount,
        availableBalance: balance.availableBalance, // Save balance at time of request
        withdrawalType: withdrawalType as WithdrawalType,
        status,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentAccountId: paymentAccountId || undefined,
        paymentDetails: paymentDetails as never,
        notes: `Demande créée par ${session.user.name || session.user.email}`,
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

    // TODO: Envoyer un email de confirmation à l'hôte
    // TODO: Envoyer une notification aux admins

    return NextResponse.json({
      success: true,
      request: withdrawalRequest,
      message:
        status === WithdrawalStatus.ACCOUNT_VALIDATION
          ? 'Demande créée. Votre compte de paiement doit être validé par un administrateur.'
          : 'Demande de retrait créée avec succès. Un administrateur va la traiter sous peu.',
    })
  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande de retrait' },
      { status: 500 }
    )
  }
}
