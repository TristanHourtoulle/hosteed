import { NextResponse } from 'next/server'
import { findAllSecurity } from '@/lib/services/security.services'

export async function GET() {
  try {
    const securities = await findAllSecurity()

    return NextResponse.json(securities, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache for static data
      },
    })
  } catch (error) {
    console.error('Error fetching securities:', error)
    return NextResponse.json({ error: 'Failed to fetch securities' }, { status: 500 })
  }
}
