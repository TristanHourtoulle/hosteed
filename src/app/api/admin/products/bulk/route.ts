import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { deleteMultipleProducts } from '@/lib/services/product.service'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Au moins un identifiant requis'),
})

/**
 * DELETE /api/admin/products/bulk
 * Bulk delete products. Skips products with active reservations and reports them as blocked.
 * Body: { ids: string[] }
 * Requires ADMIN or HOST_MANAGER role.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bulkDeleteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await deleteMultipleProducts(parsed.data.ids)

    return NextResponse.json({
      deletedCount: result.deletedCount,
      blockedProducts: result.blockedProducts,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
