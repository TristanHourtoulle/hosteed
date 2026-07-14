/**
 * Overbooking concurrency integration test (REAL DB, TRI-125 / TRI-1022).
 *
 * GATED: this test drives the real `createRent` transaction against a live
 * database. It runs ONLY when `DATABASE_URL_TEST` is set (never in the normal
 * `npx jest` suite, never against a shared/CI DB). It validates the definitive
 * per-room-type overbooking guard: under concurrency, a room type of capacity N
 * must accept at most N simultaneous bookings.
 *
 * Setup requirements (satisfied by the seeded local DB):
 *   - A hotel product with a RoomType of EXACTLY `quantity: 2` (prefer "Suite").
 *     Exact capacity 2 is what makes the boundary meaningful: with 4 racers each
 *     requesting 1 room, exactly 2 must win and 2 must lose. A larger-capacity
 *     type (e.g. the "Double" with quantity 4) would let every racer through and
 *     never exercise the guard.
 *   - At least one user to own the bookings.
 *
 * Run it with:
 *   DATABASE_URL_TEST="$DATABASE_URL" npx jest rents.guard.integration
 */
// Mock the email boundary so no real Brevo call fires during the test. This is
// the reliable gate: `emailConfig.sendingEnabled` is captured from
// NEXT_PUBLIC_SEND_MAIL at module-load, so flipping the env var in a beforeAll
// would be too late. FIX 1 (non-fatal post-commit emails) is covered separately
// by createRent.notifications.nonfatal.test.ts; here we only care about the
// overbooking guard, and emails are an out-of-scope boundary.
jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: jest.fn().mockResolvedValue({ success: true, messageId: 'test' }),
}))

import prisma from '@/lib/prisma'
import { createRent } from '../rents.service'
import { createRoomTypeBlockedDate } from '../room-type-blocked-date.service'
import { BookingConflictError } from '@/lib/errors/booking.errors'
import { initializeCache } from '@/lib/cache/redis-cache.service'

// Unique stripeId prefix so afterAll can delete exactly (and only) the rents this
// test creates. Deleting a Rent cascades its RentRoomType lines (onDelete: Cascade).
const STRIPE_PREFIX = 'tri1022-race-'

// Fresh date ranges with no seeded bookings, isolated per test so each assertion
// is caused solely by the condition under test (capacity vs. blocked date).
const RACE_ARRIVAL = new Date('2027-04-01T00:00:00.000Z')
const RACE_LEAVING = new Date('2027-04-04T00:00:00.000Z')
const BLOCKED_ARRIVAL = new Date('2027-04-10T00:00:00.000Z')
const BLOCKED_LEAVING = new Date('2027-04-13T00:00:00.000Z')

interface Fixture {
  productId: string
  userId: string
  roomTypeId: string
}

/**
 * Pin the fixture to an EXACT-capacity-2 room type (prefer "Suite"). This is the
 * boundary the guard must enforce; a larger type would never fail.
 */
async function loadFixture(): Promise<Fixture | null> {
  const roomType =
    (await prisma.roomType.findFirst({
      where: { quantity: 2, name: 'Suite' },
      select: { id: true, productId: true },
    })) ??
    (await prisma.roomType.findFirst({
      where: { quantity: 2 },
      select: { id: true, productId: true },
    }))
  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!roomType || !user) return null
  return { productId: roomType.productId, userId: user.id, roomTypeId: roomType.id }
}

const RUN_DB = !!process.env.DATABASE_URL_TEST
;(RUN_DB ? describe : describe.skip)('createRent overbooking concurrency (real DB)', () => {
  let fx: Fixture | null = null

  beforeAll(async () => {
    // Under jest NODE_ENV==='test', the cache singletons are NOT initialized on
    // module load, so `createRent`'s availability check would call a method on an
    // undefined service and throw before the guard ever runs. Initialize them here.
    initializeCache()
    fx = await loadFixture()
  })

  afterAll(async () => {
    if (!fx) return
    // Remove the rents this test created (cascades their RentRoomType lines) and
    // any blocked dates it added, leaving the DB as it was found.
    await prisma.rent.deleteMany({ where: { stripeId: { startsWith: STRIPE_PREFIX } } })
    await prisma.roomTypeBlockedDate.deleteMany({
      where: { roomTypeId: fx.roomTypeId, startDate: { gte: RACE_ARRIVAL } },
    })
  })

  it('never overbooks a capacity-2 room type under concurrency (4 racers, 1 room each)', async () => {
    expect(fx).not.toBeNull()
    if (!fx) return

    const line = [{ roomTypeId: fx.roomTypeId, quantity: 1 }]
    const baseParams = (stripeId: string) => ({
      productId: fx!.productId,
      userId: fx!.userId,
      arrivingDate: RACE_ARRIVAL,
      leavingDate: RACE_LEAVING,
      peopleNumber: 1,
      options: [] as string[],
      stripeId,
      prices: 100,
      selectedRoomTypes: line,
    })

    const results = await Promise.allSettled([
      createRent(baseParams(`${STRIPE_PREFIX}1`)),
      createRent(baseParams(`${STRIPE_PREFIX}2`)),
      createRent(baseParams(`${STRIPE_PREFIX}3`)),
      createRent(baseParams(`${STRIPE_PREFIX}4`)),
    ])

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected = results.filter(r => r.status === 'rejected')

    // Exact boundary: 2 rooms → 2 winners, 2 losers.
    expect(fulfilled.length).toBe(2)
    expect(rejected.length).toBe(2)
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(BookingConflictError)
    }

    // DB invariant: booked quantity for the type over the test range is EXACTLY
    // its capacity, never more — no phantom/over-committed rooms.
    const agg = await prisma.rentRoomType.aggregate({
      _sum: { quantity: true },
      where: {
        roomTypeId: fx.roomTypeId,
        rent: { stripeId: { startsWith: STRIPE_PREFIX } },
      },
    })
    expect(agg._sum.quantity ?? 0).toBe(2)
  })

  it('a blocked date range prevents any booking for that type', async () => {
    expect(fx).not.toBeNull()
    if (!fx) return

    await createRoomTypeBlockedDate({
      roomTypeId: fx.roomTypeId,
      startDate: BLOCKED_ARRIVAL,
      endDate: BLOCKED_LEAVING,
    })

    await expect(
      createRent({
        productId: fx.productId,
        userId: fx.userId,
        arrivingDate: BLOCKED_ARRIVAL,
        leavingDate: BLOCKED_LEAVING,
        peopleNumber: 1,
        options: [],
        stripeId: `${STRIPE_PREFIX}blocked`,
        prices: 100,
        selectedRoomTypes: [{ roomTypeId: fx.roomTypeId, quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(BookingConflictError)
  })
})
