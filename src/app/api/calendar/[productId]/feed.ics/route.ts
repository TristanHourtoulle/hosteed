import { NextRequest, NextResponse } from 'next/server'
import { generateProductICSFeed, verifyCalendarFeedToken } from '@/lib/services/calendar.service'

interface RouteParams {
  params: Promise<{
    productId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return new NextResponse('Token required', { status: 401 })
    }

    // Verify token
    const isValid = await verifyCalendarFeedToken(productId, token)
    if (!isValid) {
      return new NextResponse('Invalid token', { status: 403 })
    }

    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Generate ICS feed
    const icsContent = await generateProductICSFeed(productId, baseUrl)

    // Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Error generating ICS feed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
