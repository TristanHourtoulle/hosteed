/**
 * Typed Jest mock of the default Prisma export used across service unit tests.
 * Mocks only at the DB boundary — the same shape backs both the top-level
 * `prisma` mock and a transaction client (`tx`) passed to guard helpers.
 */
export type JestPrisma = {
  product: { findUnique: jest.Mock; findFirst: jest.Mock }
  roomType: { findUnique: jest.Mock; findMany: jest.Mock }
  rentRoomType: {
    aggregate: jest.Mock
    count: jest.Mock
    findMany: jest.Mock
    createMany: jest.Mock
  }
  roomTypeBlockedDate: {
    findFirst: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    delete: jest.Mock
  }
  roomTypeSpecialPrice: { findMany: jest.Mock }
  productPromotion: { findFirst: jest.Mock; findMany: jest.Mock }
  rent: { findFirst: jest.Mock; findMany: jest.Mock; count: jest.Mock; create: jest.Mock }
  rentExtra: { create: jest.Mock }
  unAvailableProduct: { findFirst: jest.Mock }
  hostPricingSettings: { findUnique: jest.Mock; create: jest.Mock }
  user: { findUnique: jest.Mock }
  $transaction: jest.Mock
}

export function makePrismaMock(): JestPrisma {
  return {
    product: { findUnique: jest.fn(), findFirst: jest.fn() },
    roomType: { findUnique: jest.fn(), findMany: jest.fn() },
    rentRoomType: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    roomTypeBlockedDate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    roomTypeSpecialPrice: { findMany: jest.fn() },
    productPromotion: { findFirst: jest.fn(), findMany: jest.fn() },
    rent: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    rentExtra: { create: jest.fn() },
    unAvailableProduct: { findFirst: jest.fn() },
    hostPricingSettings: { findUnique: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  }
}
