'use server'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateUserRole } from '@/lib/services/user.service'
import { emailService } from '@/lib/services/email'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    // Vérifier que l'utilisateur est connecté et est admin
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params
    const { role } = await request.json()

    // Vérifier que le rôle est valide
    const validRoles = ['ADMIN', 'BLOGWRITER', 'HOST', 'HOST_VERIFIED', 'USER']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Empêcher un admin de modifier son propre rôle
    if (session.user.id === resolvedParams.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUserRole(resolvedParams.id, role)

    if (!updatedUser) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du rôle' }, { status: 500 })
    }

    // Envoyer un email de notification à l'utilisateur
    try {
      const roleInfo = getRoleInfo(role)
      const emailResult = await emailService.sendRoleUpdate(
        updatedUser.email,
        updatedUser.name || updatedUser.lastname || 'Utilisateur',
        roleInfo
      )

      if (!emailResult.success) {
        console.error("Erreur lors de l'envoi de l'email de notification:", emailResult.error)
        // On continue même si l'email échoue, car le rôle a été mis à jour
      }
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError)
      // On continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message:
        "Rôle mis à jour avec succès. Un email de notification a été envoyé à l'utilisateur.",
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

function getRoleInfo(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        class: 'admin',
        emoji: '👑',
        label: 'Administrateur',
        description:
          "Vous avez maintenant accès à toutes les fonctionnalités d'administration de la plateforme.",
      }
    case 'HOST':
    case 'HOST_VERIFIED':
      return {
        class: 'host',
        emoji: '🏠',
        label: role === 'HOST_VERIFIED' ? 'Hôte Vérifié' : 'Hôte',
        description:
          'Vous pouvez maintenant publier et gérer vos propres annonces de logement.',
      }
    case 'BLOGWRITER':
      return {
        class: 'blogwriter',
        emoji: '✍️',
        label: 'Rédacteur',
        description: 'Vous pouvez maintenant créer et gérer des articles de blog.',
      }
    case 'USER':
    default:
      return {
        class: 'guest',
        emoji: '👤',
        label: 'Utilisateur',
        description: 'Vous pouvez rechercher et réserver des logements.',
      }
  }
}
