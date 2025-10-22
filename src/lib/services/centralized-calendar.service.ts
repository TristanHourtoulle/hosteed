import prisma from '@/lib/prisma'
import ical from 'ical'
import { nanoid } from 'nanoid'

/**
 * Service pour gérer les calendriers externes centralisés (niveau host)
 */

export interface ExternalCalendarInput {
  userId: string
  name: string
  icalUrl: string
  color?: string
  description?: string
}

export interface CalendarEvent {
  uid: string
  title: string
  startDate: Date
  endDate: Date
  description?: string
}

export interface EventMappingInput {
  externalCalendarId: string
  eventUid: string
  eventTitle: string
  startDate: Date
  endDate: Date
  productIds: string[]
}

/**
 * Créer un calendrier externe centralisé pour un host
 */
export async function createCentralizedCalendar(data: ExternalCalendarInput) {
  return await prisma.externalCalendar.create({
    data: {
      userId: data.userId,
      name: data.name,
      icalUrl: data.icalUrl,
      color: data.color || '#3B82F6',
      description: data.description,
      isActive: true,
      lastSyncStatus: 'pending',
    },
  })
}

/**
 * Récupérer tous les calendriers externes d'un host
 */
export async function getUserExternalCalendars(userId: string) {
  return await prisma.externalCalendar.findMany({
    where: { userId },
    include: {
      eventMappings: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Récupérer un calendrier externe spécifique
 */
export async function getExternalCalendar(calendarId: string) {
  return await prisma.externalCalendar.findUnique({
    where: { id: calendarId },
    include: {
      eventMappings: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Mettre à jour un calendrier externe
 */
export async function updateExternalCalendar(
  calendarId: string,
  data: Partial<ExternalCalendarInput>
) {
  return await prisma.externalCalendar.update({
    where: { id: calendarId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.icalUrl && { icalUrl: data.icalUrl }),
      ...(data.color && { color: data.color }),
      ...(data.description !== undefined && { description: data.description }),
    },
  })
}

/**
 * Supprimer un calendrier externe et tous ses mappings
 */
export async function deleteExternalCalendar(calendarId: string) {
  // Les mappings seront automatiquement supprimés grâce au onDelete: Cascade
  // Les blocs UnAvailableProduct créés doivent être supprimés manuellement
  const calendar = await prisma.externalCalendar.findUnique({
    where: { id: calendarId },
    include: { eventMappings: true },
  })

  if (!calendar) {
    throw new Error('Calendrier externe introuvable')
  }

  // Supprimer tous les blocs créés par ce calendrier
  await prisma.unAvailableProduct.deleteMany({
    where: {
      description: {
        contains: `[SYNC:${calendarId}]`,
      },
    },
  })

  // Supprimer le calendrier (les mappings seront supprimés en cascade)
  return await prisma.externalCalendar.delete({
    where: { id: calendarId },
  })
}

/**
 * Récupérer et parser un flux iCal externe
 */
export async function fetchAndParseICalFeed(icalUrl: string): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Hosteed Calendar Sync',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`)
    }

    const icalData = await response.text()
    const parsed = ical.parseICS(icalData)

    const events: CalendarEvent[] = []

    for (const [, event] of Object.entries(parsed)) {
      if (event.type !== 'VEVENT') continue

      const start = event.start
      const end = event.end

      if (!start || !end) continue

      // Générer un UID unique si pas fourni
      const uid = event.uid || `${nanoid()}-${start.toISOString()}`

      events.push({
        uid,
        title: event.summary || 'Sans titre',
        startDate: new Date(start),
        endDate: new Date(end),
        description: event.description,
      })
    }

    return events
  } catch (error) {
    console.error('Error fetching/parsing iCal feed:', error)
    throw error
  }
}

/**
 * Synchroniser un calendrier externe: récupérer les événements
 */
export async function syncExternalCalendar(calendarId: string) {
  const calendar = await prisma.externalCalendar.findUnique({
    where: { id: calendarId },
  })

  if (!calendar) {
    throw new Error('Calendrier externe introuvable')
  }

  if (!calendar.isActive) {
    throw new Error('Calendrier externe inactif')
  }

  try {
    // Récupérer les événements du calendrier externe
    const events = await fetchAndParseICalFeed(calendar.icalUrl)

    // Mettre à jour le statut de synchronisation
    await prisma.externalCalendar.update({
      where: { id: calendarId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    })

    return {
      success: true,
      events,
      calendar,
    }
  } catch (error: unknown) {
    // Mettre à jour avec l'erreur
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    await prisma.externalCalendar.update({
      where: { id: calendarId },
      data: {
        lastSyncStatus: 'error',
        lastSyncError: errorMessage,
      },
    })

    throw error
  }
}

/**
 * Sauvegarder ou mettre à jour un mapping d'événement
 */
export async function saveEventMapping(data: EventMappingInput) {
  // Upsert le mapping
  return await prisma.calendarEventMapping.upsert({
    where: {
      externalCalendarId_eventUid: {
        externalCalendarId: data.externalCalendarId,
        eventUid: data.eventUid,
      },
    },
    update: {
      eventTitle: data.eventTitle,
      startDate: data.startDate,
      endDate: data.endDate,
      productIds: data.productIds,
    },
    create: {
      externalCalendarId: data.externalCalendarId,
      eventUid: data.eventUid,
      eventTitle: data.eventTitle,
      startDate: data.startDate,
      endDate: data.endDate,
      productIds: data.productIds,
    },
  })
}

/**
 * Récupérer tous les mappings d'un calendrier externe
 */
export async function getCalendarEventMappings(externalCalendarId: string) {
  return await prisma.calendarEventMapping.findMany({
    where: { externalCalendarId },
    orderBy: { startDate: 'asc' },
  })
}

/**
 * Appliquer les mappings: créer les blocs UnAvailableProduct
 */
export async function applyEventMappings(externalCalendarId: string) {
  const calendar = await prisma.externalCalendar.findUnique({
    where: { id: externalCalendarId },
    include: { eventMappings: true },
  })

  if (!calendar) {
    throw new Error('Calendrier externe introuvable')
  }

  // Supprimer les anciens blocs créés par ce calendrier
  await prisma.unAvailableProduct.deleteMany({
    where: {
      description: {
        contains: `[SYNC:${externalCalendarId}]`,
      },
    },
  })

  // Créer les nouveaux blocs selon les mappings
  const blocksToCreate = []

  for (const mapping of calendar.eventMappings) {
    for (const productId of mapping.productIds) {
      blocksToCreate.push({
        productId,
        startDate: mapping.startDate,
        endDate: mapping.endDate,
        title: mapping.eventTitle,
        description: `Synchronisé depuis ${calendar.name} [SYNC:${externalCalendarId}:${mapping.eventUid}]`,
      })
    }
  }

  if (blocksToCreate.length > 0) {
    await prisma.unAvailableProduct.createMany({
      data: blocksToCreate,
    })
  }

  return {
    blocksCreated: blocksToCreate.length,
    eventsProcessed: calendar.eventMappings.length,
  }
}

/**
 * Supprimer un mapping spécifique
 */
export async function deleteEventMapping(externalCalendarId: string, eventUid: string) {
  const mapping = await prisma.calendarEventMapping.findUnique({
    where: {
      externalCalendarId_eventUid: {
        externalCalendarId,
        eventUid,
      },
    },
  })

  if (!mapping) {
    throw new Error('Mapping introuvable')
  }

  // Supprimer les blocs créés par ce mapping
  await prisma.unAvailableProduct.deleteMany({
    where: {
      description: {
        contains: `[SYNC:${externalCalendarId}:${eventUid}]`,
      },
    },
  })

  // Supprimer le mapping
  return await prisma.calendarEventMapping.delete({
    where: {
      externalCalendarId_eventUid: {
        externalCalendarId,
        eventUid,
      },
    },
  })
}

/**
 * Synchroniser tous les calendriers actifs d'un utilisateur
 */
export async function syncAllUserCalendars(userId: string) {
  const calendars = await prisma.externalCalendar.findMany({
    where: {
      userId,
      isActive: true,
    },
  })

  const results = []

  for (const calendar of calendars) {
    try {
      const result = await syncExternalCalendar(calendar.id)
      results.push({
        calendarId: calendar.id,
        calendarName: calendar.name,
        success: true,
        eventsCount: result.events.length,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      results.push({
        calendarId: calendar.id,
        calendarName: calendar.name,
        success: false,
        error: errorMessage,
      })
    }
  }

  return results
}
