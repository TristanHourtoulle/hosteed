import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPostById, updatePost, deletePost, canUserEditPost } from '@/lib/services/post.service'

// GET /api/posts/[id] - Get single post by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const post = await getPostById(resolvedParams.id)

    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in GET /api/posts/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user can edit this post
    const canEdit = await canUserEditPost(resolvedParams.id, session.user.id, session.user.roles)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Accès refusé - Vous ne pouvez modifier que vos propres articles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, image, seoData } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Le titre et le contenu sont requis' }, { status: 400 })
    }

    const updatedPost = await updatePost(
      resolvedParams.id,
      title,
      content,
      image,
      session.user.id,
      seoData
    )

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error in PUT /api/posts/[id]:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user can edit this post (same permission as editing)
    const canEdit = await canUserEditPost(resolvedParams.id, session.user.id, session.user.roles)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Accès refusé - Vous ne pouvez supprimer que vos propres articles' },
        { status: 403 }
      )
    }

    const result = await deletePost(resolvedParams.id, session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
