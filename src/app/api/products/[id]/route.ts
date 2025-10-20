import { NextResponse } from 'next/server'
import { findProductById, updateProduct } from '@/lib/services/product.service'

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
 * Update an existing product
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

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
