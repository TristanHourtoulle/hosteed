import { BedType, DayEnum, Prisma } from '@prisma/client'
import { assertPhotoBudget } from '@/lib/photos/photoBudget'

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
  /**
   * Full-size photo URLs for this room type, in display order. Reconciled by
   * URL, so an untouched URL keeps its row. `undefined` means "leave this room
   * type's photos alone" — callers that don't manage photos stay unaffected.
   */
  imageUrls?: string[]
}

type ExistingRoomTypeImage = {
  id: string
  img: string
  position: number
}

type ExistingRoomType = {
  id: string
  name: string
  _count: { rentLines: number }
  images: ExistingRoomTypeImage[]
}

/**
 * Thrown when a room type slated for deletion still has booking history
 * (`RentRoomType` uses `onDelete: Restrict`). Carries the human-readable room
 * type names so callers (admin edit PUT) can surface a clear soft-block message
 * instead of crashing. The message keeps the word "booking" for stable matching.
 */
export class RoomTypeDeletionBlockedError extends Error {
  readonly roomTypeNames: string[]

  constructor(roomTypeNames: string[]) {
    const list = roomTypeNames.join(', ')
    super(
      `Cannot delete room type(s) with existing bookings (RentRoomType): ${list}`
    )
    this.name = 'RoomTypeDeletionBlockedError'
    this.roomTypeNames = roomTypeNames
  }
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

function imageCreateData(roomType: CreateRoomTypeInput) {
  return (roomType.imageUrls ?? []).map((img, index) => ({ img, position: index }))
}

/**
 * Photos this room type will hold once the sync is applied: the incoming list
 * when photos are managed, the rows already stored otherwise.
 */
function projectedImageCount(
  roomType: CreateRoomTypeInput,
  existingById: Map<string, ExistingRoomType>
): number {
  if (roomType.imageUrls !== undefined) {
    return roomType.imageUrls.length
  }

  return roomType.id ? (existingById.get(roomType.id)?.images.length ?? 0) : 0
}

/**
 * Reconcile an existing room type's photos with `imageUrls`, matching by URL so
 * an untouched photo keeps its row (and its id): rows whose URL disappeared are
 * deleted, unknown URLs are created at their index, and surviving rows are
 * repositioned only when their index actually moved.
 */
async function syncRoomTypeImages(
  tx: Prisma.TransactionClient,
  roomTypeId: string,
  existingImages: ExistingRoomTypeImage[],
  imageUrls: string[]
): Promise<void> {
  const staleIds = existingImages.filter(image => !imageUrls.includes(image.img)).map(i => i.id)
  if (staleIds.length > 0) {
    await tx.roomTypeImage.deleteMany({ where: { id: { in: staleIds } } })
  }

  for (let index = 0; index < imageUrls.length; index++) {
    const url = imageUrls[index]
    const existingImage = existingImages.find(image => image.img === url)

    if (!existingImage) {
      await tx.roomTypeImage.create({ data: { roomTypeId, img: url, position: index } })
    } else if (existingImage.position !== index) {
      await tx.roomTypeImage.update({ where: { id: existingImage.id }, data: { position: index } })
    }
  }
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
    select: {
      id: true,
      name: true,
      _count: { select: { rentLines: true } },
      images: { select: { id: true, img: true, position: true } },
    },
  })

  const incomingIds = new Set(
    roomTypes.map(roomType => roomType.id).filter((id): id is string => Boolean(id))
  )
  const existingIds = new Set(existing.map(roomType => roomType.id))

  // Determine which existing room types are being removed, then soft-block the
  // whole operation up-front if any of them carry booking history (so no
  // partial delete happens before we detect the conflict).
  const toDelete = existing.filter(current => !incomingIds.has(current.id))
  const blocked = toDelete.filter(current => current._count.rentLines > 0)
  if (blocked.length > 0) {
    throw new RoomTypeDeletionBlockedError(blocked.map(rt => rt.name))
  }

  // The 20-photo cap is global to the listing, so it is checked against the
  // *projected* state (establishment photos + every surviving room type) before
  // any write — an over-budget request must leave the listing untouched.
  // Room types being removed are excluded: their photos go away with them.
  const existingById = new Map(existing.map(current => [current.id, current]))
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { _count: { select: { img: true } } },
  })

  assertPhotoBudget({
    establishmentCount: product?._count.img ?? 0,
    roomTypeCounts: roomTypes.map(roomType => projectedImageCount(roomType, existingById)),
  })

  for (const current of toDelete) {
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

      if (roomType.imageUrls !== undefined) {
        await syncRoomTypeImages(
          tx,
          roomType.id,
          existingById.get(roomType.id)?.images ?? [],
          roomType.imageUrls
        )
      }
    } else {
      await tx.roomType.create({
        data: {
          productId,
          ...scalarData(roomType, index),
          beds: { create: bedCreateData(roomType) },
          images: { create: imageCreateData(roomType) },
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
