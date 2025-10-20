/**
 * API Route: Admin - Validate Payment Account
 * PUT /api/admin/withdrawals/payment-accounts/[id]/validate
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validatePaymentAccount } from '@/lib/services/withdrawal.service'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params

    const paymentAccount = await validatePaymentAccount(id, session.user.id)

    // TODO: Envoyer email de notification à l'hôte

    return NextResponse.json(paymentAccount)
  } catch (error) {
    console.error('Error validating payment account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la validation du compte' },
      { status: 400 }
    )
  }
}
