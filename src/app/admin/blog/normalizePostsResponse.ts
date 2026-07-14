export interface BlogPostSummary {
  id: string
  title: string
  slug?: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    roles: string
  }
}

/**
 * Normalize the /api/posts JSON payload to a Post array.
 *
 * The endpoint returns an array for the author-scoped query (getPostsByAuthor)
 * but a paginated object ({ posts, pagination }) for the ADMIN "all posts" query
 * (getPost). Callers rely on an array (.filter/.map/.length), so anything else is
 * flattened to its `posts` field or an empty array (regression from TRI-1017).
 */
export function normalizePostsResponse(json: unknown): BlogPostSummary[] {
  if (Array.isArray(json)) {
    return json as BlogPostSummary[]
  }
  if (json && typeof json === 'object' && Array.isArray((json as { posts?: unknown }).posts)) {
    return (json as { posts: BlogPostSummary[] }).posts
  }
  return []
}
