import { BedType } from '@prisma/client'
import {
  syncRoomTypes,
  RoomTypeDeletionBlockedError,
  type CreateRoomTypeInput,
} from '../room-type.service'

/**
 * `syncRoomTypes` is verified against a mocked Prisma transaction client
 * (mocks only at the DB boundary). We assert its create/update/delete
 * orchestration without touching a real database.
 */
type MockTx = {
  roomType: {
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
}

function createMockTx(
  existing: Array<{ id: string; name?: string; _count: { rentLines: number } }>
): MockTx {
  return {
    roomType: {
      findMany: jest.fn().mockResolvedValue(existing),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  }
}

const newRoomType: CreateRoomTypeInput = {
  name: 'Double',
  quantity: 3,
  capacity: 2,
  surface: 20,
  smoking: false,
  basePrice: '90',
  priceMGA: '400000',
  beds: [{ bedType: BedType.DOUBLE, count: 1 }],
  specialPrices: [],
  mealIds: ['m1'],
}

describe('syncRoomTypes', () => {
  it('creates a room type that has no id', async () => {
    const tx = createMockTx([])

    await syncRoomTypes(tx as any, 'prod1', [newRoomType])

    expect(tx.roomType.create).toHaveBeenCalledTimes(1)
    const arg = tx.roomType.create.mock.calls[0][0]
    expect(arg.data.productId).toBe('prod1')
    expect(arg.data.name).toBe('Double')
    expect(arg.data.beds.create).toEqual([{ bedType: 'DOUBLE', count: 1 }])
    expect(arg.data.mealsList.connect).toEqual([{ id: 'm1' }])
    expect(tx.roomType.update).not.toHaveBeenCalled()
    expect(tx.roomType.delete).not.toHaveBeenCalled()
  })

  it('updates a room type that already exists (id present)', async () => {
    const tx = createMockTx([{ id: 'rt1', _count: { rentLines: 0 } }])

    await syncRoomTypes(tx as any, 'prod1', [{ ...newRoomType, id: 'rt1' }])

    expect(tx.roomType.update).toHaveBeenCalledTimes(1)
    const arg = tx.roomType.update.mock.calls[0][0]
    expect(arg.where).toEqual({ id: 'rt1' })
    expect(arg.data.beds.deleteMany).toEqual({})
    expect(tx.roomType.create).not.toHaveBeenCalled()
    expect(tx.roomType.delete).not.toHaveBeenCalled()
  })

  it('deletes room types absent from the incoming list', async () => {
    const tx = createMockTx([
      { id: 'rt1', _count: { rentLines: 0 } },
      { id: 'rt2', _count: { rentLines: 0 } },
    ])

    await syncRoomTypes(tx as any, 'prod1', [{ ...newRoomType, id: 'rt1' }])

    expect(tx.roomType.delete).toHaveBeenCalledTimes(1)
    expect(tx.roomType.delete.mock.calls[0][0]).toEqual({ where: { id: 'rt2' } })
  })

  it('refuses to delete a room type that has booking history', async () => {
    const tx = createMockTx([{ id: 'rt1', name: 'Suite', _count: { rentLines: 2 } }])

    await expect(syncRoomTypes(tx as any, 'prod1', [])).rejects.toThrow(/booking/i)

    expect(tx.roomType.delete).not.toHaveBeenCalled()
  })

  it('throws a typed RoomTypeDeletionBlockedError carrying the blocked names', async () => {
    const tx = createMockTx([
      { id: 'rt1', name: 'Suite', _count: { rentLines: 2 } },
      { id: 'rt2', name: 'Double', _count: { rentLines: 0 } },
    ])

    const error = await syncRoomTypes(tx as any, 'prod1', []).catch(e => e)

    expect(error).toBeInstanceOf(RoomTypeDeletionBlockedError)
    expect(error.roomTypeNames).toEqual(['Suite'])
    // No delete happens at all when any removal is blocked (all-or-nothing).
    expect(tx.roomType.delete).not.toHaveBeenCalled()
  })
})
