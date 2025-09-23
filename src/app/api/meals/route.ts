import { NextResponse } from 'next/server'
import { findAllMeals } from '@/lib/services/meals.service'

export async function GET() {
  try {
    const meals = await findAllMeals()
    
    const response = NextResponse.json(meals || [])
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    
    return response
  } catch (error) {
    console.error('Error in /api/meals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}