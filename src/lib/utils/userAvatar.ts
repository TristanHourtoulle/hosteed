/**
 * User-like shape the avatar helper needs to work with. Permissive on purpose
 * so callers can pass any User subtype (from Prisma, from session, from a DTO).
 */
export interface UserAvatarSource {
  email: string
  image?: string | null
  profilePicture?: string | null
  profilePictureBase64?: string | null
}

/**
 * Returns the best available URL to use as the user's avatar image.
 *
 * Priority:
 *   1. `user.image`                  — NextAuth standard field (OAuth providers)
 *   2. `user.profilePicture`         — Custom uploaded profile picture path/URL
 *   3. `user.profilePictureBase64`   — Base64 data URL fallback
 *   4. Dicebear placeholder seeded with the user's email
 *
 * If no real profile picture is defined, the returned Dicebear URL is a
 * deterministic placeholder that still avoids the generic fallback initials
 * pattern.
 */
export function getUserAvatarUrl(user: UserAvatarSource): string {
  if (user.image) return user.image
  if (user.profilePicture) return user.profilePicture
  if (user.profilePictureBase64) return user.profilePictureBase64
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
}

/**
 * Convenience helper that returns `true` when the user has a real, user-uploaded
 * profile picture (i.e. not the Dicebear fallback).
 */
export function hasRealProfilePicture(user: UserAvatarSource): boolean {
  return Boolean(user.image || user.profilePicture || user.profilePictureBase64)
}
