import { NextResponse } from 'next/server'
import { findProductById, updateProduct } from '@/lib/services/product.service'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Convert BigInt values to numbers for JSON serialization
 */
function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as T
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt((obj as Record<string, unknown>)[key])
      }
    }
    return serialized as T
  }

  return obj
}

/**
 * GET /api/products/[id]
 * Retrieve a single product by ID
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const product = await findProductById(id)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Serialize BigInt values before returning
    const serializedProduct = serializeBigInt(product)

    return NextResponse.json(serializedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

/**
 * PUT /api/products/[id]
 * Update an existing product. Only the product owner, ADMIN or HOST_MANAGER can update.
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Verify ownership or elevated role before mutating
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isOwner = existing.ownerId === session.user.id
    const canManageAny = ['ADMIN', 'HOST_MANAGER'].includes(session.user.roles as string)
    if (!isOwner && !canManageAny) {
      console.warn(
        `[PUT /api/products/${id}] forbidden: user=${session.user.id} role=${session.user.roles} owner=${existing.ownerId}`
      )
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const data = await request.json()

    const updatedProduct = await updateProduct(id, data)

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Serialize BigInt values before returning
    const serializedProduct = serializeBigInt(updatedProduct)

    return NextResponse.json(serializedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
