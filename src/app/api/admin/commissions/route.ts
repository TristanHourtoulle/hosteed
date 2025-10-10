import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllCommissions,
  createCommission,
  getPropertyTypesWithoutCommissions
} from '@/lib/services/commission-management.service'

/**
 * GET /api/admin/commissions
 * List all commissions with their property types
 *
 * Query params:
 * - includeUnassigned: if 'true', also returns property types without commissions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeUnassigned = searchParams.get('includeUnassigned') === 'true'

    const commissions = await getAllCommissions()

    let response: { commissions: typeof commissions; unassignedTypes?: Awaited<ReturnType<typeof getPropertyTypesWithoutCommissions>> } = {
      commissions
    }

    if (includeUnassigned) {
      const unassignedTypes = await getPropertyTypesWithoutCommissions()
      response.unassignedTypes = unassignedTypes
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/commissions
 * Create a new commission
 *
 * Body:
 * {
 *   title: string
 *   description?: string
 *   hostCommissionRate: number
 *   hostCommissionFixed: number
 *   clientCommissionRate: number
 *   clientCommissionFixed: number
 *   typeRentId: string
 *   isActive?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!body.typeRentId || typeof body.typeRentId !== 'string') {
      return NextResponse.json({ error: 'Property type ID is required' }, { status: 400 })
    }

    if (typeof body.hostCommissionRate !== 'number' || body.hostCommissionRate < 0) {
      return NextResponse.json({ error: 'Invalid host commission rate' }, { status: 400 })
    }

    if (typeof body.hostCommissionFixed !== 'number' || body.hostCommissionFixed < 0) {
      return NextResponse.json({ error: 'Invalid host commission fixed' }, { status: 400 })
    }

    if (typeof body.clientCommissionRate !== 'number' || body.clientCommissionRate < 0) {
      return NextResponse.json({ error: 'Invalid client commission rate' }, { status: 400 })
    }

    if (typeof body.clientCommissionFixed !== 'number' || body.clientCommissionFixed < 0) {
      return NextResponse.json({ error: 'Invalid client commission fixed' }, { status: 400 })
    }

    const commission = await createCommission({
      title: body.title,
      description: body.description,
      hostCommissionRate: body.hostCommissionRate,
      hostCommissionFixed: body.hostCommissionFixed,
      clientCommissionRate: body.clientCommissionRate,
      clientCommissionFixed: body.clientCommissionFixed,
      typeRentId: body.typeRentId,
      isActive: body.isActive ?? true,
      createdBy: session.user.id
    })

    return NextResponse.json(commission, { status: 201 })
  } catch (error) {
    console.error('Error creating commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create commission' },
      { status: 500 }
    )
  }
}
