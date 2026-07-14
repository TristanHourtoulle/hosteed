/**
 * Unit tests for validation-simple.service.ts.
 * Prisma, the email service and product.service are mocked at the boundary.
 */
jest.mock('@/lib/prisma', () => {
  const tx = {
    product: { findUnique: jest.fn(), update: jest.fn() },
    validationHistory: { create: jest.fn() },
  }
  return {
    __esModule: true,
    default: {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      validationHistory: { findMany: jest.fn() },
      validationComment: { findMany: jest.fn() },
      // $transaction runs the callback with the tx stub
      $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
      __tx: tx,
    },
  }
})

jest.mock('@/lib/services/email', () => ({
  emailService: {
    sendListingApproved: jest.fn(async () => ({ success: true })),
    sendListingRejected: jest.fn(async () => ({ success: true })),
    sendFromTemplate: jest.fn(async () => ({ success: true })),
  },
}))

jest.mock('@/lib/services/product.service', () => ({
  applyDraftChanges: jest.fn(async () => ({})),
  rejectDraftChanges: jest.fn(async () => ({})),
}))

import prisma from '@/lib/prisma'
import { emailService } from '@/lib/services/email'
import { applyDraftChanges, rejectDraftChanges } from '@/lib/services/product.service'
import { ProductValidation } from '@prisma/client'
import { validationService } from '../validation-simple.service'

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any
const tx = db.__tx

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.NEXT_PUBLIC_URL = 'https://example.test'
})

afterEach(() => jest.restoreAllMocks())

describe('getProductsForValidationPaginated', () => {
  it('builds a multi-status `in` clause when statuses[] is provided', async () => {
    db.product.findMany.mockResolvedValue([])
    db.product.count.mockResolvedValue(0)

    await validationService.getProductsForValidationPaginated({
      statuses: [ProductValidation.NotVerified, ProductValidation.RecheckRequest],
    })

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { validate: { in: [ProductValidation.NotVerified, ProductValidation.RecheckRequest] } },
      })
    )
  })

  it('falls back to a single-status clause', async () => {
    db.product.findMany.mockResolvedValue([])
    db.product.count.mockResolvedValue(0)

    await validationService.getProductsForValidationPaginated({
      status: ProductValidation.Approve,
    })

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { validate: ProductValidation.Approve } })
    )
  })

  it('flags products that were recently modified after a recheck request', async () => {
    db.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        validationHistory: [
          { newStatus: ProductValidation.NotVerified, hostId: 'host1' }, // latest
          { newStatus: ProductValidation.RecheckRequest, hostId: null }, // previous
        ],
      },
    ])
    db.product.count.mockResolvedValue(1)

    const result = await validationService.getProductsForValidationPaginated({})

    expect(result.products[0]).toMatchObject({
      isRecentlyModified: true,
      wasRecheckRequested: true,
      validationHistory: undefined,
    })
    expect(result.pagination.total).toBe(1)
  })

  it('does not process metadata for lightweight requests', async () => {
    const raw = [{ id: 'p1', validationHistory: [{ x: 1 }] }]
    db.product.findMany.mockResolvedValue(raw)
    db.product.count.mockResolvedValue(1)

    const result = await validationService.getProductsForValidationPaginated({
      includeLightweight: true,
    })

    // Returned untouched — no isRecentlyModified injection
    expect(result.products).toBe(raw)
    expect((result.products[0] as any).isRecentlyModified).toBeUndefined()
  })
})

describe('updateProductStatus', () => {
  it('updates the validate field', async () => {
    db.product.update.mockResolvedValue({ id: 'p1', validate: ProductValidation.Approve })

    await validationService.updateProductStatus('p1', ProductValidation.Approve)

    expect(db.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { validate: ProductValidation.Approve },
    })
  })
})

describe('approveProduct', () => {
  it('throws when the product does not exist', async () => {
    tx.product.findUnique.mockResolvedValue(null)

    await expect(validationService.approveProduct('missing', 'admin1')).rejects.toThrow(
      'Produit non trouvé'
    )
  })

  it('approves a standard (non-draft) product, records history and emails the host', async () => {
    tx.product.findUnique.mockResolvedValue({
      validate: ProductValidation.NotVerified,
      isDraft: false,
      originalProductId: null,
    })
    tx.product.update.mockResolvedValue({
      id: 'p1',
      name: 'Nice place',
      owner: { email: 'host@b.c', name: 'Host', lastname: 'One' },
    })
    tx.validationHistory.create.mockResolvedValue({})

    await validationService.approveProduct('p1', 'admin1')

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { validate: ProductValidation.Approve } })
    )
    expect(tx.validationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          newStatus: ProductValidation.Approve,
          adminId: 'admin1',
        }),
      })
    )
    expect(emailService.sendListingApproved).toHaveBeenCalledWith(
      'host@b.c',
      'Host',
      expect.objectContaining({ listingTitle: 'Nice place' })
    )
  })

  it('applies draft changes when approving a draft product', async () => {
    tx.product.findUnique
      .mockResolvedValueOnce({
        validate: ProductValidation.ModificationPending,
        isDraft: true,
        originalProductId: 'orig1',
      })
      .mockResolvedValueOnce({
        id: 'orig1',
        name: 'Merged',
        owner: { email: 'host@b.c', name: 'Host', lastname: null },
      })
    tx.validationHistory.create.mockResolvedValue({})

    await validationService.approveProduct('draft1', 'admin1')

    expect(applyDraftChanges).toHaveBeenCalledWith('draft1')
    // History is recorded against the original product id
    expect(tx.validationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ productId: 'orig1' }) })
    )
  })
})

