import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminCreatedReviews } from '@/lib/services/admin-reviews.service'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Future: could use query parameters for pagination and filtering

    const result = await getAdminCreatedReviews(session.user.id!)

    if (result.success) {
      return NextResponse.json({
        success: true,
        reviews: result.reviews,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la récupération des avis' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des avis administratifs:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
