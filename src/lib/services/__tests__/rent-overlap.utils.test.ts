import { RentStatus, Prisma } from '@prisma/client'
import {
  buildOverlapWhereClause,
  buildRoomTypeOverlapWhere,
  buildBlockedDateOverlapWhere,
  normalizeDates,
} from '../rent-overlap.utils'

// ------------------------------------------------------------------
// Faithful in-memory evaluator of the overlap where-clauses.
// Lets us express real overbooking scenarios (a guest currently CHECKIN,
// a past CHECKOUT, checkout-day turnover) as deterministic unit tests
// without a live database. If a builder drops a status from its `in` set,
// the matching scenario below flips — so this genuinely exercises the filter.
// ------------------------------------------------------------------
type MockRent = {
  status: RentStatus
  arrivingDate: Date
  leavingDate: Date
}

type SimpleDateFilter = { gte?: Date; gt?: Date; lte?: Date; lt?: Date }

function matchesDateFilter(filter: SimpleDateFilter | undefined, value: Date): boolean {
  if (!filter) return true
  if (filter.gte !== undefined && !(value >= filter.gte)) return false
  if (filter.gt !== undefined && !(value > filter.gt)) return false
  if (filter.lte !== undefined && !(value <= filter.lte)) return false
  if (filter.lt !== undefined && !(value < filter.lt)) return false
  return true
}

/** Extract the rent-level `{ status, OR }` from either overlap where shape. */
function extractRentWhere(
  where: Prisma.RentWhereInput | Prisma.RentRoomTypeWhereInput
): Prisma.RentWhereInput {
  if ('rent' in where && where.rent) {
    return where.rent as Prisma.RentWhereInput
  }
  return where as Prisma.RentWhereInput
}

function blockingStatuses(
  where: Prisma.RentWhereInput | Prisma.RentRoomTypeWhereInput
): RentStatus[] {
  const rentWhere = extractRentWhere(where)
  return (rentWhere.status as Prisma.EnumRentStatusFilter).in as RentStatus[]
}

function rentBlocks(
  where: Prisma.RentWhereInput | Prisma.RentRoomTypeWhereInput,
  rent: MockRent
): boolean {
  const rentWhere = extractRentWhere(where)
  if (!blockingStatuses(where).includes(rent.status)) return false

  const orConditions = rentWhere.OR as Prisma.RentWhereInput[]
  return orConditions.some((cond) => {
    const arrivingOk = matchesDateFilter(
      cond.arrivingDate as SimpleDateFilter | undefined,
      rent.arrivingDate
    )
    const leavingOk = matchesDateFilter(
      cond.leavingDate as SimpleDateFilter | undefined,
      rent.leavingDate
    )
    return arrivingOk && leavingOk
  })
}

// Requested stay: arrive 2026-08-10, leave 2026-08-15 (nights 10,11,12,13,14)
const REQUEST_ARRIVAL = new Date('2026-08-10T00:00:00.000Z')
const REQUEST_LEAVING = new Date('2026-08-15T00:00:00.000Z')
const { normalizedArrival, normalizedLeaving, dayAfterArrival } = normalizeDates(
  REQUEST_ARRIVAL,
  REQUEST_LEAVING
)

const establishmentWhere = () =>
  buildOverlapWhereClause('product-1', normalizedArrival, normalizedLeaving, dayAfterArrival)
const roomTypeWhere = () =>
  buildRoomTypeOverlapWhere('rt-1', normalizedArrival, normalizedLeaving, dayAfterArrival)

// ------------------------------------------------------------------
// Status set (TRI-1002 overbooking gap)
// ------------------------------------------------------------------
describe.each([
  ['buildOverlapWhereClause (establishment)', establishmentWhere],
  ['buildRoomTypeOverlapWhere (per room type)', roomTypeWhere],
])('%s — blocking status set', (_label, build) => {
  it('includes CHECKIN so a current stay counts as occupying', () => {
    expect(blockingStatuses(build())).toContain(RentStatus.CHECKIN)
  })

  it('keeps RESERVED and WAITING', () => {
    const set = blockingStatuses(build())
    expect(set).toContain(RentStatus.RESERVED)
    expect(set).toContain(RentStatus.WAITING)
  })

  it('excludes CHECKOUT (departed = room freed) and CANCEL', () => {
    const set = blockingStatuses(build())
    expect(set).not.toContain(RentStatus.CHECKOUT)
    expect(set).not.toContain(RentStatus.CANCEL)
  })
})

