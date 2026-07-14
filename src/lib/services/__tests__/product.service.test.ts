/**
 * Characterization tests for the products domain core service.
 *
 * Everything is mocked at the boundary (node env): the default Prisma client,
 * the email sender, cache invalidation, and the sibling services the product
 * service orchestrates (users, validation history, hotel, special prices,
 * room-type sync). No real DB / network is touched.
 *
 * These tests document CURRENT behavior; where a genuine bug surfaces it is
 * asserted-as-is and flagged in the accompanying report, not fixed here.
 */
import { ProductValidation } from '@prisma/client'

// ---- Prisma boundary mock -------------------------------------------------
type Fn = jest.Mock

const prismaMock = {
  product: {
    findUnique: jest.fn() as Fn,
    findFirst: jest.fn() as Fn,
    findMany: jest.fn() as Fn,
    create: jest.fn() as Fn,
    update: jest.fn() as Fn,
    delete: jest.fn() as Fn,
    deleteMany: jest.fn() as Fn,
    count: jest.fn() as Fn,
  },
  equipment: { findMany: jest.fn() as Fn },
  services: { findMany: jest.fn() as Fn },
  meals: { findMany: jest.fn() as Fn },
  security: { findMany: jest.fn() as Fn },
  includedService: { findMany: jest.fn() as Fn },
  productExtra: { findMany: jest.fn() as Fn },
  propertyHighlight: { findMany: jest.fn() as Fn },
  specialPrices: { findMany: jest.fn() as Fn },
  rules: { create: jest.fn() as Fn, update: jest.fn() as Fn, findFirst: jest.fn() as Fn },
  propertyInfo: { create: jest.fn() as Fn, upsert: jest.fn() as Fn },
  nearbyPlace: { deleteMany: jest.fn() as Fn },
  transportOption: { deleteMany: jest.fn() as Fn, createMany: jest.fn() as Fn },
  $transaction: jest.fn() as Fn,
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

const sendTemplatedMail = jest.fn()
jest.mock('@/lib/services/sendTemplatedMail', () => ({
  sendTemplatedMail: (...a: unknown[]) => sendTemplatedMail(...a),
}))

const findAllUserByRoles = jest.fn()
jest.mock('@/lib/services/user.service', () => ({
  findAllUserByRoles: (...a: unknown[]) => findAllUserByRoles(...a),
}))

const createValidationHistory = jest.fn()
jest.mock('@/lib/services/validation.service', () => ({
  createValidationHistory: (...a: unknown[]) => createValidationHistory(...a),
}))

const invalidateProductCache = jest.fn()
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: (...a: unknown[]) => invalidateProductCache(...a),
}))

const createHotel = jest.fn()
const findHotelByManagerId = jest.fn()
jest.mock('@/lib/services/hotel.service', () => ({
  create: (...a: unknown[]) => createHotel(...a),
  findHotelByManagerId: (...a: unknown[]) => findHotelByManagerId(...a),
}))

const createSpecialPrices = jest.fn()
jest.mock('@/lib/services/specialPrices.service', () => ({
  createSpecialPrices: (...a: unknown[]) => createSpecialPrices(...a),
}))

const syncRoomTypes = jest.fn()
jest.mock('@/lib/services/room-type.service', () => ({
  syncRoomTypes: (...a: unknown[]) => syncRoomTypes(...a),
}))

import {
  createProduct,
  updateProduct,
  validateProduct,
  rejectProduct,
  deleteProduct,
  deleteMultipleProducts,
  deleteRejectedProduct,
  deleteMultipleRejectedProducts,
  createDraftProduct,
  applyDraftChanges,
  rejectDraftChanges,
  hasPendingDraft,
  getDraftProduct,
  findAllProductByHostIdPaginated,
  findAllProductsPaginated,
} from '../product.service'

import type { CreateProductInput } from '@/lib/interface/userInterface'

// Silence the very chatty console the service uses so test output stays useful.
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

function baseCreateInput(overrides: Partial<CreateProductInput> = {}): CreateProductInput {
  return {
    name: 'Villa Bleue',
    description: 'A nice place',
    address: 'Antananarivo',
    typeId: 'type-1',
    basePrice: '100',
    priceMGA: '400000',
    arriving: '15:00',
    leaving: '11:00',
    longitude: 47.5,
    latitude: -18.9,
    userId: ['user-1'],
    equipments: ['eq-1'],
    services: ['sv-1'],
    meals: ['ml-1'],
    securities: ['sc-1'],
    images: ['base64img'],
    ...overrides,
  } as CreateProductInput
}

