import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createProduct } from '@/lib/services/product.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('=== API Debug Route Called ===')
    console.log('User ID:', session.user.id)

    const body = await request.json()
    console.log('Request Body:', JSON.stringify(body, null, 2))

    // Validation basique
    const requiredFields = ['name', 'description', 'address', 'typeId', 'basePrice', 'priceMGA']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields)
      return NextResponse.json(
        {
          error: `Champs manquants: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Tenter de créer le produit
    const result = await createProduct(body)

    if (!result) {
      throw new Error('Création du produit échouée - résultat null')
    }

    console.log('Product created successfully:', result.id)

    return NextResponse.json({
      success: true,
      productId: result.id,
      message: 'Produit créé avec succès',
    })
  } catch (error) {
    console.error('=== API Error ===')

    const err = error as Error
    console.error('Error type:', err.constructor.name)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack)

    return NextResponse.json(
      {
        error: err.message || 'Erreur lors de la création du produit',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
