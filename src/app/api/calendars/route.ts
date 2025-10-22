import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createCentralizedCalendar,
  getUserExternalCalendars,
} from '@/lib/services/centralized-calendar.service'

/**
 * GET /api/calendars
 * Récupérer tous les calendriers externes d'un host
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const calendars = await getUserExternalCalendars(session.user.id)

    return NextResponse.json(calendars)
  } catch (error: unknown) {
    console.error('Error fetching calendars:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/calendars
 * Créer un nouveau calendrier externe centralisé
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, icalUrl, color, description } = body

    if (!name || !icalUrl) {
      return NextResponse.json({ error: 'Nom et URL ICS requis' }, { status: 400 })
    }

    const calendar = await createCentralizedCalendar({
      userId: session.user.id,
      name,
      icalUrl,
      color,
      description,
    })

    return NextResponse.json(calendar, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating calendar:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