beforeEach(() => {
  jest.clearAllMocks()

  // Related-entity existence checks default to "all valid".
  prismaMock.equipment.findMany.mockResolvedValue([{ id: 'eq-1' }])
  prismaMock.services.findMany.mockResolvedValue([{ id: 'sv-1' }])
  prismaMock.meals.findMany.mockResolvedValue([{ id: 'ml-1' }])
  prismaMock.security.findMany.mockResolvedValue([{ id: 'sc-1' }])
  prismaMock.includedService.findMany.mockResolvedValue([])
  prismaMock.productExtra.findMany.mockResolvedValue([])
  prismaMock.propertyHighlight.findMany.mockResolvedValue([])

  prismaMock.product.create.mockResolvedValue({ id: 'prod-1', name: 'Villa Bleue' })
  prismaMock.product.update.mockResolvedValue({ id: 'prod-1', name: 'Villa Bleue' })
  prismaMock.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Villa Bleue' })
  prismaMock.product.findFirst.mockResolvedValue(null)
  prismaMock.rules.create.mockResolvedValue({ id: 'rule-1' })

  findAllUserByRoles.mockResolvedValue([])
  // $transaction default: run the callback with a tx that mirrors prisma.
  prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock))
})

// ===========================================================================
// createProduct
// ===========================================================================
describe('createProduct', () => {
  it('creates a base product and returns the fully-loaded product', async () => {
    const result = await createProduct(baseCreateInput())

    expect(prismaMock.product.create).toHaveBeenCalledTimes(1)
    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.name).toBe('Villa Bleue')
    expect(createArg.data.validate).toBe(ProductValidation.NotVerified)
    // Auto-created rules row.
    expect(prismaMock.rules.create).toHaveBeenCalledTimes(1)
    // Cache invalidated at the end.
    expect(invalidateProductCache).toHaveBeenCalled()
    // Returns the re-fetched final product.
    expect(result).toEqual({ id: 'prod-1', name: 'Villa Bleue' })
  })

  it('parses HH:MM check-in/out into integer hours', async () => {
    await createProduct(baseCreateInput({ arriving: '14:30', leaving: '10:00' }))

    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.arriving).toBe(14)
    expect(createArg.data.leaving).toBe(10)
  })

  it('converts numeric room/bathroom fields to BigInt', async () => {
    await createProduct(baseCreateInput({ room: 3, bathroom: 2 }))

    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.room).toBe(BigInt(3))
    expect(createArg.data.bathroom).toBe(BigInt(2))
    expect(createArg.data.categories).toBe(BigInt(0))
  })

  it('only connects related entities whose IDs actually exist', async () => {
    prismaMock.equipment.findMany.mockResolvedValue([{ id: 'eq-1' }]) // eq-bad filtered out

    await createProduct(baseCreateInput({ equipments: ['eq-1', 'eq-bad'] }))

    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.equipments.connect).toEqual([{ id: 'eq-1' }])
  })

  it('sets availableRooms from hotelInfo when provided', async () => {
    await createProduct(baseCreateInput({ hotelInfo: { name: 'Hotel X', availableRooms: 7 } }))

    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.availableRooms).toBe(7)
  })

  it('leaves availableRooms null when no hotelInfo is given', async () => {
    await createProduct(baseCreateInput())

    const createArg = prismaMock.product.create.mock.calls[0][0]
    expect(createArg.data.availableRooms).toBeNull()
  })

  it('syncs room types inside a transaction when roomTypes are provided', async () => {
    await createProduct(
      baseCreateInput({
        roomTypes: [
          { name: 'Suite', quantity: 2, capacity: 4, basePrice: '120', priceMGA: '480000' },
        ],
      })
    )

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(syncRoomTypes).toHaveBeenCalledTimes(1)
    const [, productId, roomTypes] = syncRoomTypes.mock.calls[0]
    expect(productId).toBe('prod-1')
    expect(roomTypes).toHaveLength(1)
  })

  it('does not open a transaction when roomTypes is empty', async () => {
    await createProduct(baseCreateInput({ roomTypes: [] }))
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(syncRoomTypes).not.toHaveBeenCalled()
  })

  it('delegates special prices to createSpecialPrices for each entry', async () => {
    createSpecialPrices.mockResolvedValue({ id: 'sp-1' })

    await createProduct(
      baseCreateInput({
        specialPrices: [
          {
            pricesMga: '500000',
            pricesEuro: '120',
            day: ['Monday'],
            startDate: null,
            endDate: null,
            activate: true,
          },
        ],
      })
    )

    expect(createSpecialPrices).toHaveBeenCalledTimes(1)
    expect(createSpecialPrices).toHaveBeenCalledWith(
      '500000',
      '120',
      ['Monday'],
      null,
      null,
      true,
      'prod-1'
    )
  })

  it('emails admins and host managers about the pending listing', async () => {
    findAllUserByRoles.mockResolvedValue([{ email: 'admin@test.com', name: 'Admin' }])

    await createProduct(baseCreateInput())

    expect(findAllUserByRoles).toHaveBeenCalledWith(['ADMIN', 'HOST_MANAGER'])
  })

  it('throws when required text fields are missing', async () => {
    await expect(createProduct(baseCreateInput({ name: '' }))).rejects.toThrow(
      /Champs obligatoires manquants/
    )
    expect(prismaMock.product.create).not.toHaveBeenCalled()
  })

  it('throws when prices are missing', async () => {
    await expect(createProduct(baseCreateInput({ basePrice: '' }))).rejects.toThrow(
      /Prix obligatoires manquants/
    )
  })

  it('throws when no user is assigned', async () => {
    await expect(createProduct(baseCreateInput({ userId: [] }))).rejects.toThrow(
      /Aucun utilisateur assigné/
    )
  })

  it('re-throws when the underlying create fails', async () => {
    prismaMock.product.create.mockRejectedValue(new Error('db down'))
    await expect(createProduct(baseCreateInput())).rejects.toThrow('db down')
  })
})

