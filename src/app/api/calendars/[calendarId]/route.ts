import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getExternalCalendar,
  updateExternalCalendar,
  deleteExternalCalendar,
} from '@/lib/services/centralized-calendar.service'

/**
 * GET /api/calendars/[calendarId]
 * Récupérer un calendrier externe spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { calendarId } = await params
    const calendar = await getExternalCalendar(calendarId)

    if (!calendar) {
      return NextResponse.json({ error: 'Calendrier introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est propriétaire
    if (calendar.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    return NextResponse.json(calendar)
  } catch (error: unknown) {
    console.error('Error fetching calendar:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/calendars/[calendarId]
 * Mettre à jour un calendrier externe
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { calendarId } = await params
    const calendar = await getExternalCalendar(calendarId)

    if (!calendar) {
      return NextResponse.json({ error: 'Calendrier introuvable' }, { status: 404 })
    }

    if (calendar.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await updateExternalCalendar(calendarId, body)

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Error updating calendar:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/calendars/[calendarId]
 * Supprimer un calendrier externe et ses mappings
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { calendarId } = await params
    const calendar = await getExternalCalendar(calendarId)

    if (!calendar) {
      return NextResponse.json({ error: 'Calendrier introuvable' }, { status: 404 })
    }

    if (calendar.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await deleteExternalCalendar(calendarId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting calendar:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
