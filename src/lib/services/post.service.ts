'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createPost(title: string, content: string, image: string) {
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        image,
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
