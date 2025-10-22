import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getExternalCalendar,
  syncExternalCalendar,
} from '@/lib/services/centralized-calendar.service'

/**
 * POST /api/calendars/[calendarId]/sync
 * Synchroniser un calendrier externe et récupérer ses événements
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

    const result = await syncExternalCalendar(calendarId)

    return NextResponse.json({
      success: true,
      events: result.events,
      calendar: result.calendar,
    })
  } catch (error: unknown) {
    console.error('Error syncing calendar:', error)
    const message = error instanceof Error ? error.message : 'Erreur de synchronisation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