// ===========================================================================
// updateProduct
// ===========================================================================
describe('updateProduct', () => {
  beforeEach(() => {
    prismaMock.product.update.mockResolvedValue({ id: 'prod-1', name: 'Updated' })
  })

  it('maps provided scalar fields onto the update payload', async () => {
    await updateProduct('prod-1', { name: 'New name', basePrice: '250' })

    const updateArg = prismaMock.product.update.mock.calls[0][0]
    expect(updateArg.where).toEqual({ id: 'prod-1' })
    expect(updateArg.data.name).toBe('New name')
    expect(updateArg.data.basePrice).toBe('250')
  })

  it('converts room to BigInt and to null when falsy', async () => {
    await updateProduct('prod-1', { room: 4 })
    expect(prismaMock.product.update.mock.calls[0][0].data.room).toBe(BigInt(4))

    jest.clearAllMocks()
    prismaMock.product.update.mockResolvedValue({ id: 'prod-1' })
    await updateProduct('prod-1', { room: null })
    expect(prismaMock.product.update.mock.calls[0][0].data.room).toBeNull()
  })

  it('replaces relation sets (disconnect-all then connect) for equipment', async () => {
    await updateProduct('prod-1', { equipmentIds: ['eq-9', 'eq-10'] })

    const updateArg = prismaMock.product.update.mock.calls[0][0]
    expect(updateArg.data.equipments).toEqual({
      set: [],
      connect: [{ id: 'eq-9' }, { id: 'eq-10' }],
    })
  })

  it('sets availableRooms only when isHotel + hotelInfo are both present', async () => {
    await updateProduct('prod-1', {
      isHotel: true,
      hotelInfo: { name: 'H', availableRooms: 12 },
    })
    expect(prismaMock.product.update.mock.calls[0][0].data.availableRooms).toBe(12)
  })

  it('reconciles room types in a transaction when roomTypes is provided', async () => {
    await updateProduct('prod-1', {
      roomTypes: [{ name: 'Deluxe', quantity: 1, capacity: 2, basePrice: '90', priceMGA: '360000' }],
    })

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(syncRoomTypes).toHaveBeenCalledWith(prismaMock, 'prod-1', expect.any(Array))
  })

  it('upserts property info as a side effect', async () => {
    await updateProduct('prod-1', { propertyInfo: { hasStairs: true } })

    expect(prismaMock.propertyInfo.upsert).toHaveBeenCalledTimes(1)
    const arg = prismaMock.propertyInfo.upsert.mock.calls[0][0]
    expect(arg.where).toEqual({ productId: 'prod-1' })
    expect(arg.create.hasStairs).toBe(true)
  })

  it('re-throws when the update fails', async () => {
    prismaMock.product.update.mockRejectedValue(new Error('update boom'))
    await expect(updateProduct('prod-1', { name: 'x' })).rejects.toThrow('update boom')
  })
})

