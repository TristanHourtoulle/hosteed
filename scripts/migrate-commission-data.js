#!/usr/bin/env node

/**
 * Migration Script: Populate Commission Table
 *
 * This script creates Commission records for each TypeRent based on the
 * existing CommissionSettings data. Each property type will get a
 * commission configuration with the same rates as the global settings.
 *
 * This is a one-time migration to transition from the global commission
 * system to the per-property-type commission system.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateCommissionData() {
  console.log('🚀 Starting commission data migration...\n')

  try {
    // 1. Get the current global commission settings
    const globalSettings = await prisma.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!globalSettings) {
      console.log('⚠️  No active CommissionSettings found.')
      console.log('   Creating default commission settings (0% / 0€)...')
    }

    const {
      hostCommissionRate = 0.0,
      hostCommissionFixed = 0.0,
      clientCommissionRate = 0.0,
      clientCommissionFixed = 0.0,
      createdBy = null,
    } = globalSettings || {}

    console.log('📊 Global Commission Settings:')
    console.log(`   Host: ${hostCommissionRate}% + ${hostCommissionFixed}€`)
    console.log(`   Client: ${clientCommissionRate}% + ${clientCommissionFixed}€`)
    console.log('')

    // 2. Get all property types
    const propertyTypes = await prisma.typeRent.findMany({
      include: {
        commission: true, // Check if commission already exists
      },
    })

    console.log(`📁 Found ${propertyTypes.length} property types\n`)

    let createdCount = 0
    let skippedCount = 0

    // 3. Create Commission record for each property type
    for (const propertyType of propertyTypes) {
      // Skip if commission already exists for this type
      if (propertyType.commission) {
        console.log(`⏭️  Skipping "${propertyType.name}" (commission already exists)`)
        skippedCount++
        continue
      }

      // Create commission for this property type
      const commission = await prisma.commission.create({
        data: {
          title: `Commission ${propertyType.name}`,
          description: `Commission appliquée aux ${propertyType.name.toLowerCase()}`,
          hostCommissionRate,
          hostCommissionFixed,
          clientCommissionRate,
          clientCommissionFixed,
          typeRentId: propertyType.id,
          isActive: true,
          createdBy,
        },
      })

      console.log(`✅ Created commission for "${propertyType.name}"`)
      console.log(`   ID: ${commission.id}`)
      console.log(`   Host: ${commission.hostCommissionRate}% + ${commission.hostCommissionFixed}€`)
      console.log(
        `   Client: ${commission.clientCommissionRate}% + ${commission.clientCommissionFixed}€`
      )
      console.log('')

      createdCount++
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Created: ${createdCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   📁 Total types: ${propertyTypes.length}`)
    console.log('')

    if (createdCount > 0) {
      console.log('✨ Migration completed successfully!')
      console.log('')
      console.log('ℹ️  Note: The old CommissionSettings table is still active.')
      console.log('   It will remain for backward compatibility but should')
      console.log('   no longer be used for new bookings.')
    } else {
      console.log('✨ No new commissions created (all types already have commissions)')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCommissionData()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Migration script failed:', error)
    process.exit(1)
  })
