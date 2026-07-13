import { RentStatus } from '@prisma/client'
import {
  buildRoomTypeOverlapWhere,
  buildBlockedDateOverlapWhere,
  normalizeDates,
} from '../rent-overlap.utils'

describe('buildRoomTypeOverlapWhere', () => {
  const arrival = new Date('2026-08-01T00:00:00.000Z')
  const leaving = new Date('2026-08-05T00:00:00.000Z')
  const { normalizedArrival, normalizedLeaving, dayAfterArrival } = normalizeDates(arrival, leaving)

  it('scopes to the room type and blocks only RESERVED+WAITING', () => {
    const where = buildRoomTypeOverlapWhere(
      'rt-1',
      normalizedArrival,
      normalizedLeaving,
      dayAfterArrival
    )
    expect(where.roomTypeId).toBe('rt-1')
    expect(where.rent).toMatchObject({
      status: { in: [RentStatus.RESERVED, RentStatus.WAITING] },
    })
    expect(where.rent?.OR).toHaveLength(3)
  })

  it('uses dayAfterArrival for checkout-day-free semantics', () => {
    const where = buildRoomTypeOverlapWhere(
      'rt-1',
      normalizedArrival,
      normalizedLeaving,
      dayAfterArrival
    )
    const orClauses = where.rent?.OR as Array<Record<string, unknown>>
    expect(orClauses[1]).toEqual({
      leavingDate: { gte: dayAfterArrival, lt: normalizedLeaving },
    })
  })
})

describe('buildBlockedDateOverlapWhere', () => {
  it('detects half-open range overlap', () => {
    const a = new Date('2026-08-01T00:00:00.000Z')
    const l = new Date('2026-08-05T00:00:00.000Z')
    const where = buildBlockedDateOverlapWhere('rt-1', a, l)
    expect(where).toEqual({
      roomTypeId: 'rt-1',
      startDate: { lt: l },
      endDate: { gt: a },
    })
  })
})
