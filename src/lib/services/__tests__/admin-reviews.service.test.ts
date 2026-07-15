/**
 * Admin (fake) reviews service. Prisma + the Brevo mail sender are mocked at the
 * boundary (node env). We verify role gating, product existence, the fake
 * rent+review creation, admin notifications, and the {success:false} error shape.
 */

const user = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}
const product = { findUnique: jest.fn() }
const rent = { create: jest.fn() }
const review = { create: jest.fn(), findMany: jest.fn() }
const sendTemplatedMail = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { user, product, rent, review },
}))

jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: (...a: unknown[]) => sendTemplatedMail(...a),
}))

import {
  createAdminReview,
  createFakeUser,
  createAdvancedAdminReview,
  getAdminCreatedReviews,
} from '../admin-reviews.service'

const baseParams = {
  productId: 'p1',
  adminId: 'admin1',
  grade: 5,
  welcomeGrade: 5,
  staff: 5,
  comfort: 5,
  equipment: 5,
  cleaning: 5,
  title: 'Great',
  text: 'Nice stay',
  visitingDate: new Date('2026-05-01'),
  publishDate: new Date('2026-05-02'),
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  sendTemplatedMail.mockResolvedValue(undefined)
})

describe('createAdminReview', () => {
  it('rejects a non-admin/non-host-manager author', async () => {
    user.findUnique.mockResolvedValue({ roles: 'USER', name: 'x', email: 'x@x.com' })

    const result = await createAdminReview(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Accès non autorisé/)
    expect(rent.create).not.toHaveBeenCalled()
  })

  it('returns an error when the product is not found', async () => {
    user.findUnique.mockResolvedValue({ roles: 'ADMIN', name: 'a', email: 'a@a.com' })
    product.findUnique.mockResolvedValue(null)

    const result = await createAdminReview(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Produit non trouvé')
  })

  it('creates a fake rent + approved review and notifies other admins', async () => {
    user.findUnique.mockResolvedValue({ roles: 'ADMIN', name: 'a', email: 'a@a.com' })
    product.findUnique.mockResolvedValue({ id: 'p1', name: 'Hotel' })
    rent.create.mockResolvedValue({ id: 'rent1' })
    review.create.mockResolvedValue({ id: 'review1' })
    user.findMany.mockResolvedValue([
      { email: 'other1@x.com' },
      { email: 'other2@x.com' },
    ])

    const result = await createAdminReview(baseParams)

    expect(result.success).toBe(true)
    expect(result.review).toEqual({ id: 'review1' })
    // Review is auto-approved for admin reviews.
    expect(review.create.mock.calls[0][0].data.approved).toBe(true)
    // Linked to the freshly created fake rent.
    expect(review.create.mock.calls[0][0].data.rentRelation.connect.id).toBe('rent1')
    expect(sendTemplatedMail).toHaveBeenCalledTimes(2)
  })

  it('does not fail the operation when notification email throws', async () => {
    user.findUnique.mockResolvedValue({ roles: 'HOST_MANAGER', name: 'a', email: 'a@a.com' })
    product.findUnique.mockResolvedValue({ id: 'p1', name: 'Hotel' })
    rent.create.mockResolvedValue({ id: 'rent1' })
    review.create.mockResolvedValue({ id: 'review1' })
    user.findMany.mockResolvedValue([{ email: 'other@x.com' }])
    sendTemplatedMail.mockRejectedValue(new Error('brevo down'))

    const result = await createAdminReview(baseParams)

    expect(result.success).toBe(true)
  })
})

describe('createFakeUser', () => {
  it('returns the existing user when the email is already taken', async () => {
    user.findUnique.mockResolvedValue({ id: 'existing', email: 'f@x.com' })

    const result = await createFakeUser({ name: 'Fake', email: 'f@x.com' })

    expect(result).toEqual({ id: 'existing', email: 'f@x.com' })
    expect(user.create).not.toHaveBeenCalled()
  })

  it('creates a verified USER when the email is free', async () => {
    user.findUnique.mockResolvedValue(null)
    user.create.mockResolvedValue({ id: 'new', email: 'f@x.com' })

    const result = await createFakeUser({ name: 'Fake', email: 'f@x.com' })

    expect(result).toEqual({ id: 'new', email: 'f@x.com' })
    const data = user.create.mock.calls[0][0].data
    expect(data.roles).toBe('USER')
    expect(data.emailVerified).toBeInstanceOf(Date)
  })
})

describe('createAdvancedAdminReview', () => {
  it('rejects a non-authorized author', async () => {
    user.findUnique.mockResolvedValue({ roles: 'USER' })

    const result = await createAdvancedAdminReview({
      ...baseParams,
      fakeUserName: 'Fake',
      fakeUserEmail: 'fake@x.com',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Accès non autorisé')
  })

  it('creates a fake user, rent, and review', async () => {
    // 1st findUnique = admin lookup, 2nd = fake user lookup inside createFakeUser
    user.findUnique
      .mockResolvedValueOnce({ roles: 'ADMIN' })
      .mockResolvedValueOnce(null)
    user.create.mockResolvedValue({ id: 'fakeuser', email: 'fake@x.com' })
    rent.create.mockResolvedValue({ id: 'rent1' })
    review.create.mockResolvedValue({ id: 'review1' })

    const result = await createAdvancedAdminReview({
      ...baseParams,
      fakeUserName: 'Fake',
      fakeUserEmail: 'fake@x.com',
    })

    expect(result.success).toBe(true)
    expect(result.fakeUser).toEqual({ id: 'fakeuser', email: 'fake@x.com' })
    // Fake rent links to the fake user, not the admin.
    expect(rent.create.mock.calls[0][0].data.userId).toBe('fakeuser')
  })
})

describe('getAdminCreatedReviews', () => {
  it('rejects a non-authorized caller', async () => {
    user.findUnique.mockResolvedValue({ roles: 'USER' })
    const result = await getAdminCreatedReviews('user1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Accès non autorisé')
  })

  it('returns admin reviews identified by the zero-price fake rent', async () => {
    user.findUnique.mockResolvedValue({ roles: 'ADMIN' })
    review.findMany.mockResolvedValue([{ id: 'review1' }])

    const result = await getAdminCreatedReviews('admin1')

    expect(result.success).toBe(true)
    expect(result.reviews).toEqual([{ id: 'review1' }])
    // Identified via rentRelation.prices === 0
    expect(review.findMany.mock.calls[0][0].where.rentRelation.prices).toBe(BigInt(0))
  })
})
