/**
 * Host products endpoint must expose enough hotel metadata for the shared
 * PromotionForm to scope a promotion to a room type: `isHotel` (derived from
 * the product type) and a lean `roomTypes` list (id + name). Non-hotel products
 * report `isHotel: false` with an empty room-type list. Prisma is not touched
 * here — the service layer is mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => authMock() }))

const findAllProductByHostIdPaginatedMock = jest.fn()
jest.mock('@/lib/services/product.service', () => ({
  findAllProductByHostIdPaginated: (...a: unknown[]) =>
    findAllProductByHostIdPaginatedMock(...a),
}))

import { GET } from '../route'

function makeRequest(query: Record<string, string> = {}) {
  const params = new URLSearchParams({ page: '1', limit: '20', ...query })
  return new Request(`http://localhost/api/host/products?${params}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'host1' } })
})

describe('GET /api/host/products (hotel promotion scoping)', () => {
  it('returns isHotel + roomTypes for a hotel product', async () => {
    findAllProductByHostIdPaginatedMock.mockResolvedValue({
      products: [
        {
          id: 'p1',
          name: 'Hotel Beau Rivage',
          basePrice: '100',
          type: { id: 't1', name: 'Hotel', isHotelType: true },
          roomTypes: [
            { id: 'rt1', name: 'Suite' },
            { id: 'rt2', name: 'Double' },
          ],
        },
      ],
      pagination: { totalPages: 1, total: 1, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.products).toHaveLength(1)
    expect(body.products[0].isHotel).toBe(true)
    expect(body.products[0].roomTypes).toEqual([
      { id: 'rt1', name: 'Suite' },
      { id: 'rt2', name: 'Double' },
    ])
  })

  it('reports isHotel false and an empty roomTypes list for a non-hotel product', async () => {
    findAllProductByHostIdPaginatedMock.mockResolvedValue({
      products: [
        {
          id: 'p2',
          name: 'Villa Soleil',
          basePrice: '200',
          type: { id: 't2', name: 'Villa', isHotelType: false },
          roomTypes: [],
        },
      ],
      pagination: { totalPages: 1, total: 1, hasNext: false, hasPrev: false },
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.products[0].isHotel).toBe(false)
    expect(body.products[0].roomTypes).toEqual([])
  })

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    expect(findAllProductByHostIdPaginatedMock).not.toHaveBeenCalled()
  })
})
