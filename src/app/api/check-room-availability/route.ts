import { NextResponse } from 'next/server'
import { getHotelRoomTypeAvailability } from '@/lib/services/rent-availability.service'
import { logger } from '@/lib/logger'

/**
 * Per-room-type availability for a hotel product (guest detail page).
 *
 * `GET ?productId=&arrival=&leaving=` → `RoomTypeAvailability[]`.
 * `arrival`/`leaving` are optional: when omitted, each type is reported as
 * fully available (calendar-only mode, mirrors the Lot 3 service contract).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const arrival = searchParams.get('arrival')
  const leaving = searchParams.get('leaving')

  if (!productId) {
    return NextResponse.json(
      { error: { code: 'VAL_001', message: 'Missing required parameter: productId' } },
      { status: 400 }
    )
  }

  let arrivalDate: Date | null = null
  let leavingDate: Date | null = null

  if (arrival && leaving) {
    arrivalDate = new Date(arrival)
    leavingDate = new Date(leaving)

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
  }

  try {
    const result = await getHotelRoomTypeAvailability(productId, arrivalDate, leavingDate)
    return NextResponse.json(result)
  } catch (error) {
    logger.error({ productId, error }, 'Error checking room-type availability')
    return NextResponse.json(
      { error: { code: 'SRV_001', message: 'Failed to check room-type availability' } },
      { status: 500 }
    )
  }
}
