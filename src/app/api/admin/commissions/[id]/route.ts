import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCommissionById,
  updateCommission,
  deleteCommission,
  toggleCommissionStatus
} from '@/lib/services/commission-management.service'

/**
 * GET /api/admin/commissions/[id]
 * Get a specific commission by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const params = await context.params
    const commission = await getCommissionById(params.id)

    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    return NextResponse.json(commission)
  } catch (error) {
    console.error('Error fetching commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch commission' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/commissions/[id]
 * Update a commission
 *
 * Body:
 * {
 *   title?: string
 *   description?: string
 *   hostCommissionRate?: number
 *   hostCommissionFixed?: number
 *   clientCommissionRate?: number
 *   clientCommissionFixed?: number
 *   typeRentId?: string
 *   isActive?: boolean
 * }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const params = await context.params
    const body = await request.json()

    // Validate commission rates if provided
    if (body.hostCommissionRate !== undefined && (typeof body.hostCommissionRate !== 'number' || body.hostCommissionRate < 0)) {
      return NextResponse.json({ error: 'Invalid host commission rate' }, { status: 400 })
    }

    if (body.hostCommissionFixed !== undefined && (typeof body.hostCommissionFixed !== 'number' || body.hostCommissionFixed < 0)) {
      return NextResponse.json({ error: 'Invalid host commission fixed' }, { status: 400 })
    }

    if (body.clientCommissionRate !== undefined && (typeof body.clientCommissionRate !== 'number' || body.clientCommissionRate < 0)) {
      return NextResponse.json({ error: 'Invalid client commission rate' }, { status: 400 })
    }

    if (body.clientCommissionFixed !== undefined && (typeof body.clientCommissionFixed !== 'number' || body.clientCommissionFixed < 0)) {
      return NextResponse.json({ error: 'Invalid client commission fixed' }, { status: 400 })
    }

    const commission = await updateCommission(params.id, body)

    return NextResponse.json(commission)
  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update commission' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/commissions/[id]
 * Delete a commission
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const params = await context.params
    await deleteCommission(params.id)

    return NextResponse.json({ success: true, message: 'Commission deleted successfully' })
  } catch (error) {
    console.error('Error deleting commission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete commission' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/commissions/[id]
 * Toggle commission active status
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const params = await context.params
    const commission = await toggleCommissionStatus(params.id)

    return NextResponse.json(commission)
  } catch (error) {
    console.error('Error toggling commission status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle commission status' },
      { status: 500 }
    )
  }
}
