import { makePrismaMock } from './helpers/prisma-mock'
import { BookingValidationError } from '@/lib/errors/booking.errors'

const prismaMock = makePrismaMock()
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import {
  createRoomTypeBlockedDate,
  listRoomTypeBlockedDates,
  deleteRoomTypeBlockedDate,
  assertRoomTypeOwnedBy,
} from '../room-type-blocked-date.service'

const A = new Date('2026-08-01T00:00:00.000Z')
const L = new Date('2026-08-05T00:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createRoomTypeBlockedDate', () => {
  it('creates a valid blocked range', async () => {
    const created = { id: 'b1', roomTypeId: 'rt-1', startDate: A, endDate: L }
    prismaMock.roomTypeBlockedDate.create.mockResolvedValue(created)

    const result = await createRoomTypeBlockedDate({ roomTypeId: 'rt-1', startDate: A, endDate: L })

    expect(result).toBe(created)
    expect(prismaMock.roomTypeBlockedDate.create).toHaveBeenCalledWith({
      data: { roomTypeId: 'rt-1', startDate: A, endDate: L },
    })
  })

  it('throws when startDate >= endDate', async () => {
    await expect(
      createRoomTypeBlockedDate({ roomTypeId: 'rt-1', startDate: L, endDate: A })
    ).rejects.toBeInstanceOf(BookingValidationError)
    expect(prismaMock.roomTypeBlockedDate.create).not.toHaveBeenCalled()
  })
})

describe('listRoomTypeBlockedDates', () => {
  it('lists ranges ordered by startDate', async () => {
    prismaMock.roomTypeBlockedDate.findMany.mockResolvedValue([])

    await listRoomTypeBlockedDates('rt-1')

    expect(prismaMock.roomTypeBlockedDate.findMany).toHaveBeenCalledWith({
      where: { roomTypeId: 'rt-1' },
      orderBy: { startDate: 'asc' },
    })
  })
})

describe('deleteRoomTypeBlockedDate', () => {
  it('deletes by id', async () => {
    prismaMock.roomTypeBlockedDate.delete.mockResolvedValue({})

    await deleteRoomTypeBlockedDate('b1')

    expect(prismaMock.roomTypeBlockedDate.delete).toHaveBeenCalledWith({ where: { id: 'b1' } })
  })
})

describe('assertRoomTypeOwnedBy', () => {
  it('resolves when the user owns the parent product', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ product: { ownerId: 'user-1' } })

    await expect(assertRoomTypeOwnedBy('rt-1', 'user-1')).resolves.toBeUndefined()
  })

  it('throws for a different owner', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue({ product: { ownerId: 'other' } })

    await expect(assertRoomTypeOwnedBy('rt-1', 'user-1')).rejects.toBeInstanceOf(
      BookingValidationError
    )
  })

  it('throws for an unknown room type', async () => {
    prismaMock.roomType.findUnique.mockResolvedValue(null)

    await expect(assertRoomTypeOwnedBy('missing', 'user-1')).rejects.toBeInstanceOf(
      BookingValidationError
    )
  })
})
