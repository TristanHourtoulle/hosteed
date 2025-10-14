/**
 * API Route: Get Withdrawal Requests (Host)
 * GET /api/withdrawals/requests
 *
 * Récupère les demandes de retrait de l'hôte connecté
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer toutes les demandes de retrait de l'utilisateur
    const requests = await prisma.withdrawalRequest.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        paymentAccount: {
          select: {
            id: true,
            accountHolderName: true,
            isValidated: true,
            method: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes de retrait' },
      { status: 500 }
    )
  }
}