describe('rejectProduct', () => {
  it('throws when the product does not exist', async () => {
    tx.product.findUnique.mockResolvedValue(null)

    await expect(validationService.rejectProduct('missing', 'admin1', 'bad')).rejects.toThrow(
      'Produit non trouvé'
    )
  })

  it('rejects a standard product, records history and emails the host', async () => {
    tx.product.findUnique.mockResolvedValue({
      validate: ProductValidation.NotVerified,
      isDraft: false,
      originalProductId: null,
      name: 'Place',
    })
    tx.product.update.mockResolvedValue({
      id: 'p1',
      name: 'Place',
      owner: { email: 'host@b.c', name: 'Host', lastname: null },
    })
    tx.validationHistory.create.mockResolvedValue({})

    await validationService.rejectProduct('p1', 'admin1', 'Photos floues')

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { validate: ProductValidation.Refused } })
    )
    expect(emailService.sendListingRejected).toHaveBeenCalledWith(
      'host@b.c',
      'Host',
      expect.objectContaining({ rejectionReason: 'Photos floues' })
    )
  })

  it('delegates draft rejection to rejectDraftChanges and returns early', async () => {
    tx.product.findUnique
      .mockResolvedValueOnce({
        validate: ProductValidation.ModificationPending,
        isDraft: true,
        originalProductId: 'orig1',
        name: 'Draft place',
      })
      .mockResolvedValueOnce({
        id: 'draft1',
        name: 'Draft place',
        owner: { email: 'host@b.c', name: 'Host', lastname: null },
      })

    await validationService.rejectProduct('draft1', 'admin1', 'nope')

    expect(rejectDraftChanges).toHaveBeenCalledWith('draft1', 'nope')
    // No history / rejection email path for drafts (handled by rejectDraftChanges)
    expect(tx.validationHistory.create).not.toHaveBeenCalled()
    expect(emailService.sendListingRejected).not.toHaveBeenCalled()
  })
})

describe('requestRecheck', () => {
  it('throws when the product does not exist', async () => {
    tx.product.findUnique.mockResolvedValue(null)

    await expect(
      validationService.requestRecheck('missing', 'admin1', 'reason')
    ).rejects.toThrow('Produit non trouvé')
  })

  it('sets RecheckRequest, records history and emails the host', async () => {
    tx.product.findUnique.mockResolvedValue({ validate: ProductValidation.NotVerified })
    tx.product.update.mockResolvedValue({
      id: 'p1',
      name: 'Place',
      owner: { email: 'host@b.c', name: 'Host', lastname: null },
    })
    tx.validationHistory.create.mockResolvedValue({})

    await validationService.requestRecheck('p1', 'admin1', 'Ajouter des photos')

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { validate: ProductValidation.RecheckRequest } })
    )
    expect(emailService.sendFromTemplate).toHaveBeenCalledWith(
      'annonce-modifiee',
      'host@b.c',
      expect.stringContaining('Place'),
      expect.objectContaining({ modificationsRequested: 'Ajouter des photos' })
    )
  })
})

describe('getValidationStats', () => {
  it('aggregates counts by validation status', async () => {
    db.product.groupBy.mockResolvedValue([
      { validate: ProductValidation.NotVerified, _count: { id: 10 } },
      { validate: ProductValidation.Approve, _count: { id: 4 } },
      { validate: ProductValidation.Refused, _count: { id: 2 } },
      { validate: ProductValidation.RecheckRequest, _count: { id: 1 } },
      { validate: ProductValidation.ModificationPending, _count: { id: 3 } },
    ])
    // recentlyModifiedCount, then draftsCount
    db.product.count.mockResolvedValueOnce(6).mockResolvedValueOnce(5)

    const stats = await validationService.getValidationStats()

    expect(stats.pending).toBe(4) // 10 notVerified - 6 recentlyModified
    expect(stats.approved).toBe(4)
    expect(stats.rejected).toBe(2)
    expect(stats.recheckRequest).toBe(7) // 1 recheck + 6 recentlyModified
    expect(stats.modificationPending).toBe(3)
    expect(stats.drafts).toBe(5)
  })
})

describe('getValidationHistory / getValidationComments', () => {
  it('returns history ordered by createdAt desc', async () => {
    const history = [{ id: 'h1' }]
    db.validationHistory.findMany.mockResolvedValue(history)

    expect(await validationService.getValidationHistory('p1')).toBe(history)
    expect(db.validationHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 'p1' } })
    )
  })

  it('returns comments for a product', async () => {
    const comments = [{ id: 'c1' }]
    db.validationComment.findMany.mockResolvedValue(comments)

    expect(await validationService.getValidationComments('p1')).toBe(comments)
  })
})
