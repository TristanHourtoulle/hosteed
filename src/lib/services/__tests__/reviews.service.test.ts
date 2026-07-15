/**
 * reviews.service covers the review lifecycle: creation (with eligibility and
 * duplicate guards), admin approval (with host notification), and deletion.
 * Prisma and the templated-mail sender are mocked at the boundary (node env).
 * Every service function swallows errors and returns null, so the tests assert
 * both the happy path and that failures degrade to null rather than throwing.
 */

const prismaMock = {
  review: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  rent: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
}

const sendTemplatedMailMock = jest.fn()

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: (...args: unknown[]) => sendTemplatedMailMock(...args),
}))

import {
  findAllReviews,
  findAllWaitingReview,
  createReview,
  approveReview,
  deleteReview,
} from '../reviews.service'

const baseCreateParams = {
  productId: 'p1',
  rentId: 'r1',
  userId: 'u1',
  grade: 5,
  welcomeGrade: 4,
  staff: 5,
  comfort: 4,
  equipment: 5,
  cleaning: 4,
  title: 'Great stay',
  text: 'Really enjoyed it',
  visitingDate: new Date('2026-01-01'),
  publishDate: new Date('2026-01-02'),
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('findAllReviews', () => {
  it('returns all reviews from prisma', async () => {
    const reviews = [{ id: 'rev1' }, { id: 'rev2' }]
    prismaMock.review.findMany.mockResolvedValue(reviews)

    const result = await findAllReviews()

    expect(result).toEqual(reviews)
  })

  it('returns null when prisma throws', async () => {
    prismaMock.review.findMany.mockRejectedValue(new Error('db down'))

    const result = await findAllReviews()

    expect(result).toBeNull()
  })
})

describe('findAllWaitingReview', () => {
  it('only queries reviews that are not yet approved', async () => {
    prismaMock.review.findMany.mockResolvedValue([])

    await findAllWaitingReview()

    const queryArg = prismaMock.review.findMany.mock.calls[0][0]
    expect(queryArg.where.approved).toBe(false)
  })

  it('returns null when prisma throws', async () => {
    prismaMock.review.findMany.mockRejectedValue(new Error('db down'))

    expect(await findAllWaitingReview()).toBeNull()
  })
})

describe('createReview', () => {
  it('creates an unapproved review and notifies every admin/host-manager', async () => {
    const created = { id: 'rev1', approved: false }
    prismaMock.rent.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1', status: 'CHECKOUT' })
    prismaMock.review.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.review.create.mockResolvedValue(created)
    prismaMock.user.findMany.mockResolvedValue([
      { email: 'admin@a.com' },
      { email: 'manager@a.com' },
    ])

    const result = await createReview(baseCreateParams)

    expect(result).toEqual(created)
    // approved must be forced to false at creation
    expect(prismaMock.review.create.mock.calls[0][0].data.approved).toBe(false)
    expect(sendTemplatedMailMock).toHaveBeenCalledTimes(2)
    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'admin@a.com',
      expect.any(String),
      'validation-avis.html',
      expect.objectContaining({ reviewUrl: expect.stringContaining('/admin/reviews') })
    )
  })

  it('returns null when the rent is not eligible (no matching rent)', async () => {
    prismaMock.rent.findUnique.mockResolvedValue(null)

    const result = await createReview(baseCreateParams)

    expect(result).toBeNull()
    expect(prismaMock.review.create).not.toHaveBeenCalled()
  })

  it('returns null when a review already exists for the rent', async () => {
    prismaMock.rent.findUnique.mockResolvedValue({ id: 'r1' })
    prismaMock.review.findFirst.mockResolvedValue({ id: 'existing' })

    const result = await createReview(baseCreateParams)

    expect(result).toBeNull()
    expect(prismaMock.review.create).not.toHaveBeenCalled()
  })

  it('returns null when the user does not exist', async () => {
    prismaMock.rent.findUnique.mockResolvedValue({ id: 'r1' })
    prismaMock.review.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)

    const result = await createReview(baseCreateParams)

    expect(result).toBeNull()
    expect(prismaMock.review.create).not.toHaveBeenCalled()
  })
})

describe('approveReview', () => {
  it('flips approved to true and emails the product owner', async () => {
    const review = {
      id: 'rev1',
      approved: true,
      rentRelation: {
        product: { id: 'p1', owner: { email: 'owner@o.com' } },
      },
    }
    prismaMock.review.update.mockResolvedValue(review)

    const result = await approveReview('rev1')

    expect(result).toEqual(review)
    expect(prismaMock.review.update.mock.calls[0][0].data.approved).toBe(true)
    expect(sendTemplatedMailMock).toHaveBeenCalledWith(
      'owner@o.com',
      expect.any(String),
      'new-review.html',
      expect.objectContaining({ reviewUrl: expect.stringContaining('/host/p1') })
    )
  })

  it('returns null when the updated review has no owner to notify', async () => {
    prismaMock.review.update.mockResolvedValue({
      id: 'rev1',
      rentRelation: { product: { id: 'p1', owner: null } },
    })

    const result = await approveReview('rev1')

    expect(result).toBeNull()
    expect(sendTemplatedMailMock).not.toHaveBeenCalled()
  })

  it('returns null when prisma update throws', async () => {
    prismaMock.review.update.mockRejectedValue(new Error('not found'))

    expect(await approveReview('rev1')).toBeNull()
  })
})

describe('deleteReview', () => {
  it('deletes and returns the removed review', async () => {
    const deleted = { id: 'rev1' }
    prismaMock.review.delete.mockResolvedValue(deleted)

    expect(await deleteReview('rev1')).toEqual(deleted)
    expect(prismaMock.review.delete).toHaveBeenCalledWith({ where: { id: 'rev1' } })
  })

  it('returns null when prisma delete throws', async () => {
    prismaMock.review.delete.mockRejectedValue(new Error('missing row'))

    expect(await deleteReview('rev1')).toBeNull()
  })
})
