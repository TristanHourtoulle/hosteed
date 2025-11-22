'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SEOData {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  slug?: string
}

export async function createPost(
  title: string,
  content: string,
  image: string,
  authorId: string,
  seoData?: SEOData
) {
  try {
    // Generate slug if not provided
    let slug = seoData?.slug
    if (!slug) {
      slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove multiple hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    }

    // Check if slug already exists and make it unique if needed
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.post.findFirst({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        image,
        authorId,
        metaTitle: seoData?.metaTitle || title,
        metaDescription: seoData?.metaDescription || content.substring(0, 160),
        keywords: seoData?.keywords || '',
        slug: uniqueSlug,
      },
    })
    return post
  } catch (error) {
    console.error('Error creating post:', error)
    return null
  }
}

export async function getPost(options?: { page?: number; limit?: number }) {
  try {
    const page = options?.page || 1
    const limit = options?.limit || 12 // Default 12 posts per page
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count(),
    ])

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  } catch (error) {
    console.error('Error getting posts:', error)
    return null
  }
}

export async function getPostById(id: string) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    })
    return post
  } catch (error) {
    console.error('Error getting post:', error)
    return null
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        slug: slug,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    })
    return post
  } catch (error) {
    console.error('Error getting post by slug:', error)
    return null
  }
}

export async function getPostBySlugOrId(slugOrId: string) {
  try {
    const includeAuthor = {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
        },
      },
    }

    // First, try to find by slug
    let post = await prisma.post.findUnique({
      where: {
        slug: slugOrId,
      },
      include: includeAuthor,
    })

    // If not found by slug, try to find by ID
    if (!post) {
      post = await prisma.post.findUnique({
        where: {
          id: slugOrId,
        },
        include: includeAuthor,
      })
    }

    return post
  } catch (error) {
    console.error('Error getting post by slug or ID:', error)
    return null
  }
}

export async function getSuggestedPosts(currentPostId: string, limit: number = 3) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        id: {
          not: currentPostId,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
    return posts
  } catch (error) {
    console.error('Error getting suggested posts:', error)
    return null
  }
}

// NEW FUNCTIONS FOR BLOGWRITER ROLE MANAGEMENT

export async function getPostsByAuthor(authorId: string) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return posts
  } catch (error) {
    console.error('Error getting posts by author:', error)
    return null
  }
}

export async function updatePost(
  id: string,
  title: string,
  content: string,
  image: string,
  authorId: string, // For ownership verification
  seoData?: SEOData
) {
  try {
    // First verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existingPost) {
      throw new Error('Post not found')
    }

    if (existingPost.authorId !== authorId) {
      throw new Error('Unauthorized: You can only edit your own posts')
    }

    // Generate slug if changed
    let slug = seoData?.slug
    if (!slug) {
      slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove multiple hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    }

    // Check if slug already exists (excluding current post)
    let uniqueSlug = slug
    let counter = 1
    while (
      await prisma.post.findFirst({
        where: {
          slug: uniqueSlug,
          id: { not: id },
        },
      })
    ) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        image,
        metaTitle: seoData?.metaTitle || title,
        metaDescription: seoData?.metaDescription || content.substring(0, 160),
        keywords: seoData?.keywords || '',
        slug: uniqueSlug,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    })
    return updatedPost
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

export async function deletePost(id: string, authorId: string) {
  try {
    // First verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, title: true },
    })

    if (!existingPost) {
      throw new Error('Post not found')
    }

    if (existingPost.authorId !== authorId) {
      throw new Error('Unauthorized: You can only delete your own posts')
    }

    await prisma.post.delete({
      where: { id },
    })

    return { success: true, message: `Post "${existingPost.title}" deleted successfully` }
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

export async function canUserEditPost(
  postId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    // Admin can edit any post
    if (userRole === 'ADMIN') {
      return true
    }

    // BLOGWRITER can only edit their own posts
    if (userRole === 'BLOGWRITER') {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      })
      return post?.authorId === userId
    }

    // Other roles cannot edit posts
    return false
  } catch (error) {
    console.error('Error checking post edit permissions:', error)
    return false
  }
}
