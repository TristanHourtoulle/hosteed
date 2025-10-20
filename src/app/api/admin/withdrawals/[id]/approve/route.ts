/**
 * API Route: Admin - Approve Withdrawal Request
 * PUT /api/admin/withdrawals/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { approveWithdrawalRequest } from '@/lib/services/withdrawal.service'

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
    const body = await request.json()
    const { adminNotes } = body

    const withdrawalRequest = await approveWithdrawalRequest(id, session.user.id, adminNotes)

    // TODO: Envoyer email de notification à l'hôte

    return NextResponse.json(withdrawalRequest)
  } catch (error) {
    console.error('Error approving withdrawal request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'approbation" },
      { status: 400 }
    )
  }
}
