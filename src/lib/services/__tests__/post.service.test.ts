/**
 * post.service is the blog CRUD layer. It instantiates its own PrismaClient
 * (via `new PrismaClient()`), so the mock targets the `@prisma/client` module
 * itself. The behaviours worth pinning down: slug generation from the title
 * (accent/special-char stripping), slug de-duplication against existing posts,
 * SEO metadata fallbacks, ownership checks on update/delete, and the
 * role-based `canUserEditPost` matrix.
 */

const postMock = {
  findFirst: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({ post: postMock })),
}))

import {
  createPost,
  getPost,
  getPostById,
  getPostBySlug,
  getPostBySlugOrId,
  getSuggestedPosts,
  getPostsByAuthor,
  updatePost,
  deletePost,
  canUserEditPost,
} from '../post.service'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('createPost — slug generation', () => {
  it('slugifies the title (lowercase, accent + special-char stripped) when no slug is given', async () => {
    postMock.findFirst.mockResolvedValue(null)
    postMock.create.mockImplementation(({ data }) => Promise.resolve({ id: 'post1', ...data }))

    await createPost('Héllo, Wörld!', 'body', 'img', 'author1')

    expect(postMock.create.mock.calls[0][0].data.slug).toBe('hello-world')
  })

  it('honours an explicit slug from seoData', async () => {
    postMock.findFirst.mockResolvedValue(null)
    postMock.create.mockImplementation(({ data }) => Promise.resolve({ id: 'post1', ...data }))

    await createPost('Any Title', 'body', 'img', 'author1', { slug: 'custom-slug' })

    expect(postMock.create.mock.calls[0][0].data.slug).toBe('custom-slug')
  })

  it('appends a counter to de-duplicate an already-used slug', async () => {
    postMock.findFirst
      .mockResolvedValueOnce({ id: 'existing' }) // base slug taken
      .mockResolvedValueOnce(null) // "-1" is free
    postMock.create.mockImplementation(({ data }) => Promise.resolve({ id: 'post1', ...data }))

    await createPost('Hello World', 'body', 'img', 'author1')

    expect(postMock.create.mock.calls[0][0].data.slug).toBe('hello-world-1')
  })

  it('derives metaTitle/metaDescription fallbacks from the title and content', async () => {
    postMock.findFirst.mockResolvedValue(null)
    postMock.create.mockImplementation(({ data }) => Promise.resolve({ id: 'post1', ...data }))
    const longBody = 'x'.repeat(300)

    await createPost('My Title', longBody, 'img', 'author1')

    const data = postMock.create.mock.calls[0][0].data
    expect(data.metaTitle).toBe('My Title')
    expect(data.metaDescription).toBe(longBody.substring(0, 160))
    expect(data.keywords).toBe('')
  })

  it('returns null when prisma create throws', async () => {
    postMock.findFirst.mockResolvedValue(null)
    postMock.create.mockRejectedValue(new Error('db down'))

    expect(await createPost('T', 'c', 'i', 'a')).toBeNull()
  })
})

