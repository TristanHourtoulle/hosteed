/**
 * favorites.service maps Prisma outcomes to a stable {success, ...} contract.
 * The interesting behaviour is the mapping of Prisma known-error codes to
 * user-facing results: a duplicate favorite (P2002) is treated as success
 * (idempotent add), a missing FK (P2003) / missing row (P2025) as a failure.
 * Prisma is mocked at the boundary; the real Prisma namespace is used to build
 * authentic PrismaClientKnownRequestError instances.
 */

const prismaMock = {
  user: { findUnique: jest.fn() },
  product: { findUnique: jest.fn() },
  favorite: {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import { Prisma } from '@prisma/client'
import {
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getUserFavorites,
  getFavoriteCount,
} from '../favorites.service'

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock', {
    code,
    clientVersion: 'test',
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('addToFavorites', () => {
  it('creates the favorite when user and product both exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.favorite.create.mockResolvedValue({ id: 'f1', userId: 'u1', productId: 'p1' })

    const result = await addToFavorites('u1', 'p1')

    expect(result).toEqual({ success: true, favorite: { id: 'f1', userId: 'u1', productId: 'p1' } })
  })

  it('fails when the user does not exist and never creates a favorite', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })

    const result = await addToFavorites('missing', 'p1')

    expect(result).toEqual({ success: false, error: "Erreur lors de l'ajout aux favoris" })
    expect(prismaMock.favorite.create).not.toHaveBeenCalled()
  })

  it('fails when the product does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.product.findUnique.mockResolvedValue(null)

    const result = await addToFavorites('u1', 'missing')

    expect(result.success).toBe(false)
    expect(prismaMock.favorite.create).not.toHaveBeenCalled()
  })

  it('treats a duplicate (P2002) as an idempotent success', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.favorite.create.mockRejectedValue(knownError('P2002'))

    const result = await addToFavorites('u1', 'p1')

    expect(result).toEqual({ success: true, message: 'Ce produit est déjà dans vos favoris' })
  })

  it('maps a foreign-key violation (P2003) to a failure', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.favorite.create.mockRejectedValue(knownError('P2003'))

    const result = await addToFavorites('u1', 'p1')

    expect(result).toEqual({ success: false, error: 'Utilisateur ou produit non trouvé' })
  })

  it('maps an unexpected error to a generic failure', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' })
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.favorite.create.mockRejectedValue(new Error('boom'))

    const result = await addToFavorites('u1', 'p1')

    expect(result).toEqual({ success: false, error: "Erreur lors de l'ajout aux favoris" })
  })
})

describe('removeFromFavorites', () => {
  it('removes the favorite by the composite key', async () => {
    prismaMock.favorite.delete.mockResolvedValue({ id: 'f1' })

    const result = await removeFromFavorites('u1', 'p1')

    expect(result).toEqual({ success: true, favorite: { id: 'f1' } })
    expect(prismaMock.favorite.delete).toHaveBeenCalledWith({
      where: { userId_productId: { userId: 'u1', productId: 'p1' } },
    })
  })

  it('reports "not found" when the favorite is missing (P2025)', async () => {
    prismaMock.favorite.delete.mockRejectedValue(knownError('P2025'))

    const result = await removeFromFavorites('u1', 'p1')

    expect(result).toEqual({ success: false, error: 'Favori non trouvé' })
  })

  it('maps an unexpected error to a generic failure', async () => {
    prismaMock.favorite.delete.mockRejectedValue(new Error('boom'))

    const result = await removeFromFavorites('u1', 'p1')

    expect(result).toEqual({ success: false, error: 'Erreur lors de la suppression du favori' })
  })
})

describe('isFavorite', () => {
  it('returns true when a favorite row exists', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue({ id: 'f1' })
    expect(await isFavorite('u1', 'p1')).toBe(true)
  })

  it('returns false when no favorite row exists', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue(null)
    expect(await isFavorite('u1', 'p1')).toBe(false)
  })

  it('returns false when prisma throws', async () => {
    prismaMock.favorite.findUnique.mockRejectedValue(new Error('boom'))
    expect(await isFavorite('u1', 'p1')).toBe(false)
  })
})

describe('getUserFavorites', () => {
  it('serializes BigInt fields before returning the list', async () => {
    prismaMock.favorite.findMany.mockResolvedValue([
      { id: 'f1', product: { id: 'p1', price: 1000n } },
    ])

    const result = (await getUserFavorites('u1')) as Array<{ product: { price: string } }>

    expect(result[0].product.price).toBe('1000')
  })

  it('returns an empty array when prisma throws', async () => {
    prismaMock.favorite.findMany.mockRejectedValue(new Error('boom'))
    expect(await getUserFavorites('u1')).toEqual([])
  })
})

describe('getFavoriteCount', () => {
  it('returns the count from prisma', async () => {
    prismaMock.favorite.count.mockResolvedValue(7)
    expect(await getFavoriteCount('p1')).toBe(7)
  })

  it('returns 0 when prisma throws', async () => {
    prismaMock.favorite.count.mockRejectedValue(new Error('boom'))
    expect(await getFavoriteCount('p1')).toBe(0)
  })
})
