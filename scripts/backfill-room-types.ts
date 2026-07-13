#!/usr/bin/env tsx

/**
 * BACKFILL SCRIPT — Hotel multi-room-type (Lot 1 / TRI-994)
 *
 * For every existing hotel establishment (Product whose TypeRent.isHotelType is
 * true) that has no room types yet, create ONE default "Chambre standard"
 * RoomType from the legacy fields (availableRooms → quantity, maxPeople →
 * capacity, prices copied), then create one RentRoomType line (quantity 1,
 * unitPrice = Product.basePrice) for every historical Rent of that product that
 * has no line yet.
 *
 * Idempotent: re-running skips products that already have room types and rents
 * that already have lines. All writes for a product happen in one transaction.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-room-types.ts            # apply
 *   pnpm tsx scripts/backfill-room-types.ts --dry-run  # log planned actions only
 *
 * SAFETY: never run against production without an explicit, reviewed decision.
 */

import prisma from '../src/lib/prisma'
import {
  buildDefaultRoomTypeData,
  buildRentRoomTypeData,
  isBackfillEligible,
  type BackfillProductInput,
} from '../src/lib/backfill/room-types-backfill'

interface Summary {
  hotelsScanned: number
  productsProcessed: number
  roomTypesCreated: number
  rentLinesCreated: number
  productsSkipped: number
}

async function backfillRoomTypes(dryRun: boolean): Promise<Summary> {
  const summary: Summary = {
    hotelsScanned: 0,
    productsProcessed: 0,
    roomTypesCreated: 0,
    rentLinesCreated: 0,
    productsSkipped: 0,
  }

  const products = await prisma.product.findMany({
    where: { type: { isHotelType: true } },
    select: {
      id: true,
      availableRooms: true,
      maxPeople: true,
      surface: true,
      basePrice: true,
      priceMGA: true,
      type: { select: { isHotelType: true } },
      _count: { select: { roomTypes: true } },
    },
  })

  summary.hotelsScanned = products.length

  for (const product of products) {
    const input: BackfillProductInput = {
      id: product.id,
      isHotelType: product.type.isHotelType,
      availableRooms: product.availableRooms,
      maxPeople: product.maxPeople,
      surface: product.surface,
      basePrice: product.basePrice,
      priceMGA: product.priceMGA,
      existingRoomTypeCount: product._count.roomTypes,
    }

    if (!isBackfillEligible(input)) {
      summary.productsSkipped += 1
      continue
    }

    const roomTypeData = buildDefaultRoomTypeData(input)

    // Rents of this product that do not yet have a room-type line.
    const rents = await prisma.rent.findMany({
      where: { productId: product.id, roomTypeLines: { none: {} } },
      select: { id: true },
    })

    if (dryRun) {
      console.log(
        `[dry-run] Product ${product.id}: would create 1 RoomType ` +
          `(quantity=${roomTypeData.quantity}, capacity=${roomTypeData.capacity}) ` +
          `and ${rents.length} RentRoomType line(s).`
      )
      summary.productsProcessed += 1
      summary.roomTypesCreated += 1
      summary.rentLinesCreated += rents.length
      continue
    }

    await prisma.$transaction(async tx => {
      const roomType = await tx.roomType.create({ data: roomTypeData })

      for (const rent of rents) {
        await tx.rentRoomType.create({
          data: buildRentRoomTypeData(rent.id, roomType.id, product.basePrice),
        })
      }

      summary.roomTypesCreated += 1
      summary.rentLinesCreated += rents.length
    })

    summary.productsProcessed += 1
  }

  return summary
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  console.log(
    dryRun
      ? '🔎 Room-type backfill (DRY RUN — no writes)\n'
      : '🚀 Room-type backfill (applying changes)\n'
  )

  try {
    const summary = await backfillRoomTypes(dryRun)

    console.log('\n=== Summary ===')
    console.log(`Hotels scanned:       ${summary.hotelsScanned}`)
    console.log(`Products processed:   ${summary.productsProcessed}`)
    console.log(`Room types created:   ${summary.roomTypesCreated}`)
    console.log(`Rent lines created:   ${summary.rentLinesCreated}`)
    console.log(`Products skipped:     ${summary.productsSkipped}`)

    if (dryRun) {
      console.log('\nℹ️  Dry run only — nothing was written.')
    } else {
      console.log(
        `\n✅ Created ${summary.roomTypesCreated} room types, ${summary.rentLinesCreated} rent lines.`
      )
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
