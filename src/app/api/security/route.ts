import { NextResponse } from 'next/server'
import { findAllSecurity } from '@/lib/services/security.services'

export async function GET() {
  try {
    const securities = await findAllSecurity()
    
    const response = NextResponse.json(securities || [])
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    
    return response
  } catch (error) {
    console.error('Error in /api/security:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}