import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getOrCreateCalendarFeedToken,
  regenerateCalendarFeedToken,
} from '@/lib/services/calendar.service'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    productId: string
  }>
}

/**
 * GET /api/calendar/[productId]/token - Get or create calendar feed token
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { owner: { select: { id: true } } },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isOwner = product.owner?.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get or create token
    const token = await getOrCreateCalendarFeedToken(productId)

    // Build feed URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const feedUrl = `${baseUrl}/api/calendar/${productId}/feed.ics?token=${token}`

    return NextResponse.json({
      token,
      feedUrl,
      webcalUrl: feedUrl.replace(/^https?:/, 'webcal:'),
    })
  } catch (error) {
    console.error('Error getting calendar token:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/[productId]/token - Regenerate calendar feed token
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { owner: { select: { id: true } } },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isOwner = product.owner?.id === session.user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Regenerate token
    const token = await regenerateCalendarFeedToken(productId)

    // Build feed URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const feedUrl = `${baseUrl}/api/calendar/${productId}/feed.ics?token=${token}`

    return NextResponse.json({
      token,
      feedUrl,
      webcalUrl: feedUrl.replace(/^https?:/, 'webcal:'),
      message: 'Token regenerated successfully',
    })
  } catch (error) {
    console.error('Error regenerating calendar token:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
