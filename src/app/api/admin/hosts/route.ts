/**
 * API Route: Admin - Get All Hosts
 * GET /api/admin/hosts
 *
 * Récupère la liste de tous les hôtes (pour sélection)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Récupérer tous les utilisateurs avec rôle HOST qui ont au moins un hébergement
    const hosts = await prisma.user.findMany({
      where: {
        roles: {
          in: ['HOST', 'HOST_VERIFIED', 'HOST_MANAGER']
        },
        // S'assurer qu'ils ont au moins un produit (hébergement)
        Product: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        createdAt: true,
        _count: {
          select: {
            Product: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ hosts })
  } catch (error) {
    console.error('Error getting hosts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des hôtes' },
      { status: 500 }
    )
  }
}
