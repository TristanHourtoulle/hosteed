import { readFileSync } from 'fs'
import { join } from 'path'
import { BedType } from '@prisma/client'
import {
  syncRoomTypes,
  RoomTypeDeletionBlockedError,
  type CreateRoomTypeInput,
} from '../room-type.service'
import { PhotoBudgetExceededError } from '@/lib/photos/photoBudget'

/**
 * `syncRoomTypes` is verified against a mocked Prisma transaction client
 * (mocks only at the DB boundary). We assert its create/update/delete
 * orchestration without touching a real database.
 */
type ExistingFixture = {
  id: string
  name?: string
  _count: { rentLines: number }
  images?: Array<{ id: string; img: string; position: number }>
}

type MockTx = {
  roomType: {
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
  roomTypeImage: {
    deleteMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  product: {
    findUnique: jest.Mock
  }
}

function createMockTx(existing: ExistingFixture[], establishmentImageCount = 0): MockTx {
  return {
    roomType: {
      findMany: jest.fn().mockResolvedValue(existing.map(rt => ({ images: [], ...rt }))),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    roomTypeImage: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue({ _count: { img: establishmentImageCount } }),
    },
  }
}

function urls(count: number, prefix = 'u'): string[] {
  return Array.from({ length: count }, (_, i) => `/uploads/${prefix}${i}-full.webp`)
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

describe('syncRoomTypes — images', () => {
  it('creates image rows for a new room type, ordered by position', async () => {
    const tx = createMockTx([])

    await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, imageUrls: ['/a-full.webp', '/b-full.webp'] },
    ])

    const arg = tx.roomType.create.mock.calls[0][0]
    expect(arg.data.images.create).toEqual([
      { img: '/a-full.webp', position: 0 },
      { img: '/b-full.webp', position: 1 },
    ])
  })

  it('reconciles images by URL: untouched keeps its row id, removed deleted, new created', async () => {
    const tx = createMockTx([
      {
        id: 'rt1',
        _count: { rentLines: 0 },
        images: [
          { id: 'img-keep', img: '/keep-full.webp', position: 0 },
          { id: 'img-drop', img: '/drop-full.webp', position: 1 },
        ],
      },
    ])

    await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, id: 'rt1', imageUrls: ['/keep-full.webp', '/new-full.webp'] },
    ])

    // Removed url → deleted by row id; the untouched row is never deleted.
    expect(tx.roomTypeImage.deleteMany).toHaveBeenCalledTimes(1)
    expect(tx.roomTypeImage.deleteMany.mock.calls[0][0]).toEqual({
      where: { id: { in: ['img-drop'] } },
    })

    // New url → created with its index as position.
    expect(tx.roomTypeImage.create).toHaveBeenCalledTimes(1)
    expect(tx.roomTypeImage.create.mock.calls[0][0].data).toEqual({
      roomTypeId: 'rt1',
      img: '/new-full.webp',
      position: 1,
    })
  })

  it('leaves images untouched when imageUrls is undefined', async () => {
    const tx = createMockTx([
      {
        id: 'rt1',
        _count: { rentLines: 0 },
        images: [{ id: 'img-keep', img: '/keep-full.webp', position: 0 }],
      },
    ])

    await syncRoomTypes(tx as any, 'prod1', [{ ...newRoomType, id: 'rt1' }])

    expect(tx.roomTypeImage.deleteMany).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.create).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.update).not.toHaveBeenCalled()
  })

  it('repositions an untouched image whose index moved, keeping its row id', async () => {
    const tx = createMockTx([
      {
        id: 'rt1',
        _count: { rentLines: 0 },
        images: [
          { id: 'img-a', img: '/a-full.webp', position: 0 },
          { id: 'img-b', img: '/b-full.webp', position: 1 },
        ],
      },
    ])

    await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, id: 'rt1', imageUrls: ['/b-full.webp', '/a-full.webp'] },
    ])

    expect(tx.roomTypeImage.create).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.deleteMany).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.update.mock.calls.map(call => call[0])).toEqual([
      { where: { id: 'img-b' }, data: { position: 0 } },
      { where: { id: 'img-a' }, data: { position: 1 } },
    ])
  })

  it('throws PhotoBudgetExceededError and writes nothing when over budget', async () => {
    // 18 establishment photos + 3 room-type photos = 21 > 20.
    const tx = createMockTx([{ id: 'rt-old', _count: { rentLines: 0 } }], 18)

    const error = await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, imageUrls: urls(3) },
    ]).catch(e => e)

    expect(error).toBeInstanceOf(PhotoBudgetExceededError)
    expect(error.used).toBe(21)
    expect(error.max).toBe(20)

    // Fail-fast: not a single write happened, including the pending delete.
    expect(tx.roomType.delete).not.toHaveBeenCalled()
    expect(tx.roomType.create).not.toHaveBeenCalled()
    expect(tx.roomType.update).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.deleteMany).not.toHaveBeenCalled()
    expect(tx.roomTypeImage.create).not.toHaveBeenCalled()
  })

  it('sums photos across every room type of the listing', async () => {
    const tx = createMockTx([], 4)

    const error = await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, imageUrls: urls(9, 'a') },
      { ...newRoomType, imageUrls: urls(8, 'b') },
    ]).catch(e => e)

    expect(error).toBeInstanceOf(PhotoBudgetExceededError)
    expect(error.used).toBe(21)
  })

  it('counts existing images for room types whose imageUrls is undefined', async () => {
    // 10 establishment + 8 untouched existing images + 3 incoming = 21 > 20.
    const tx = createMockTx(
      [
        {
          id: 'rt1',
          _count: { rentLines: 0 },
          images: Array.from({ length: 8 }, (_, i) => ({
            id: `img${i}`,
            img: `/e${i}-full.webp`,
            position: i,
          })),
        },
      ],
      10
    )

    const error = await syncRoomTypes(tx as any, 'prod1', [
      { ...newRoomType, id: 'rt1' },
      { ...newRoomType, imageUrls: urls(3) },
    ]).catch(e => e)

    expect(error).toBeInstanceOf(PhotoBudgetExceededError)
    expect(error.used).toBe(21)
  })

  it('accepts a listing sitting exactly at the 20-photo cap', async () => {
    const tx = createMockTx([], 17)

    await expect(
      syncRoomTypes(tx as any, 'prod1', [{ ...newRoomType, imageUrls: urls(3) }])
    ).resolves.toBeUndefined()

    expect(tx.roomType.create).toHaveBeenCalledTimes(1)
  })

  it('ignores room-type photos of types being removed when budgeting', async () => {
    // The old type (with 10 photos) is dropped, so it must not count.
    const tx = createMockTx(
      [
        {
          id: 'rt-old',
          _count: { rentLines: 0 },
          images: Array.from({ length: 10 }, (_, i) => ({
            id: `old${i}`,
            img: `/o${i}-full.webp`,
            position: i,
          })),
        },
      ],
      15
    )

    await expect(
      syncRoomTypes(tx as any, 'prod1', [{ ...newRoomType, imageUrls: urls(5) }])
    ).resolves.toBeUndefined()

    expect(tx.roomType.delete).toHaveBeenCalledTimes(1)
  })

  it('relies on a schema-level cascade to drop images with their room type', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8')
    const model = schema.slice(schema.indexOf('model RoomTypeImage {'))

    expect(model.slice(0, model.indexOf('}'))).toMatch(
      /roomType\s+RoomType\s+@relation\(fields: \[roomTypeId\], references: \[id\], onDelete: Cascade\)/
    )
  })
})
