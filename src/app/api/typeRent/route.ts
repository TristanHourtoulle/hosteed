import { NextResponse } from 'next/server'
import { findAllTypeRent } from '@/lib/services/typeRent.service'

export async function GET() {
  try {
    const typeRents = await findAllTypeRent()
    
    const response = NextResponse.json(typeRents || [])
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    
    return response
  } catch (error) {
    console.error('Error in /api/typeRent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}