// ===========================================================================
// validateProduct / rejectProduct
// ===========================================================================
describe('validateProduct', () => {
  it('approves the product, emails the owner, and invalidates cache', async () => {
    prismaMock.product.update.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      owner: { email: 'owner@test.com', name: 'Owner' },
    })

    const result = await validateProduct('prod-1')

    expect(prismaMock.product.update.mock.calls[0][0].data.validate).toBe(
      ProductValidation.Approve
    )
    expect(sendTemplatedMail).toHaveBeenCalledWith(
      'owner@test.com',
      expect.stringMatching(/validée/),
      'annonce-approved.html',
      expect.any(Object)
    )
    expect(invalidateProductCache).toHaveBeenCalledWith('prod-1')
    expect(result).not.toBeNull()
  })

  it('returns null (no email) when the product has no owner', async () => {
    prismaMock.product.update.mockResolvedValue({ id: 'prod-1', name: 'Villa', owner: null })

    const result = await validateProduct('prod-1')

    expect(result).toBeNull()
    expect(sendTemplatedMail).not.toHaveBeenCalled()
  })

  it('returns null and swallows a DB error', async () => {
    prismaMock.product.update.mockRejectedValue(new Error('nope'))
    await expect(validateProduct('prod-1')).resolves.toBeNull()
  })
})

describe('rejectProduct', () => {
  it('refuses the product and emails the owner', async () => {
    prismaMock.product.update.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      owner: { email: 'owner@test.com', name: 'Owner' },
    })

    await rejectProduct('prod-1')

    expect(prismaMock.product.update.mock.calls[0][0].data.validate).toBe(
      ProductValidation.Refused
    )
    expect(sendTemplatedMail).toHaveBeenCalledWith(
      'owner@test.com',
      expect.stringMatching(/rejetée/),
      'annonce-rejected.html',
      expect.any(Object)
    )
    expect(invalidateProductCache).toHaveBeenCalledWith('prod-1')
  })

  it('returns null on error', async () => {
    prismaMock.product.update.mockRejectedValue(new Error('x'))
    await expect(rejectProduct('prod-1')).resolves.toBeNull()
  })
})

// ===========================================================================
// delete flows
// ===========================================================================
describe('deleteProduct', () => {
  it('deletes a product with no active reservations', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      _count: { rents: 0 },
    })
    prismaMock.product.delete.mockResolvedValue({})

    const result = await deleteProduct('prod-1')

    expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } })
    expect(invalidateProductCache).toHaveBeenCalledWith('prod-1')
    expect(result).toEqual({ success: true, productName: 'Villa' })
  })

  it('throws when the product is not found', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    await expect(deleteProduct('missing')).rejects.toThrow('Produit non trouvé')
  })

  it('throws when the product has active reservations', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      _count: { rents: 2 },
    })
    await expect(deleteProduct('prod-1')).rejects.toThrow(/réservations actives/)
    expect(prismaMock.product.delete).not.toHaveBeenCalled()
  })
})

describe('deleteMultipleProducts', () => {
  it('skips products with active rents and deletes the rest', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'a', name: 'A', _count: { rents: 0 } },
      { id: 'b', name: 'B', _count: { rents: 3 } },
      { id: 'c', name: 'C', _count: { rents: 0 } },
    ])
    prismaMock.product.deleteMany.mockResolvedValue({ count: 2 })

    const result = await deleteMultipleProducts(['a', 'b', 'c'])

    expect(prismaMock.product.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'c'] } },
    })
    expect(result.deletedCount).toBe(2)
    expect(result.blockedProducts).toEqual([{ id: 'b', name: 'B', activeRentsCount: 3 }])
  })

  it('throws when no products match the given IDs', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    await expect(deleteMultipleProducts(['x'])).rejects.toThrow('Aucun produit trouvé')
  })
})

