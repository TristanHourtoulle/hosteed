/**
 * API Route: Admin - Reject Withdrawal Request
 * PUT /api/admin/withdrawals/[id]/reject
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { rejectWithdrawalRequest } from '@/lib/services/withdrawal.service'

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
    const body = await request.json()
    const { rejectionReason } = body

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'La raison du refus est requise' },
        { status: 400 }
      )
    }

    const withdrawalRequest = await rejectWithdrawalRequest(
      id,
      session.user.id,
      rejectionReason
    )

    // TODO: Envoyer email de notification à l'hôte

    return NextResponse.json(withdrawalRequest)
  } catch (error) {
    console.error('Error rejecting withdrawal request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du refus' },
      { status: 400 }
    )
  }
}
