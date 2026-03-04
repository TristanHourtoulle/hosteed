import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteProduct } from '@/lib/services/product.service'

/**
 * DELETE /api/admin/products/[id]
 * Delete a single product. Returns 400 if product has active reservations.
 * Requires ADMIN or HOST_MANAGER role.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const resolvedParams = await params
    const result = await deleteProduct(resolvedParams.id)

    return NextResponse.json({ message: `Produit "${result.productName}" supprimé avec succès` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'

    if (message === 'Produit non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message === 'Impossible de supprimer un produit avec des réservations actives') {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
