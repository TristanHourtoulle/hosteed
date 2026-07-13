import { BedType, DayEnum, Prisma } from '@prisma/client'

/**
 * Room-type service (hotel multi-room-type — Lot 1 / TRI-994).
 *
 * Owns the transactional synchronisation of a Product's room types and their
 * nested beds / special prices / per-type catalog links. Consumed by
 * `product.service.ts` (create/update) and, in later lots, by the host wizard
 * and admin editor.
 */

export interface CreateRoomTypeBedInput {
  bedType: BedType
  count: number
}

export interface CreateRoomTypeSpecialPriceInput {
  pricesMga: string
  pricesEuro: string
  day: DayEnum[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
}

/**
 * Input shape for creating or updating a single room type.
 * `id` is present only when editing an existing room type; absent → create.
 */
export interface CreateRoomTypeInput {
  id?: string
  name: string
  quantity: number
  capacity: number
  surface?: number | null
  smoking?: boolean
  basePrice: string
  priceMGA: string
  position?: number
  beds?: CreateRoomTypeBedInput[]
  specialPrices?: CreateRoomTypeSpecialPriceInput[]
  mealIds?: string[]
  includedServiceIds?: string[]
  serviceIds?: string[]
  extraIds?: string[]
}

type ExistingRoomType = {
  id: string
  _count: { rentLines: number }
}

function scalarData(roomType: CreateRoomTypeInput, index: number) {
  return {
    name: roomType.name,
    quantity: roomType.quantity,
    capacity: roomType.capacity,
    surface: roomType.surface ?? null,
    smoking: roomType.smoking ?? false,
    basePrice: roomType.basePrice,
    priceMGA: roomType.priceMGA,
    position: roomType.position ?? index,
  }
}

function bedCreateData(roomType: CreateRoomTypeInput) {
  return (roomType.beds ?? []).map(bed => ({ bedType: bed.bedType, count: bed.count }))
}

function specialPriceCreateData(roomType: CreateRoomTypeInput) {
  return (roomType.specialPrices ?? []).map(sp => ({
    pricesMga: sp.pricesMga,
    pricesEuro: sp.pricesEuro,
    day: sp.day,
    startDate: sp.startDate,
    endDate: sp.endDate,
    activate: sp.activate,
  }))
}

function connectData(ids: string[] | undefined) {
  return (ids ?? []).map(id => ({ id }))
}

/**
 * Transactionally reconcile the room types attached to `productId` with the
 * provided list:
 * - room types with a known `id` are updated (beds, special prices and catalog
 *   links are fully replaced);
 * - room types without an `id` are created;
 * - existing room types absent from the list are deleted, unless they carry
 *   booking history (`rentLines` > 0), in which case an error is thrown so the
 *   caller can surface a soft-block (RentRoomType uses onDelete Restrict).
 *
 * Must run inside a Prisma transaction; the caller passes the transaction client.
 */
export async function syncRoomTypes(
  tx: Prisma.TransactionClient,
  productId: string,
  roomTypes: CreateRoomTypeInput[]
): Promise<void> {
  const existing: ExistingRoomType[] = await tx.roomType.findMany({
    where: { productId },
    select: { id: true, _count: { select: { rentLines: true } } },
  })

  const incomingIds = new Set(
    roomTypes.map(roomType => roomType.id).filter((id): id is string => Boolean(id))
  )
  const existingIds = new Set(existing.map(roomType => roomType.id))

  // Delete room types that are no longer present (guarding booking history).
  for (const current of existing) {
    if (incomingIds.has(current.id)) continue
    if (current._count.rentLines > 0) {
      throw new Error(
        `Cannot delete room type ${current.id}: it has existing bookings (RentRoomType).`
      )
    }
    await tx.roomType.delete({ where: { id: current.id } })
  }

  // Create or update.
  for (let index = 0; index < roomTypes.length; index++) {
    const roomType = roomTypes[index]
    const isExisting = roomType.id !== undefined && existingIds.has(roomType.id)

    if (isExisting && roomType.id) {
      await tx.roomType.update({
        where: { id: roomType.id },
        data: {
          ...scalarData(roomType, index),
          beds: { deleteMany: {}, create: bedCreateData(roomType) },
          specialPrices: { deleteMany: {}, create: specialPriceCreateData(roomType) },
          mealsList: { set: [], connect: connectData(roomType.mealIds) },
          includedServices: { set: [], connect: connectData(roomType.includedServiceIds) },
          servicesList: { set: [], connect: connectData(roomType.serviceIds) },
          extras: { set: [], connect: connectData(roomType.extraIds) },
        },
      })
    } else {
      await tx.roomType.create({
        data: {
          productId,
          ...scalarData(roomType, index),
          beds: { create: bedCreateData(roomType) },
          specialPrices: { create: specialPriceCreateData(roomType) },
          mealsList: { connect: connectData(roomType.mealIds) },
          includedServices: { connect: connectData(roomType.includedServiceIds) },
          servicesList: { connect: connectData(roomType.serviceIds) },
          extras: { connect: connectData(roomType.extraIds) },
        },
      })
    }
  }
}
