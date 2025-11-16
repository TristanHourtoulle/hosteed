import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getExternalCalendar,
  saveEventMapping,
  getCalendarEventMappings,
} from '@/lib/services/centralized-calendar.service'

/**
 * GET /api/calendars/[calendarId]/mappings
 * Récupérer tous les mappings d'un calendrier
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

    if (calendar.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const mappings = await getCalendarEventMappings(calendarId)

    return NextResponse.json(mappings)
  } catch (error: unknown) {
    console.error('Error fetching mappings:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/calendars/[calendarId]/mappings
 * Sauvegarder ou mettre à jour un mapping d'événement
 */
export async function POST(
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
    const { eventUid, eventTitle, startDate, endDate, productIds } = body

    if (!eventUid || !eventTitle || !startDate || !endDate) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const mapping = await saveEventMapping({
      externalCalendarId: calendarId,
      eventUid,
      eventTitle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      productIds: productIds || [],
    })

    return NextResponse.json(mapping)
  } catch (error: unknown) {
    console.error('Error saving mapping:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
