import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { photo }: { photo: string } = await request.json()

    if (!photo) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    }

    // Validation simple du format base64
    if (!photo.startsWith('data:image/')) {
      return NextResponse.json({ error: "Format d'image invalide" }, { status: 400 })
    }

    // Mettre à jour la photo de profil
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        profilePicture: photo,
      },
      select: {
        id: true,
        profilePicture: true,
      },
    })

    return NextResponse.json({
      message: 'Photo de profil mise à jour avec succès',
      profilePicture: updatedUser.profilePicture,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
