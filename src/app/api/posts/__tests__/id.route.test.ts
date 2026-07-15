/**
 * /api/posts/[id] item route. The post service is mocked at the boundary.
 * Coverage: public GET (404 mapping), the edit/delete permission gate
 * (canUserEditPost → 403), body validation on PUT, and the service-error →
 * HTTP-status mapping ("not found" → 404, "Unauthorized" → 403). Node test env.
 * `params` is a Promise, matching the Next 15 route signature.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const getPostByIdMock = jest.fn()
const updatePostMock = jest.fn()
const deletePostMock = jest.fn()
const canUserEditPostMock = jest.fn()
jest.mock('@/lib/services/post.service', () => ({
  getPostById: (...a: unknown[]) => getPostByIdMock(...a),
  updatePost: (...a: unknown[]) => updatePostMock(...a),
  deletePost: (...a: unknown[]) => deletePostMock(...a),
  canUserEditPost: (...a: unknown[]) => canUserEditPostMock(...a),
}))

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../[id]/route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })

function jsonRequest(method: string, body?: unknown): NextRequest {
  const hasBody = method !== 'GET' && method !== 'HEAD'
  return new NextRequest('http://localhost/api/posts/p1', {
    method,
    ...(hasBody ? { body: JSON.stringify(body ?? {}) } : {}),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1', roles: 'BLOGWRITER' } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('GET /api/posts/[id]', () => {
  it('returns the post when found', async () => {
    getPostByIdMock.mockResolvedValue({ id: 'p1' })
    const res = await GET(jsonRequest('GET', {}), params('p1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'p1' })
  })

  it('returns 404 when the post is missing', async () => {
    getPostByIdMock.mockResolvedValue(null)
    const res = await GET(jsonRequest('GET', {}), params('missing'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/posts/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await PUT(jsonRequest('PUT', { title: 'T', content: 'C' }), params('p1'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user may not edit the post', async () => {
    canUserEditPostMock.mockResolvedValue(false)
    const res = await PUT(jsonRequest('PUT', { title: 'T', content: 'C' }), params('p1'))
    expect(res.status).toBe(403)
    expect(updatePostMock).not.toHaveBeenCalled()
  })

  it('returns 400 when title/content are missing', async () => {
    canUserEditPostMock.mockResolvedValue(true)
    const res = await PUT(jsonRequest('PUT', { title: 'T' }), params('p1'))
    expect(res.status).toBe(400)
  })

  it('updates the post and returns it', async () => {
    canUserEditPostMock.mockResolvedValue(true)
    updatePostMock.mockResolvedValue({ id: 'p1', title: 'T' })

    const res = await PUT(
      jsonRequest('PUT', { title: 'T', content: 'C', image: 'img' }),
      params('p1')
    )

    expect(res.status).toBe(200)
    expect(updatePostMock).toHaveBeenCalledWith('p1', 'T', 'C', 'img', 'u1', undefined)
  })

  it('maps a service "not found" error to 404', async () => {
    canUserEditPostMock.mockResolvedValue(true)
    updatePostMock.mockRejectedValue(new Error('Post not found'))

    const res = await PUT(jsonRequest('PUT', { title: 'T', content: 'C' }), params('p1'))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/posts/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await DELETE(jsonRequest('DELETE', {}), params('p1'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user may not delete the post', async () => {
    canUserEditPostMock.mockResolvedValue(false)
    const res = await DELETE(jsonRequest('DELETE', {}), params('p1'))
    expect(res.status).toBe(403)
    expect(deletePostMock).not.toHaveBeenCalled()
  })

  it('deletes the post and returns the result', async () => {
    canUserEditPostMock.mockResolvedValue(true)
    deletePostMock.mockResolvedValue({ success: true, message: 'deleted' })

    const res = await DELETE(jsonRequest('DELETE', {}), params('p1'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, message: 'deleted' })
    expect(deletePostMock).toHaveBeenCalledWith('p1', 'u1')
  })

  it('maps a service "Unauthorized" error to 403', async () => {
    canUserEditPostMock.mockResolvedValue(true)
    deletePostMock.mockRejectedValue(new Error('Unauthorized: not your post'))

    const res = await DELETE(jsonRequest('DELETE', {}), params('p1'))
    expect(res.status).toBe(403)
  })
})
