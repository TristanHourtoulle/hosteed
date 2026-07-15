/**
 * `PUT /api/products/[id]` is the single write path behind both the admin edit
 * wizard and the host edit page (TRI-1028). It must enforce, server-side, that
 * only the listing owner, a HOST_MANAGER or an ADMIN can mutate the product —
 * client guards are cosmetic. It must also forward `roomTypes` untouched to the
 * service (so `syncRoomTypes` can create/update/delete) and turn a
 * `RoomTypeDeletionBlockedError` into a readable 409 rather than a 500 crash.
 * Prisma and the service layer are mocked at the boundary (node env).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const findUniqueMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
    },
  },
}))

const findProductByIdMock = jest.fn()
const updateProductMock = jest.fn()
jest.mock('@/lib/services/product.service', () => ({
  findProductById: (...a: unknown[]) => findProductByIdMock(...a),
  updateProduct: (...a: unknown[]) => updateProductMock(...a),
}))

import { RoomTypeDeletionBlockedError } from '@/lib/services/room-type.service'
import { PUT } from '../route'

const OWNER_ID = 'owner-1'
const PRODUCT_ID = 'p1'

function makeRequest(body: Record<string, unknown> = { name: 'Updated' }) {
  return new Request(`http://localhost/api/products/${PRODUCT_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const context = { params: Promise.resolve({ id: PRODUCT_ID }) }

beforeEach(() => {
  jest.clearAllMocks()
  findUniqueMock.mockResolvedValue({ ownerId: OWNER_ID })
  updateProductMock.mockResolvedValue({ id: PRODUCT_ID, name: 'Updated' })
})

describe('PUT /api/products/[id] authorization', () => {
  it('allows the listing owner to save', async () => {
    authMock.mockResolvedValue({ user: { id: OWNER_ID, roles: 'HOST' } })

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(200)
    expect(updateProductMock).toHaveBeenCalledTimes(1)
  })

  it('allows a HOST_MANAGER who does not own the listing to save', async () => {
    authMock.mockResolvedValue({ user: { id: 'manager-1', roles: 'HOST_MANAGER' } })

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(200)
    expect(updateProductMock).toHaveBeenCalledTimes(1)
  })

  it('allows an ADMIN who does not own the listing to save', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', roles: 'ADMIN' } })

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(200)
    expect(updateProductMock).toHaveBeenCalledTimes(1)
  })

  it('refuses an authenticated USER who does not own the listing (403, no write)', async () => {
    authMock.mockResolvedValue({ user: { id: 'intruder-1', roles: 'USER' } })

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(403)
    expect(updateProductMock).not.toHaveBeenCalled()
  })

  it('refuses another HOST who does not own the listing (403, no write)', async () => {
    authMock.mockResolvedValue({ user: { id: 'other-host', roles: 'HOST_VERIFIED' } })

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(403)
    expect(updateProductMock).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated request (401, no write)', async () => {
    authMock.mockResolvedValue(null)

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(401)
    expect(updateProductMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the product does not exist', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', roles: 'ADMIN' } })
    findUniqueMock.mockResolvedValue(null)

    const res = await PUT(makeRequest(), context)

    expect(res.status).toBe(404)
    expect(updateProductMock).not.toHaveBeenCalled()
  })
})

describe('PUT /api/products/[id] room types', () => {
  it('forwards the roomTypes payload to updateProduct for an owner-initiated save', async () => {
    authMock.mockResolvedValue({ user: { id: OWNER_ID, roles: 'HOST' } })
    const roomTypes = [
      { id: 'ckexisting1', name: 'Double', quantity: 2, capacity: 2, basePrice: '80', priceMGA: '1' },
      { name: 'Suite', quantity: 1, capacity: 4, basePrice: '200', priceMGA: '2' },
    ]

    const res = await PUT(makeRequest({ name: 'Hotel', isHotel: true, roomTypes }), context)

    expect(res.status).toBe(200)
    expect(updateProductMock).toHaveBeenCalledWith(
      PRODUCT_ID,
      expect.objectContaining({ roomTypes })
    )
  })

  it('surfaces RoomTypeDeletionBlockedError as a 409 naming the blocked types', async () => {
    authMock.mockResolvedValue({ user: { id: OWNER_ID, roles: 'HOST' } })
    updateProductMock.mockRejectedValue(new RoomTypeDeletionBlockedError(['Suite', 'Double']))

    const res = await PUT(makeRequest({ isHotel: true, roomTypes: [] }), context)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toContain('Suite')
    expect(body.error).toContain('Double')
  })
})
