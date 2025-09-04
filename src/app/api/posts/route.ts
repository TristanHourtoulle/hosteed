import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPost, getPostsByAuthor, createPost } from '@/lib/services/post.service'

// GET /api/posts - Get all posts or user's posts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')

    let posts

    if (authorId) {
      // Get posts by specific author (for BLOGWRITER dashboard)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }

      // Verify authorization: users can only see their own posts unless they're admin
      if (session.user.id !== authorId && session.user.roles !== 'ADMIN') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }

      posts = await getPostsByAuthor(authorId)
    } else {
      // Get all posts (public access)
      posts = await getPost()
    }

    if (!posts) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des articles' }, { status: 500 })
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Verify user can create posts (BLOGWRITER or ADMIN)
    if (!['ADMIN', 'BLOGWRITER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, image, seoData } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Le titre et le contenu sont requis' }, { status: 400 })
    }

    const post = await createPost(title, content, image, session.user.id, seoData)

    if (!post) {
      return NextResponse.json({ error: 'Erreur lors de la création de l\'article' }, { status: 500 })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}