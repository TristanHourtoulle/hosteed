import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * GET /api/images/[...path]
 *
 * Sert les images depuis le file system avec cache optimal
 * Fallback vers /public/uploads si l'image existe
 *
 * Cette route est optionnelle - les images dans /public sont déjà servies
 * par Next.js, mais cette route permet:
 * - Headers de cache personnalisés
 * - Analytics sur les images servies
 * - Redimensionnement à la volée si nécessaire
 */
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await context.params
    const imagePath = params.path.join('/')

    // Construire le chemin complet
    const fullPath = path.join(process.cwd(), 'public', 'uploads', imagePath)

    // Vérifier que le fichier existe
    try {
      await fs.access(fullPath)
    } catch {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Lire le fichier
    const imageBuffer = await fs.readFile(fullPath)

    // Déterminer le type MIME
    const extension = path.extname(imagePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }
    const contentType = mimeTypes[extension] || 'application/octet-stream'

    // Retourner l'image avec cache optimal
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 an
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const params = await context.params
    console.error(`Error serving image ${params.path.join('/')}:`, error)
    return new NextResponse('Error serving image', { status: 500 })
  }
}
