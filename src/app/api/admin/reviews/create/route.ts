import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminReview, createAdvancedAdminReview } from '@/lib/services/admin-reviews.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      productId,
      grade,
      welcomeGrade,
      staff,
      comfort,
      equipment,
      cleaning,
      title,
      text,
      visitingDate,
      publishDate,
      useRealUser,
      fakeUserName,
      fakeUserEmail,
    } = body

    // Validation des données requises
    if (!productId || !title || !text || !visitingDate) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (useRealUser && (!fakeUserName || !fakeUserEmail)) {
      return NextResponse.json(
        { error: 'Nom et email requis pour un utilisateur fictif' },
        { status: 400 }
      )
    }

    let result

    if (useRealUser) {
      result = await createAdvancedAdminReview({
        productId,
        adminId: session.user.id!,
        grade: parseInt(grade) || 5,
        welcomeGrade: parseInt(welcomeGrade) || 5,
        staff: parseInt(staff) || 5,
        comfort: parseInt(comfort) || 5,
        equipment: parseInt(equipment) || 5,
        cleaning: parseInt(cleaning) || 5,
        title,
        text,
        visitingDate: new Date(visitingDate),
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        fakeUserName,
        fakeUserEmail,
      })
    } else {
      result = await createAdminReview({
        productId,
        adminId: session.user.id!,
        grade: parseInt(grade) || 5,
        welcomeGrade: parseInt(welcomeGrade) || 5,
        staff: parseInt(staff) || 5,
        comfort: parseInt(comfort) || 5,
        equipment: parseInt(equipment) || 5,
        cleaning: parseInt(cleaning) || 5,
        title,
        text,
        visitingDate: new Date(visitingDate),
        publishDate: publishDate ? new Date(publishDate) : new Date(),
      })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        review: result.review,
        message: 'Avis administratif créé avec succès',
      })
    } else {
      return NextResponse.json(
        { error: result.error || "Erreur lors de la création de l'avis" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'avis administratif:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
