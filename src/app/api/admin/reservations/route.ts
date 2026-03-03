import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { RentStatus } from '@prisma/client'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional().default(''),
  status: z.nativeEnum(RentStatus).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: { code: 'AUTH_001', message: 'Accès non autorisé' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BOOKING_001', message: parsed.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { page, limit, search, status } = parsed.data
    const offset = (page - 1) * limit

    const whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }

    if (search.trim()) {
      whereClause.OR = [
        { product: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { lastname: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
        {
          product: {
            owner: { name: { contains: search.trim(), mode: 'insensitive' } },
          },
        },
      ]
    }

    const [reservations, totalItems, statusCounts] = await Promise.all([
      prisma.rent.findMany({
        where: whereClause,
        select: {
          id: true,
          arrivingDate: true,
          leavingDate: true,
          status: true,
          payment: true,
          totalAmount: true,
          numberOfNights: true,
          numberPeople: true,
          createdAt: true,
          accepted: true,
          confirmed: true,
          product: {
            select: {
              id: true,
              name: true,
              address: true,
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, lastname: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.rent.count({ where: whereClause }),
      prisma.rent.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    const stats: Record<string, number> = {
      WAITING: 0,
      RESERVED: 0,
      CHECKIN: 0,
      CHECKOUT: 0,
      CANCEL: 0,
    }
    let total = 0
    for (const entry of statusCounts) {
      stats[entry.status] = entry._count.status
      total += entry._count.status
    }
    stats.total = total

    const serialized = reservations.map(r => ({
      ...r,
      numberPeople: r.numberPeople ? Number(r.numberPeople) : null,
    }))

    const totalPages = Math.ceil(totalItems / limit)

    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=15, s-maxage=15')
    headers.set('X-Response-Time', Date.now().toString())

    return NextResponse.json(
      {
        reservations: serialized,
        stats,
        pagination: {
          currentPage: page,
          totalPages,
          itemsPerPage: limit,
          totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('Error in admin reservations API:', error)
    return NextResponse.json(
      { error: { code: 'BOOKING_500', message: 'Erreur interne du serveur' } },
      { status: 500 }
    )
  }
}
