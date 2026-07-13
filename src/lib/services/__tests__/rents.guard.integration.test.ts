/**
 * Overbooking concurrency integration test (REAL DB, TRI-125).
 *
 * GATED + SKIPPED: this test drives the real `createRent` transaction against a
 * live database. It only becomes meaningful once Lot 4 persists `RentRoomType`
 * lines inside the booking transaction (so overlapping quantities accumulate for
 * the per-type guard). Until then it is `describe.skip`.
 *
 * To enable in Lot 6 QA: replace `describe.skip` with the `RUN_DB` gate below,
 * provide `DATABASE_URL_TEST`, and ensure the DB has a seeded hotel product with
 * at least one RoomType (quantity ≥ 2) whose bookings can be cleaned up.
 *
 *   const RUN_DB = !!process.env.DATABASE_URL_TEST
 *   ;(RUN_DB ? describe : describe.skip)('overbooking concurrency', () => { ... })
 */
import prisma from '@/lib/prisma'
import { createRent } from '../rents.service'
import { createRoomTypeBlockedDate } from '../room-type-blocked-date.service'
import { BookingConflictError } from '@/lib/errors/booking.errors'

const A = new Date('2027-01-05T00:00:00.000Z')
const L = new Date('2027-01-08T00:00:00.000Z')

interface Fixture {
  productId: string
  userId: string
  roomTypeId: string
}

async function loadFixture(): Promise<Fixture | null> {
  const roomType = await prisma.roomType.findFirst({
    where: { quantity: { gte: 2 } },
    select: { id: true, productId: true },
  })
  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!roomType || !user) return null
  return { productId: roomType.productId, userId: user.id, roomTypeId: roomType.id }
}

// SKIPPED until Lot 4 persists RentRoomType lines in-transaction.
describe.skip('createRent overbooking concurrency (real DB)', () => {
  it('never overbooks a room type under concurrency (2 rooms, 3 racers)', async () => {
    const fx = await loadFixture()
    if (!fx) return

    const line = [{ roomTypeId: fx.roomTypeId, quantity: 1 }]
    const baseParams = (stripeId: string) => ({
      productId: fx.productId,
      userId: fx.userId,
      arrivingDate: A,
      leavingDate: L,
      peopleNumber: 1,
      options: [] as string[],
      stripeId,
      prices: 100,
      selectedRoomTypes: line,
    })

    const results = await Promise.allSettled([
      createRent(baseParams('race-s1')),
      createRent(baseParams('race-s2')),
      createRent(baseParams('race-s3')),
    ])

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected = results.filter(r => r.status === 'rejected')
    expect(fulfilled.length).toBe(2)
    expect(rejected.length).toBe(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BookingConflictError)

    // DB invariant: booked quantity for the type never exceeds its capacity.
    const agg = await prisma.rentRoomType.aggregate({
      _sum: { quantity: true },
      where: { roomTypeId: fx.roomTypeId },
    })
    expect(agg._sum.quantity ?? 0).toBeLessThanOrEqual(2)
  })

  it('a blocked date range prevents any booking for that type', async () => {
    const fx = await loadFixture()
    if (!fx) return

    await createRoomTypeBlockedDate({ roomTypeId: fx.roomTypeId, startDate: A, endDate: L })

    await expect(
      createRent({
        productId: fx.productId,
        userId: fx.userId,
        arrivingDate: A,
        leavingDate: L,
        peopleNumber: 1,
        options: [],
        stripeId: 'race-blocked',
        prices: 100,
        selectedRoomTypes: [{ roomTypeId: fx.roomTypeId, quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(BookingConflictError)
  })
})
