import { normalizePostsResponse, type BlogPostSummary } from '../normalizePostsResponse'

const makePost = (id: string): BlogPostSummary => ({
  id,
  title: `Post ${id}`,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  author: { id: 'a1', name: 'Author', email: 'a@a.com', roles: 'ADMIN' },
})

describe('normalizePostsResponse', () => {
  it('returns the array unchanged for the author-scoped (getPostsByAuthor) shape', () => {
    const posts = [makePost('1'), makePost('2')]
    expect(normalizePostsResponse(posts)).toBe(posts)
  })

  it('extracts the posts array from the paginated ADMIN (getPost) object shape', () => {
    const posts = [makePost('1')]
    const payload = {
      posts,
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }

    const result = normalizePostsResponse(payload)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toBe(posts)
  })

  it('returns an empty array when the object has no posts field', () => {
    expect(normalizePostsResponse({ error: 'Erreur serveur' })).toEqual([])
  })

  it.each([null, undefined, 'string', 42, { posts: 'not-an-array' }])(
    'returns an empty array for non-normalizable payload %p',
    payload => {
      expect(normalizePostsResponse(payload)).toEqual([])
    }
  )
})
