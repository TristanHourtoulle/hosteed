import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getExternalCalendar,
  applyEventMappings,
} from '@/lib/services/centralized-calendar.service'

/**
 * POST /api/calendars/[calendarId]/apply
 * Appliquer les mappings: créer les blocs UnAvailableProduct
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

    const result = await applyEventMappings(calendarId)

    return NextResponse.json({
      success: true,
      blocksCreated: result.blocksCreated,
      eventsProcessed: result.eventsProcessed,
    })
  } catch (error: unknown) {
    console.error('Error applying mappings:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
