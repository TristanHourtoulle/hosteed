'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SEOData {
  metaTitle: string
  metaDescription: string
  keywords: string
  slug: string
}

export async function createPost(
  title: string, 
  content: string, 
  image: string, 
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

export async function getPost() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return posts
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
    })
    return post
  } catch (error) {
    console.error('Error getting post by slug:', error)
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
