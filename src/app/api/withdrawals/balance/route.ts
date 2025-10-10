/**
 * API Route: Get Host Balance
 * GET /api/withdrawals/balance
 *
 * Récupère le solde disponible pour un hôte
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { calculateHostBalance } from '@/lib/services/withdrawal.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est un hôte
    if (!session.user.roles || !['HOST', 'HOST_VERIFIED', 'HOST_MANAGER', 'ADMIN'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const balance = await calculateHostBalance(session.user.id)

    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error getting balance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du solde' },
      { status: 500 }
    )
  }
}
