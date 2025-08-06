import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmailVerification } from '@/lib/services/user.service'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Vérifier que l'utilisateur est admin
    if (!session || session.user.roles !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userIds, mode } = body // mode: 'all', 'selected', 'single'

    let usersToNotify: { id: string; email: string; name: string | null }[] = []

    if (mode === 'all') {
      // Tous les utilisateurs non vérifiés
      usersToNotify = await prisma.user.findMany({
        where: {
          emailVerified: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
    } else if (mode === 'selected' && userIds) {
      // Utilisateurs sélectionnés non vérifiés
      usersToNotify = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          emailVerified: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
    } else if (mode === 'single' && userIds && userIds.length === 1) {
      // Un seul utilisateur
      const user = await prisma.user.findFirst({
        where: {
          id: userIds[0],
          emailVerified: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
      if (user) usersToNotify = [user]
    }

    if (usersToNotify.length === 0) {
      return NextResponse.json(
        { message: 'Aucun utilisateur non vérifié trouvé' },
        { status: 404 }
      )
    }

    const results = []
    
    for (const user of usersToNotify) {
      try {
        await sendEmailVerification(user.id)
        results.push({
          userId: user.id,
          email: user.email,
          success: true,
        })
      } catch (error) {
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Emails envoyés: ${successCount} réussis, ${failureCount} échoués`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failures: failureCount,
      },
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails de vérification:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
