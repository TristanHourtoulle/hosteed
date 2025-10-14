/**
 * API Route: Admin - Get Host Balance
 * GET /api/admin/withdrawals/balance/[hostId]
 *
 * Permet à un admin/host_manager de voir le solde d'un hôte spécifique
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { calculateHostBalance } from '@/lib/services/withdrawal.service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hostId: string }> }
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

    const { hostId } = await context.params

    const balance = await calculateHostBalance(hostId)

    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error getting host balance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du solde' },
      { status: 500 }
    )
  }
}
