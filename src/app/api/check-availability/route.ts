import { NextResponse } from 'next/server'
import { checkRentIsAvailable } from '@/lib/services/rent-availability.service'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const arrival = searchParams.get('arrival')
  const leaving = searchParams.get('leaving')

  if (!productId || !arrival || !leaving) {
    return NextResponse.json(
      { error: { code: 'VAL_001', message: 'Missing required parameters: productId, arrival, leaving' } },
      { status: 400 }
    )
  }

  const arrivalDate = new Date(arrival)
  const leavingDate = new Date(leaving)

  if (isNaN(arrivalDate.getTime()) || isNaN(leavingDate.getTime())) {
    return NextResponse.json(
      { error: { code: 'VAL_002', message: 'Invalid date format for arrival or leaving' } },
      { status: 400 }
    )
  }

  if (arrivalDate >= leavingDate) {
    return NextResponse.json(
      { error: { code: 'VAL_003', message: 'Leaving date must be after arrival date' } },
      { status: 400 }
    )
  }

  try {
    const result = await checkRentIsAvailable(
      productId,
      arrivalDate,
      leavingDate
    )
    return NextResponse.json(result)
  } catch (error) {
    logger.error({ productId, error }, 'Error checking availability')
    return NextResponse.json(
      { error: { code: 'SRV_001', message: 'Failed to check availability' } },
      { status: 500 }
    )
  }
}
