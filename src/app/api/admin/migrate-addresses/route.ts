import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseAddress } from '@/lib/services/location.service'

/**
 * GET /api/admin/migrate-addresses
 * Vérifie le statut de la migration des adresses
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const total = await prisma.product.count()
    const migrated = await prisma.product.count({
      where: {
        city: { not: null },
      },
    })
    const pending = total - migrated

    return NextResponse.json({
      status: 'ok',
      total,
      migrated,
      pending,
      percentage: total > 0 ? Math.round((migrated / total) * 100) : 100,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de migration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/migrate-addresses
 * Exécute la migration des adresses existantes vers les nouveaux champs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.roles !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true
    const limit = body.limit ? parseInt(body.limit, 10) : undefined

    console.log(`🚀 Démarrage de la migration des adresses (dryRun=${dryRun}, limit=${limit})`)

    // Récupérer les produits à migrer
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { city: null },
          { city: '' },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        neighborhood: true,
        city: true,
        region: true,
        country: true,
      },
      take: limit,
    })

    const result = {
      totalProducts: products.length,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      dryRun,
      details: [] as Array<{
        productId: string
        productName: string
        address: string
        parsed: {
          neighborhood: string | null
          city: string | null
          region: string | null
          country: string
        }
        status: 'migrated' | 'skipped' | 'error'
        error?: string
      }>,
    }

    for (const product of products) {
      try {
        if (!product.address || product.address.trim() === '') {
          result.skippedCount++
          result.details.push({
            productId: product.id,
            productName: product.name,
            address: product.address || '',
            parsed: { neighborhood: null, city: null, region: null, country: 'Madagascar' },
            status: 'skipped',
          })
          continue
        }

        // Parser l'adresse existante
        const parsed = parseAddress(product.address)

        const parsedData = {
          neighborhood: parsed.neighborhood || null,
          city: parsed.city || null,
          region: parsed.region || null,
          country: parsed.country || 'Madagascar',
        }

        if (!dryRun) {
          // Mettre à jour le produit avec les nouveaux champs
          await prisma.product.update({
            where: { id: product.id },
            data: parsedData,
          })
        }

        result.migratedCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          address: product.address,
          parsed: parsedData,
          status: 'migrated',
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        result.errorCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          address: product.address || '',
          parsed: { neighborhood: null, city: null, region: null, country: 'Madagascar' },
          status: 'error',
          error: errorMessage,
        })
      }
    }

    console.log(`✅ Migration terminée: ${result.migratedCount} migrés, ${result.skippedCount} ignorés, ${result.errorCount} erreurs`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la migration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la migration' },
      { status: 500 }
    )
  }
}
