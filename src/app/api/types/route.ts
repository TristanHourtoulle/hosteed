import { NextResponse } from 'next/server'
import { findAllTypeRent } from '@/lib/services/typeRent.service'

export async function GET() {
  try {
    const types = await findAllTypeRent()
    
    return NextResponse.json(types, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache for static data
      },
    })
  } catch (error) {
    console.error('Error fetching types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch types' },
      { status: 500 }
    )
  }
}