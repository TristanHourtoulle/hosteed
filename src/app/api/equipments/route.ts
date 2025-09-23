import { NextResponse } from 'next/server'
import { findAllEquipments } from '@/lib/services/equipments.service'

export async function GET() {
  try {
    const equipments = await findAllEquipments()
    
    const response = NextResponse.json(equipments || [])
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    
    return response
  } catch (error) {
    console.error('Error in /api/equipments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}