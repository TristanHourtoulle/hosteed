/**
 * API Route: Admin - Get All Withdrawal Requests
 * GET /api/admin/withdrawals
 *
 * Récupère toutes les demandes de retrait (admin/host_manager uniquement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllWithdrawalRequests } from '@/lib/services/withdrawal.service'
import { WithdrawalStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin ou host manager
    if (!session.user.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin/Host Manager uniquement' },
        { status: 403 }
      )
    }

    // Récupérer les paramètres de filtrage
    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')
    const limitParam = url.searchParams.get('limit')
    const offsetParam = url.searchParams.get('offset')

    let status: WithdrawalStatus | WithdrawalStatus[] | undefined
    if (statusParam) {
      // Support pour plusieurs statuts séparés par des virgules
      const statuses = statusParam.split(',') as WithdrawalStatus[]
      status = statuses.length === 1 ? statuses[0] : statuses
    }

    const requests = await getAllWithdrawalRequests({
      status,
      limit: limitParam ? parseInt(limitParam) : undefined,
      offset: offsetParam ? parseInt(offsetParam) : undefined,
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error getting withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    )
  }
}