describe('deleteRejectedProduct', () => {
  it('deletes a Refused product and returns its owner email', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      validate: ProductValidation.Refused,
      owner: { email: 'owner@test.com' },
    })
    prismaMock.product.delete.mockResolvedValue({})

    const result = await deleteRejectedProduct('prod-1')

    expect(result).toEqual({
      success: true,
      productName: 'Villa',
      userEmails: ['owner@test.com'],
    })
  })

  it('refuses to delete a non-Refused product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Villa',
      validate: ProductValidation.Approve,
      owner: { email: 'owner@test.com' },
    })

    const result = await deleteRejectedProduct('prod-1')

    expect(result.success).toBe(false)
    expect(prismaMock.product.delete).not.toHaveBeenCalled()
  })
})

describe('deleteMultipleRejectedProducts', () => {
  it('deletes all matched rejected products and returns unique emails', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'a', name: 'A', validate: ProductValidation.Refused, owner: { email: 'x@test.com' } },
      { id: 'b', name: 'B', validate: ProductValidation.Refused, owner: { email: 'x@test.com' } },
    ])
    prismaMock.product.deleteMany.mockResolvedValue({ count: 2 })

    const result = await deleteMultipleRejectedProducts(['a', 'b'])

    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(2)
    expect(result.userEmails).toEqual(['x@test.com'])
  })

  it('fails when no rejected products are found', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    const result = await deleteMultipleRejectedProducts(['a'])
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// Draft flow
// ===========================================================================
describe('draft flow', () => {
  const originalProduct = {
    id: 'orig-1',
    name: 'Original',
    description: 'd',
    address: 'a',
    basePrice: '100',
    priceMGA: '400000',
    room: BigInt(2),
    bathroom: BigInt(1),
    arriving: 15,
    leaving: 11,
    autoAccept: false,
    equipement: null,
    meal: null,
    services: null,
    security: null,
    minRent: null,
    maxRent: null,
    advanceRent: null,
    delayTime: null,
    categories: BigInt(0),
    minPeople: null,
    maxPeople: null,
    commission: null,
    typeId: 'type-1',
    phone: '',
    phoneCountry: 'MG',
    latitude: -18,
    longitude: 47,
    certified: false,
    contract: false,
    sizeRoom: null,
    availableRooms: null,
    img: [{ img: 'i1' }],
    equipments: [{ id: 'eq-1' }],
    servicesList: [{ id: 'sv-1' }],
    mealsList: [{ id: 'ml-1' }],
    securities: [{ id: 'sc-1' }],
    includedServices: [],
    extras: [],
    highlights: [],
    hotel: [],
    rules: null,
    nearbyPlaces: [],
    transportOptions: [],
    propertyInfo: null,
    options: [],
    typeRoom: null,
    owner: { id: 'user-1' },
  }

  describe('createDraftProduct', () => {
    it('clones the product as a draft and flags the original ModificationPending', async () => {
      prismaMock.product.findUnique.mockResolvedValue(originalProduct)
      prismaMock.product.create.mockResolvedValue({ id: 'draft-1', isDraft: true })

      const draft = await createDraftProduct('orig-1')

      const createArg = prismaMock.product.create.mock.calls[0][0]
      expect(createArg.data.isDraft).toBe(true)
      expect(createArg.data.originalProductId).toBe('orig-1')
      expect(createArg.data.validate).toBe(ProductValidation.NotVerified)
      // Original moved to ModificationPending.
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'orig-1' },
        data: { validate: ProductValidation.ModificationPending },
      })
      expect(draft).toEqual({ id: 'draft-1', isDraft: true })
    })

    it('throws when the original product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null)
      await expect(createDraftProduct('missing')).rejects.toThrow('Product not found')
    })
  })

  describe('applyDraftChanges', () => {
    it('copies draft data back onto the original then deletes the draft', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        ...originalProduct,
        id: 'draft-1',
        isDraft: true,
        originalProductId: 'orig-1',
      })
      prismaMock.product.update.mockResolvedValue({ id: 'orig-1', validate: 'Approve' })
      prismaMock.product.delete.mockResolvedValue({})

      const result = await applyDraftChanges('draft-1')

      const updateArg = prismaMock.product.update.mock.calls[0][0]
      expect(updateArg.where).toEqual({ id: 'orig-1' })
      expect(updateArg.data.validate).toBe(ProductValidation.Approve)
      expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 'draft-1' } })
      expect(invalidateProductCache).toHaveBeenCalledWith('orig-1')
      expect(result).toEqual({ id: 'orig-1', validate: 'Approve' })
    })

    it('throws when the draft is missing or has no originalProductId', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null)
      await expect(applyDraftChanges('draft-x')).rejects.toThrow('Draft product not found')
    })
  })

  describe('rejectDraftChanges', () => {
    it('restores the original to Approve, emails the host, and deletes the draft', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'draft-1',
        isDraft: true,
        originalProductId: 'orig-1',
        name: 'Draft',
        owner: { email: 'host@test.com', name: 'Host' },
      })
      prismaMock.product.update.mockResolvedValue({})
      prismaMock.product.delete.mockResolvedValue({})

      await rejectDraftChanges('draft-1', 'Not compliant')

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'orig-1' },
        data: { validate: ProductValidation.Approve },
      })
      expect(sendTemplatedMail).toHaveBeenCalledWith(
        'host@test.com',
        expect.any(String),
        'modification-rejected.html',
        expect.objectContaining({ reason: 'Not compliant' })
      )
      expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 'draft-1' } })
    })

    it('throws when the draft is not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null)
      await expect(rejectDraftChanges('x', 'reason')).rejects.toThrow('Draft product not found')
    })
  })

  describe('hasPendingDraft / getDraftProduct', () => {
    it('reports true when a draft exists', async () => {
      prismaMock.product.findFirst.mockResolvedValue({ id: 'draft-1' })
      await expect(hasPendingDraft('orig-1')).resolves.toBe(true)
    })

    it('reports false when no draft exists', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null)
      await expect(hasPendingDraft('orig-1')).resolves.toBe(false)
    })

    it('returns the pending draft product', async () => {
      prismaMock.product.findFirst.mockResolvedValue({ id: 'draft-1', isDraft: true })
      await expect(getDraftProduct('orig-1')).resolves.toEqual({ id: 'draft-1', isDraft: true })
    })
  })
})

