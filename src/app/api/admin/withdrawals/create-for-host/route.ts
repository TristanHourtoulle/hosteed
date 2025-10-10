/**
 * API Route: Admin - Create Withdrawal Request for Host
 * POST /api/admin/withdrawals/create-for-host
 *
 * Permet à un admin/host_manager de créer une demande de retrait pour un hôte
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createWithdrawalRequest } from '@/lib/services/withdrawal.service'
import { WithdrawalType, PaymentMethod } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!session.user.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin/Host Manager uniquement' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      hostId,
      amount,
      withdrawalType,
      paymentAccountId,
      paymentMethod,
      paymentDetails,
      notes,
    } = body

    // Validation
    if (!hostId) {
      return NextResponse.json({ error: 'ID de l\'hôte requis' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    if (!withdrawalType) {
      return NextResponse.json({ error: 'Type de retrait requis' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Méthode de paiement requise' }, { status: 400 })
    }

    // Créer la demande pour l'hôte
    const withdrawalRequest = await createWithdrawalRequest({
      userId: hostId, // Créer pour l'hôte, pas pour l'admin
      amount,
      withdrawalType: withdrawalType as WithdrawalType,
      paymentAccountId,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentDetails: paymentDetails || {},
      notes: notes || `Demande créée par ${session.user.name || 'admin'} (${session.user.email})`,
    })

    // TODO: Envoyer email de notification à l'hôte

    return NextResponse.json(withdrawalRequest, { status: 201 })
  } catch (error: any) {
    console.error('Error creating withdrawal request for host:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la demande' },
      { status: 400 }
    )
  }
}
