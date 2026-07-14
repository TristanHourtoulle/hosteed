/**
 * DELETE /api/admin/reviews/[id]. Exercises the reviews-service delete path
 * through the HTTP layer plus the admin-only fake-rent cleanup: when the deleted
 * review belonged to an admin-created review (rent price 0 or 100) the synthetic
 * rent is also removed. Both the reviews service and prisma are mocked at the
 * boundary. Node test env; `params` is a Promise (Next 15 signature).
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const deleteReviewMock = jest.fn()
jest.mock('@/lib/services/reviews.service', () => ({
  deleteReview: (...a: unknown[]) => deleteReviewMock(...a),
}))

const prismaMock = {
  review: { findUnique: jest.fn() },
  rent: { delete: jest.fn() },
}
jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import { NextRequest } from 'next/server'
import { DELETE } from '../[id]/route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })
const request = () => new NextRequest('http://localhost/api/admin/reviews/rev1', { method: 'DELETE' })

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'admin1', roles: 'ADMIN' } })
  prismaMock.rent.delete.mockResolvedValue({ id: 'r1' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('DELETE /api/admin/reviews/[id]', () => {
  it('returns 403 for a non-admin/non-host-manager caller', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })

    const res = await DELETE(request(), params('rev1'))
    expect(res.status).toBe(403)
    expect(deleteReviewMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the review does not exist', async () => {
    prismaMock.review.findUnique.mockResolvedValue(null)

    const res = await DELETE(request(), params('rev1'))
    expect(res.status).toBe(404)
    expect(deleteReviewMock).not.toHaveBeenCalled()
  })

  it('deletes a genuine review without touching the rent (real price)', async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      rentId: 'r1',
      rentRelation: { prices: 250 },
    })
    deleteReviewMock.mockResolvedValue({ id: 'rev1' })

    const res = await DELETE(request(), params('rev1'))

    expect(res.status).toBe(200)
    expect(deleteReviewMock).toHaveBeenCalledWith('rev1')
    expect(prismaMock.rent.delete).not.toHaveBeenCalled()
  })

  it('also removes the synthetic rent when the review was admin-created (price 0)', async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      rentId: 'r1',
      rentRelation: { prices: 0 },
    })
    deleteReviewMock.mockResolvedValue({ id: 'rev1' })

    const res = await DELETE(request(), params('rev1'))

    expect(res.status).toBe(200)
    expect(prismaMock.rent.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
  })

  it('swallows a rent-cleanup failure and still reports success', async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      rentId: 'r1',
      rentRelation: { prices: 100 },
    })
    deleteReviewMock.mockResolvedValue({ id: 'rev1' })
    prismaMock.rent.delete.mockRejectedValue(new Error('rent gone'))

    const res = await DELETE(request(), params('rev1'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })
})
