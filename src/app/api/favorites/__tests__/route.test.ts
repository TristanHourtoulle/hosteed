/**
 * /api/favorites route handlers. The service layer is mocked at the boundary;
 * these tests verify the HTTP contract: authentication gating (401), input
 * validation (400 when productId is missing), the mapping of a service failure
 * to a 400, and the success responses. Node test env.
 */

const authMock = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: (...a: unknown[]) => authMock(...a),
}))

const addToFavoritesMock = jest.fn()
const removeFromFavoritesMock = jest.fn()
const getUserFavoritesMock = jest.fn()
jest.mock('@/lib/services/favorites.service', () => ({
  addToFavorites: (...a: unknown[]) => addToFavoritesMock(...a),
  removeFromFavorites: (...a: unknown[]) => removeFromFavoritesMock(...a),
  getUserFavorites: (...a: unknown[]) => getUserFavoritesMock(...a),
}))

import { POST, DELETE, GET } from '../route'

function jsonRequest(method: string, body: unknown): Request {
  return new Request('http://localhost/api/favorites', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1' } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('POST /api/favorites', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const res = await POST(jsonRequest('POST', { productId: 'p1' }))

    expect(res.status).toBe(401)
    expect(addToFavoritesMock).not.toHaveBeenCalled()
  })

  it('returns 400 when productId is missing', async () => {
    const res = await POST(jsonRequest('POST', {}))

    expect(res.status).toBe(400)
    expect(addToFavoritesMock).not.toHaveBeenCalled()
  })

  it('returns 200 with the service result on success', async () => {
    addToFavoritesMock.mockResolvedValue({ success: true, favorite: { id: 'f1' } })

    const res = await POST(jsonRequest('POST', { productId: 'p1' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true, favorite: { id: 'f1' } })
    expect(addToFavoritesMock).toHaveBeenCalledWith('u1', 'p1')
  })

  it('maps a service failure to a 400 with the error message', async () => {
    addToFavoritesMock.mockResolvedValue({ success: false, error: 'Produit non trouvé' })

    const res = await POST(jsonRequest('POST', { productId: 'p1' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Produit non trouvé')
  })
})

describe('DELETE /api/favorites', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await DELETE(jsonRequest('DELETE', { productId: 'p1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when productId is missing', async () => {
    const res = await DELETE(jsonRequest('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful removal', async () => {
    removeFromFavoritesMock.mockResolvedValue({ success: true, favorite: { id: 'f1' } })
    const res = await DELETE(jsonRequest('DELETE', { productId: 'p1' }))
    expect(res.status).toBe(200)
    expect(removeFromFavoritesMock).toHaveBeenCalledWith('u1', 'p1')
  })

  it('maps a "not found" service failure to a 400', async () => {
    removeFromFavoritesMock.mockResolvedValue({ success: false, error: 'Favori non trouvé' })
    const res = await DELETE(jsonRequest('DELETE', { productId: 'p1' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/favorites', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the caller’s favorites', async () => {
    getUserFavoritesMock.mockResolvedValue([{ id: 'f1' }])
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ favorites: [{ id: 'f1' }] })
    expect(getUserFavoritesMock).toHaveBeenCalledWith('u1')
  })
})