// ===========================================================================
// Paginated host / public listings
// ===========================================================================
describe('findAllProductByHostIdPaginated', () => {
  it('scopes to the host, excludes drafts, and returns pagination metadata', async () => {
    prismaMock.product.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }])
    prismaMock.product.count.mockResolvedValue(2)

    const result = await findAllProductByHostIdPaginated('host-1', { page: 1, limit: 20 })

    const findArg = prismaMock.product.findMany.mock.calls[0][0]
    expect(findArg.where).toEqual({ ownerId: 'host-1', isDraft: false })
    expect(result?.products).toHaveLength(2)
    expect(result?.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('computes hasNext/hasPrev across pages', async () => {
    prismaMock.product.findMany.mockResolvedValue([{ id: 'p3' }])
    prismaMock.product.count.mockResolvedValue(45)

    const result = await findAllProductByHostIdPaginated('host-1', { page: 2, limit: 20 })

    expect(result?.pagination).toMatchObject({
      page: 2,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it('returns null when the query throws', async () => {
    prismaMock.product.findMany.mockRejectedValue(new Error('boom'))
    await expect(findAllProductByHostIdPaginated('host-1')).resolves.toBeNull()
  })
})

describe('findAllProductsPaginated', () => {
  it('only returns Approve / ModificationPending non-draft products', async () => {
    prismaMock.product.findMany.mockResolvedValue([{ id: 'p1' }])
    prismaMock.product.count.mockResolvedValue(1)

    await findAllProductsPaginated({ page: 1, limit: 10 })

    const findArg = prismaMock.product.findMany.mock.calls[0][0]
    expect(findArg.where).toEqual({
      validate: {
        in: [ProductValidation.Approve, ProductValidation.ModificationPending],
      },
      isDraft: false,
    })
  })

  it('returns null on error', async () => {
    prismaMock.product.findMany.mockRejectedValue(new Error('down'))
    await expect(findAllProductsPaginated()).resolves.toBeNull()
  })
})
