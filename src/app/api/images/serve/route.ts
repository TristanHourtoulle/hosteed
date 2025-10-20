import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/images/serve?url=/uploads/products/xxx/img_0_thumb_123_abc.webp&size=full
 * Sert l'image dans la taille demandée en trouvant le bon fichier
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')
    const size = searchParams.get('size') || 'full' // full, medium, thumb

    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'URL image invalide' }, { status: 400 })
    }

    // Extraire les infos de l'URL
    const parts = imageUrl.split('/')
    const fileName = parts[parts.length - 1]
    const productId = parts[parts.length - 2]

    // Extraire le numéro d'image et le timestamp
    const match = fileName.match(/img_(\d+)_(thumb|medium|full)_(\d+)_/)
    if (!match) {
      return NextResponse.json({ error: 'Format de nom de fichier invalide' }, { status: 400 })
    }

    const imgNumber = match[1]
    const timestamp = match[3]

    // Construire le chemin du dossier
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId)

    // Vérifier que le dossier existe
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ error: 'Dossier produit non trouvé' }, { status: 404 })
    }

    // Lister les fichiers et trouver celui de la bonne taille
    const files = fs.readdirSync(uploadsDir)
    const pattern = `img_${imgNumber}_${size}_${timestamp}_`
    const targetFile = files.find(f => f.startsWith(pattern))

    if (!targetFile) {
      // Fallback: si pas de full, essayer medium, puis thumb
      if (size === 'full') {
        const mediumPattern = `img_${imgNumber}_medium_${timestamp}_`
        const mediumFile = files.find(f => f.startsWith(mediumPattern))
        if (mediumFile) {
          const mediumPath = path.join(uploadsDir, mediumFile)
          const imageBuffer = fs.readFileSync(mediumPath)
          return new NextResponse(new Uint8Array(imageBuffer), {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
      }

      // Dernier fallback: retourner le thumb
      const thumbPattern = `img_${imgNumber}_thumb_${timestamp}_`
      const thumbFile = files.find(f => f.startsWith(thumbPattern))
      if (thumbFile) {
        const thumbPath = path.join(uploadsDir, thumbFile)
        const imageBuffer = fs.readFileSync(thumbPath)
        return new NextResponse(new Uint8Array(imageBuffer), {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }

      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 })
    }

    // Lire et servir le fichier
    const imagePath = path.join(uploadsDir, targetFile)
    const imageBuffer = fs.readFileSync(imagePath)

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error("Erreur lors du service de l'image:", error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
