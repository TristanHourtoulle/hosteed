/**
 * API Route: Admin - Mark Withdrawal as Paid
 * PUT /api/admin/withdrawals/[id]/mark-paid
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markWithdrawalAsPaid } from '@/lib/services/withdrawal.service'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const withdrawalRequest = await markWithdrawalAsPaid(id, session.user.id)

    // TODO: Envoyer email de confirmation à l'hôte

    return NextResponse.json(withdrawalRequest)
  } catch (error) {
    console.error('Error marking withdrawal as paid:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du marquage comme payé' },
      { status: 400 }
    )
  }
}
