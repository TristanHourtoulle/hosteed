import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50) // Max 50 per page
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''

    // Build where clause for search and filtering
    const whereClause: Record<string, unknown> = {}

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { lastname: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    if (roleFilter) {
      whereClause.roles = roleFilter
    }

    const offset = (page - 1) * limit

    // Execute optimized single query with Promise.all for better performance
    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          roles: true,
          createdAt: true,
          emailVerified: true,
        },
        orderBy: [{ createdAt: 'desc' }, { email: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    const response = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    // Set optimized cache headers for admin data
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=15, s-maxage=15') // 15 seconds cache for fresh admin data
    headers.set('X-Response-Time', Date.now().toString())

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
