/**
 * `findProductById` backs `GET /api/products/[id]`, which is what the host edit
 * page loads (TRI-1028). It must return the hotel room types with the relations
 * the wizard form needs (beds, special prices, per-type catalog links) and the
 * owner's `id`, so the page can both hydrate the room-types step and decide
 * whether the current user is allowed to edit. Prisma is mocked at the boundary.
 */

const findUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}))

import { findProductById } from '../product.service'

interface CapturedInclude {
  include: {
    owner: { select: Record<string, boolean> }
    type: boolean
    roomTypes?: {
      orderBy?: { position: 'asc' }
      include?: Record<string, unknown>
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  findUnique.mockResolvedValue({ id: 'p1', roomTypes: [] })
})

describe('findProductById include (host edit)', () => {
  it('includes roomTypes ordered by position', async () => {
    await findProductById('p1')

    const arg = findUnique.mock.calls[0][0] as CapturedInclude
    expect(arg.include.roomTypes).toBeDefined()
    expect(arg.include.roomTypes?.orderBy).toEqual({ position: 'asc' })
  })

  it('includes the room-type relations the edit form hydrates from', async () => {
    await findProductById('p1')

    const arg = findUnique.mock.calls[0][0] as CapturedInclude
    const roomTypeInclude = arg.include.roomTypes?.include ?? {}
    expect(roomTypeInclude.beds).toBe(true)
    expect(roomTypeInclude.specialPrices).toBe(true)
    expect(roomTypeInclude.mealsList).toBe(true)
    expect(roomTypeInclude.includedServices).toBe(true)
    expect(roomTypeInclude.extras).toBe(true)
  })

  it('selects the owner id so the page can enforce the edit rule', async () => {
    await findProductById('p1')

    const arg = findUnique.mock.calls[0][0] as CapturedInclude
    expect(arg.include.owner.select.id).toBe(true)
  })

  it('still selects the type (isHotelType decides whether room types are editable)', async () => {
    await findProductById('p1')

    const arg = findUnique.mock.calls[0][0] as CapturedInclude
    expect(arg.include.type).toBe(true)
  })
})
