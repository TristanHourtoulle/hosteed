import { RentStatus } from '@prisma/client'
import { makePrismaMock } from './helpers/prisma-mock'

const prismaMock = makePrismaMock()
// The legacy hotel path uses unAvailableProduct.findMany, absent from the shared mock.
;(prismaMock.unAvailableProduct as unknown as { findMany: jest.Mock }).findMany = jest.fn()

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import { checkHotelRoomAvailability, checkRentIsAvailable } from '../rent.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
})

/**
 * TRI-1002 regression for the legacy (non-room-type) availability path.
 * A guest with status CHECKIN must be counted as occupying a room, so the
 * overlap query must filter WAITING + RESERVED + CHECKIN (CHECKOUT excluded).
 */
describe('legacy checkHotelRoomAvailability status filter', () => {
  it('counts CHECKIN (and RESERVED, WAITING) rents as occupying', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: 3,
      name: 'Room',
      hotel: { name: 'Hotel' },
    })
    prismaMock.rent.findMany.mockResolvedValue([])
    ;(prismaMock.unAvailableProduct as unknown as { findMany: jest.Mock }).findMany.mockResolvedValue(
      []
    )

    await checkHotelRoomAvailability('p-legacy', A, L)

    const whereArg = prismaMock.rent.findMany.mock.calls[0][0].where
    expect(whereArg.status).toEqual({
      in: expect.arrayContaining([
        RentStatus.WAITING,
        RentStatus.RESERVED,
        RentStatus.CHECKIN,
      ]),
    })
    expect(whereArg.status.in).not.toContain(RentStatus.CHECKOUT)
    expect(whereArg.status.in).not.toContain(RentStatus.CANCEL)
  })
})

describe('legacy checkRentIsAvailable (single-unit) status filter', () => {
  it('counts CHECKIN (and RESERVED, WAITING) rents as occupying', async () => {
    // availableRooms null/1 -> classic single-unit overlap path
    prismaMock.product.findUnique.mockResolvedValue({
      availableRooms: null,
      hotel: null,
    })
    prismaMock.rent.findMany.mockResolvedValue([])

    await checkRentIsAvailable('p-single', A, L)

    const whereArg = prismaMock.rent.findMany.mock.calls[0][0].where
    expect(whereArg.status).toEqual({
      in: expect.arrayContaining([
        RentStatus.WAITING,
        RentStatus.RESERVED,
        RentStatus.CHECKIN,
      ]),
    })
    expect(whereArg.status.in).not.toContain(RentStatus.CHECKOUT)
  })
})
