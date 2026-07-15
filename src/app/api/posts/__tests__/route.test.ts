/**
 * /api/posts collection route. The post service is mocked at the boundary.
 * Coverage: public list access, the authorId path (authn + ownership/admin
 * authorization), post creation role-gating (ADMIN/BLOGWRITER only), and body
 * validation. Node test env.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const getPostMock = jest.fn()
const getPostsByAuthorMock = jest.fn()
const createPostMock = jest.fn()
jest.mock('@/lib/services/post.service', () => ({
  getPost: (...a: unknown[]) => getPostMock(...a),
  getPostsByAuthor: (...a: unknown[]) => getPostsByAuthorMock(...a),
  createPost: (...a: unknown[]) => createPostMock(...a),
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

function getRequest(query = ''): NextRequest {
  return new NextRequest(`http://localhost/api/posts${query}`)
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/posts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('GET /api/posts (public list)', () => {
  it('returns the paginated list without requiring auth', async () => {
    authMock.mockResolvedValue(null)
    getPostMock.mockResolvedValue({ posts: [{ id: 'p1' }], pagination: {} })

    const res = await GET(getRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.posts).toHaveLength(1)
    expect(getPostMock).toHaveBeenCalled()
  })

  it('returns 500 when the service returns null', async () => {
    authMock.mockResolvedValue(null)
    getPostMock.mockResolvedValue(null)

    const res = await GET(getRequest())
    expect(res.status).toBe(500)
  })
})

describe('GET /api/posts?authorId=', () => {
  it('returns 401 when requesting an author feed while unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await GET(getRequest('?authorId=a1'))
    expect(res.status).toBe(401)
    expect(getPostsByAuthorMock).not.toHaveBeenCalled()
  })

  it('returns 403 when a non-admin requests another author’s feed', async () => {
    authMock.mockResolvedValue({ user: { id: 'a2', roles: 'BLOGWRITER' } })

    const res = await GET(getRequest('?authorId=a1'))
    expect(res.status).toBe(403)
    expect(getPostsByAuthorMock).not.toHaveBeenCalled()
  })

  it('lets an author read their own feed', async () => {
    authMock.mockResolvedValue({ user: { id: 'a1', roles: 'BLOGWRITER' } })
    getPostsByAuthorMock.mockResolvedValue([{ id: 'p1' }])

    const res = await GET(getRequest('?authorId=a1'))
    expect(res.status).toBe(200)
    expect(getPostsByAuthorMock).toHaveBeenCalledWith('a1')
  })

  it('lets an admin read any author’s feed', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin', roles: 'ADMIN' } })
    getPostsByAuthorMock.mockResolvedValue([{ id: 'p1' }])

    const res = await GET(getRequest('?authorId=a1'))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/posts', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await POST(postRequest({ title: 'T', content: 'C' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for a role that cannot author posts', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'USER' } })

    const res = await POST(postRequest({ title: 'T', content: 'C' }))
    expect(res.status).toBe(403)
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('returns 400 when title or content is missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'BLOGWRITER' } })

    const res = await POST(postRequest({ title: 'T' }))
    expect(res.status).toBe(400)
  })

  it('creates a post and returns 201', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'BLOGWRITER' } })
    createPostMock.mockResolvedValue({ id: 'p1', title: 'T' })

    const res = await POST(
      postRequest({ title: 'T', content: 'C', image: 'img', seoData: { slug: 's' } })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body).toEqual({ id: 'p1', title: 'T' })
    expect(createPostMock).toHaveBeenCalledWith('T', 'C', 'img', 'u1', { slug: 's' })
  })

  it('returns 500 when creation fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', roles: 'ADMIN' } })
    createPostMock.mockResolvedValue(null)

    const res = await POST(postRequest({ title: 'T', content: 'C' }))
    expect(res.status).toBe(500)
  })
})
