import { NextRequest, NextResponse } from 'next/server'
import { calculateCommissions } from '@/lib/services/commission.service'

export async function POST(request: NextRequest) {
  try {
    const { basePrice } = await request.json()

    if (!basePrice || isNaN(Number(basePrice))) {
      return NextResponse.json(
        { error: 'Prix de base requis et doit être un nombre valide' },
        { status: 400 }
      )
    }

    const calculation = await calculateCommissions(Number(basePrice))

    return NextResponse.json({
      success: true,
      data: calculation
    })
  } catch (error) {
    console.error('Erreur lors du calcul des commissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des commissions' },
      { status: 500 }
    )
  }
}