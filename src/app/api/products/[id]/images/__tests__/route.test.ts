/**
 * PUT /api/products/[id]/images — HTTP contract for the establishment gallery.
 *
 * The global 20-photo budget is shared with the room-type galleries, so this
 * route must reject an over-budget payload *before* deleting anything. Prisma,
 * auth and the filesystem are mocked at the boundary.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const productFindUniqueMock = jest.fn()
const imagesDeleteManyMock = jest.fn()
const imagesCreateMock = jest.fn()
const roomTypeImageCountMock = jest.fn()
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: { findUnique: (...a: unknown[]) => productFindUniqueMock(...a) },
    images: {
      deleteMany: (...a: unknown[]) => imagesDeleteManyMock(...a),
      create: (...a: unknown[]) => imagesCreateMock(...a),
    },
    roomTypeImage: { count: (...a: unknown[]) => roomTypeImageCountMock(...a) },
  },
}))

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}))

import { PUT } from '../route'
import { MAX_LISTING_PHOTOS } from '@/lib/photos/photoBudget'

function urls(count: number, prefix = 'u'): string[] {
  return Array.from({ length: count }, (_, i) => `/uploads/${prefix}${i}-full.webp`)
}

function existingImages(list: string[]) {
  return list.map((img, i) => ({ id: `img${i}`, img }))
}

function putRequest(imageUrls: unknown) {
  return new Request('http://localhost/api/products/p1/images', {
    method: 'PUT',
    body: JSON.stringify({ imageUrls }),
    headers: { 'Content-Type': 'application/json' },
  }) as never
}

const params = Promise.resolve({ id: 'p1' })

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1', roles: 'HOST' } })
  productFindUniqueMock.mockResolvedValue({ id: 'p1', owner: { id: 'u1' }, img: [] })
  roomTypeImageCountMock.mockResolvedValue(0)
  imagesDeleteManyMock.mockResolvedValue({ count: 0 })
  imagesCreateMock.mockResolvedValue({ id: 'new' })
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('PUT /api/products/[id]/images', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const response = await PUT(putRequest(urls(1)), { params })

    expect(response.status).toBe(401)
    expect(productFindUniqueMock).not.toHaveBeenCalled()
  })

  it('accepts 20 establishment photos when no room type holds any', async () => {
    const response = await PUT(putRequest(urls(MAX_LISTING_PHOTOS)), { params })

    expect(response.status).toBe(200)
    expect(imagesCreateMock).toHaveBeenCalledTimes(MAX_LISTING_PHOTOS)
  })

  it('rejects with 400 and deletes nothing when room-type photos push it over budget', async () => {
    // 18 establishment + 3 room-type photos = 21 > 20.
    roomTypeImageCountMock.mockResolvedValue(3)
    productFindUniqueMock.mockResolvedValue({
      id: 'p1',
      owner: { id: 'u1' },
      img: existingImages(urls(4, 'old')),
    })

    const response = await PUT(putRequest(urls(18)), { params })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toMatch(/20 photos/)
    expect(imagesDeleteManyMock).not.toHaveBeenCalled()
    expect(imagesCreateMock).not.toHaveBeenCalled()
  })

  it('accepts a payload sitting exactly at the cap alongside room-type photos', async () => {
    roomTypeImageCountMock.mockResolvedValue(5)

    const response = await PUT(putRequest(urls(15)), { params })

    expect(response.status).toBe(200)
    expect(imagesCreateMock).toHaveBeenCalledTimes(15)
  })

  it('still rejects a non-owner with 403 before any budget work', async () => {
    productFindUniqueMock.mockResolvedValue({ id: 'p1', owner: { id: 'other' }, img: [] })

    const response = await PUT(putRequest(urls(1)), { params })

    expect(response.status).toBe(403)
    expect(roomTypeImageCountMock).not.toHaveBeenCalled()
  })
})
