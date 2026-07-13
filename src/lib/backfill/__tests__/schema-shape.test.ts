import { PrismaClient, BedType } from '@prisma/client'

/**
 * Guards that the multi-room-type schema was added AND `prisma generate` ran:
 * the generated client must expose the new delegates and the `BedType` enum.
 * No DB connection is opened (we never call a query).
 */
describe('room-type schema shape', () => {
  it('exposes the new room-type delegates and BedType enum', () => {
    const client = new PrismaClient()

    expect(client.roomType).toBeDefined()
    expect(client.roomTypeBed).toBeDefined()
    expect(client.roomTypeSpecialPrice).toBeDefined()
    expect(client.roomTypeBlockedDate).toBeDefined()
    expect(client.rentRoomType).toBeDefined()

    expect(BedType.SIMPLE).toBe('SIMPLE')
    expect(BedType.DOUBLE).toBe('DOUBLE')
    expect(BedType.KING).toBe('KING')
    expect(BedType.GRAND_KING).toBe('GRAND_KING')
  })
})