// ------------------------------------------------------------------
// Real booking scenarios (both overlap paths behave identically)
// ------------------------------------------------------------------
describe.each([
  ['buildOverlapWhereClause (establishment)', establishmentWhere],
  ['buildRoomTypeOverlapWhere (per room type)', roomTypeWhere],
])('%s — overlap scenarios', (_label, build) => {
  it('blocks when a guest is currently CHECKIN over the requested nights', () => {
    // Checked in 2026-08-09 -> leaving 2026-08-12: occupies nights 10, 11
    expect(
      rentBlocks(build(), {
        status: RentStatus.CHECKIN,
        arrivingDate: new Date('2026-08-09T00:00:00.000Z'),
        leavingDate: new Date('2026-08-12T00:00:00.000Z'),
      })
    ).toBe(true)
  })

  it('does NOT block on a past CHECKOUT rent for a future request', () => {
    // Departed: 2026-08-01 -> 2026-08-05, entirely before the request
    expect(
      rentBlocks(build(), {
        status: RentStatus.CHECKOUT,
        arrivingDate: new Date('2026-08-01T00:00:00.000Z'),
        leavingDate: new Date('2026-08-05T00:00:00.000Z'),
      })
    ).toBe(false)
  })

  it('does NOT block an early CHECKOUT whose range still overlaps (departed = free)', () => {
    // Status CHECKOUT but leavingDate inside the window: guest left early, room is free
    expect(
      rentBlocks(build(), {
        status: RentStatus.CHECKOUT,
        arrivingDate: new Date('2026-08-09T00:00:00.000Z'),
        leavingDate: new Date('2026-08-13T00:00:00.000Z'),
      })
    ).toBe(false)
  })

  it('does NOT block on checkout-day turnover (previous guest leaves the arrival morning)', () => {
    // Previous guest leaves 2026-08-10 (requested arrival day) -> night 10 is free
    expect(
      rentBlocks(build(), {
        status: RentStatus.RESERVED,
        arrivingDate: new Date('2026-08-07T00:00:00.000Z'),
        leavingDate: new Date('2026-08-10T00:00:00.000Z'),
      })
    ).toBe(false)
  })

  it('blocks a same-day CHECKIN turnover (previous guest still occupies the arrival night)', () => {
    // Checked in, leaving 2026-08-11 -> still occupies night 10
    expect(
      rentBlocks(build(), {
        status: RentStatus.CHECKIN,
        arrivingDate: new Date('2026-08-08T00:00:00.000Z'),
        leavingDate: new Date('2026-08-11T00:00:00.000Z'),
      })
    ).toBe(true)
  })

  it('still blocks overlapping RESERVED and WAITING rents (regression)', () => {
    const overlapping = {
      arrivingDate: new Date('2026-08-11T00:00:00.000Z'),
      leavingDate: new Date('2026-08-13T00:00:00.000Z'),
    }
    expect(rentBlocks(build(), { status: RentStatus.RESERVED, ...overlapping })).toBe(true)
    expect(rentBlocks(build(), { status: RentStatus.WAITING, ...overlapping })).toBe(true)
  })

  it('does NOT block on a CANCEL rent overlapping the requested nights', () => {
    expect(
      rentBlocks(build(), {
        status: RentStatus.CANCEL,
        arrivingDate: new Date('2026-08-11T00:00:00.000Z'),
        leavingDate: new Date('2026-08-13T00:00:00.000Z'),
      })
    ).toBe(false)
  })
})

// ------------------------------------------------------------------
// Structural invariants preserved from the original suite
// ------------------------------------------------------------------
describe('buildRoomTypeOverlapWhere structure', () => {
  it('scopes to the room type and keeps the 3-branch overlap OR', () => {
    const where = roomTypeWhere()
    expect(where.roomTypeId).toBe('rt-1')
    expect(where.rent?.OR).toHaveLength(3)
  })

  it('uses dayAfterArrival for checkout-day-free semantics', () => {
    const where = roomTypeWhere()
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
