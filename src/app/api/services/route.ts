import { NextResponse } from 'next/server'
import { findAllServices } from '@/lib/services/services.service'

export async function GET() {
  try {
    const services = await findAllServices()
    
    const response = NextResponse.json(services || [])
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    
    return response
  } catch (error) {
    console.error('Error in /api/services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}