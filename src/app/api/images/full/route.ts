import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/images/full?thumb=/uploads/products/xxx/img_0_thumb_123_abc.webp
 * Convertit une URL thumbnail vers l'URL full en trouvant le bon fichier
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const thumbUrl = searchParams.get('thumb')

    if (!thumbUrl || !thumbUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'URL thumbnail invalide' }, { status: 400 })
    }

    // Extraire les infos de l'URL thumb
    // Format: /uploads/products/PRODUCT_ID/img_X_thumb_TIMESTAMP_HASH.webp
    const parts = thumbUrl.split('/')
    const fileName = parts[parts.length - 1]
    const productId = parts[parts.length - 2]

    // Extraire le numéro d'image et le timestamp
    const match = fileName.match(/img_(\d+)_thumb_(\d+)_/)
    if (!match) {
      return NextResponse.json({ error: 'Format de nom de fichier invalide' }, { status: 400 })
    }

    const imgNumber = match[1]
    const timestamp = match[2]

    // Construire le chemin du dossier
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId)

    // Vérifier que le dossier existe
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ error: 'Dossier produit non trouvé' }, { status: 404 })
    }

    // Lister les fichiers et trouver le full correspondant
    const files = fs.readdirSync(uploadsDir)
    const fullPattern = `img_${imgNumber}_full_${timestamp}_`
    const fullFile = files.find(f => f.startsWith(fullPattern))

    if (!fullFile) {
      // Si pas de full, essayer medium
      const mediumPattern = `img_${imgNumber}_medium_${timestamp}_`
      const mediumFile = files.find(f => f.startsWith(mediumPattern))

      if (mediumFile) {
        return NextResponse.json({
          fullUrl: `/uploads/products/${productId}/${mediumFile}`,
        })
      }

      // Si rien, retourner le thumb
      return NextResponse.json({
        fullUrl: thumbUrl,
      })
    }

    return NextResponse.json({
      fullUrl: `/uploads/products/${productId}/${fullFile}`,
    })
  } catch (error) {
    console.error("Erreur lors de la résolution de l'image full:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