describe('getPost — pagination', () => {
  it('computes pagination metadata from total and page/limit', async () => {
    postMock.findMany.mockResolvedValue([{ id: 'p1' }])
    postMock.count.mockResolvedValue(25)

    const result = await getPost({ page: 2, limit: 10 })

    expect(result?.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
    // skip = (page - 1) * limit
    expect(postMock.findMany.mock.calls[0][0].skip).toBe(10)
  })

  it('defaults to page 1 / limit 12 when no options are given', async () => {
    postMock.findMany.mockResolvedValue([])
    postMock.count.mockResolvedValue(0)

    const result = await getPost()

    expect(result?.pagination.page).toBe(1)
    expect(result?.pagination.limit).toBe(12)
    expect(result?.pagination.hasPrev).toBe(false)
  })

  it('returns null when prisma throws', async () => {
    postMock.findMany.mockRejectedValue(new Error('db down'))
    expect(await getPost()).toBeNull()
  })
})

describe('single-post getters', () => {
  it('getPostById returns the post', async () => {
    postMock.findUnique.mockResolvedValue({ id: 'p1' })
    expect(await getPostById('p1')).toEqual({ id: 'p1' })
  })

  it('getPostBySlug returns null on error', async () => {
    postMock.findUnique.mockRejectedValue(new Error('db down'))
    expect(await getPostBySlug('some-slug')).toBeNull()
  })

  it('getPostBySlugOrId falls back to lookup-by-id when slug lookup misses', async () => {
    postMock.findUnique
      .mockResolvedValueOnce(null) // by slug: miss
      .mockResolvedValueOnce({ id: 'p1' }) // by id: hit

    const result = await getPostBySlugOrId('p1')

    expect(result).toEqual({ id: 'p1' })
    expect(postMock.findUnique).toHaveBeenCalledTimes(2)
  })

  it('getPostBySlugOrId does not query by id when the slug already matches', async () => {
    postMock.findUnique.mockResolvedValueOnce({ id: 'p1', slug: 'hit' })

    await getPostBySlugOrId('hit')

    expect(postMock.findUnique).toHaveBeenCalledTimes(1)
  })
})

describe('getSuggestedPosts', () => {
  it('excludes the current post and applies the limit', async () => {
    postMock.findMany.mockResolvedValue([{ id: 'other' }])

    await getSuggestedPosts('current', 5)

    const arg = postMock.findMany.mock.calls[0][0]
    expect(arg.where.id.not).toBe('current')
    expect(arg.take).toBe(5)
  })
})

describe('getPostsByAuthor', () => {
  it('filters posts by authorId', async () => {
    postMock.findMany.mockResolvedValue([{ id: 'p1', authorId: 'a1' }])

    await getPostsByAuthor('a1')

    expect(postMock.findMany.mock.calls[0][0].where.authorId).toBe('a1')
  })

  it('returns null on error', async () => {
    postMock.findMany.mockRejectedValue(new Error('db down'))
    expect(await getPostsByAuthor('a1')).toBeNull()
  })
})

describe('updatePost — ownership + slug', () => {
  it('rejects when the caller is not the author', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'owner' })

    await expect(updatePost('p1', 'T', 'c', 'i', 'someone-else')).rejects.toThrow(/Unauthorized/)
    expect(postMock.update).not.toHaveBeenCalled()
  })

  it('throws when the post does not exist', async () => {
    postMock.findUnique.mockResolvedValue(null)

    await expect(updatePost('p1', 'T', 'c', 'i', 'author')).rejects.toThrow(/not found/)
  })

  it('de-duplicates the slug excluding the current post id', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'author' })
    postMock.findFirst
      .mockResolvedValueOnce({ id: 'other' })
      .mockResolvedValueOnce(null)
    postMock.update.mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data }))

    await updatePost('p1', 'Hello World', 'c', 'i', 'author')

    // slug conflict query must exclude the post being edited
    expect(postMock.findFirst.mock.calls[0][0].where.id).toEqual({ not: 'p1' })
    expect(postMock.update.mock.calls[0][0].data.slug).toBe('hello-world-1')
  })
})

describe('deletePost — ownership', () => {
  it('deletes and returns a success message for the owner', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'author', title: 'My Post' })
    postMock.delete.mockResolvedValue({ id: 'p1' })

    const result = await deletePost('p1', 'author')

    expect(result).toEqual({ success: true, message: 'Post "My Post" deleted successfully' })
  })

  it('rejects a non-owner without deleting', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'author', title: 'My Post' })

    await expect(deletePost('p1', 'intruder')).rejects.toThrow(/Unauthorized/)
    expect(postMock.delete).not.toHaveBeenCalled()
  })

  it('throws when the post does not exist', async () => {
    postMock.findUnique.mockResolvedValue(null)
    await expect(deletePost('p1', 'author')).rejects.toThrow(/not found/)
  })
})

describe('canUserEditPost — permission matrix', () => {
  it('lets an ADMIN edit any post without a DB lookup', async () => {
    expect(await canUserEditPost('p1', 'u1', 'ADMIN')).toBe(true)
    expect(postMock.findUnique).not.toHaveBeenCalled()
  })

  it('lets a BLOGWRITER edit their own post', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'u1' })
    expect(await canUserEditPost('p1', 'u1', 'BLOGWRITER')).toBe(true)
  })

  it('forbids a BLOGWRITER from editing someone else’s post', async () => {
    postMock.findUnique.mockResolvedValue({ authorId: 'other' })
    expect(await canUserEditPost('p1', 'u1', 'BLOGWRITER')).toBe(false)
  })

  it('forbids any other role', async () => {
    expect(await canUserEditPost('p1', 'u1', 'USER')).toBe(false)
  })

  it('returns false when the permission lookup throws', async () => {
    postMock.findUnique.mockRejectedValue(new Error('db down'))
    expect(await canUserEditPost('p1', 'u1', 'BLOGWRITER')).toBe(false)
  })
})
