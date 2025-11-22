/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = degreesToRadians(lat2 - lat1)
  const dLon = degreesToRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers

  return distance
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a product is within a given radius from a center point
 * @param productLat Product latitude
 * @param productLon Product longitude
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param radiusKm Radius in kilometers (default: 30km)
 * @returns true if product is within radius
 */
export function isWithinRadius(
  productLat: number,
  productLon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number = 30
): boolean {
  // Skip products without valid coordinates
  if (productLat === 0 && productLon === 0) {
    return false
  }

  const distance = calculateDistance(productLat, productLon, centerLat, centerLon)
  return distance <= radiusKm
}

/**
 * Filter products by distance from a center point
 * @param products Array of products with latitude and longitude
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param radiusKm Radius in kilometers (default: 30km)
 * @returns Filtered products with distance information
 */
export function filterProductsByRadius<
  T extends { latitude: number; longitude: number; id: string },
>(
  products: T[],
  centerLat: number,
  centerLon: number,
  radiusKm: number = 30
): Array<T & { distance: number }> {
  return products
    .map(product => ({
      ...product,
      distance: calculateDistance(product.latitude, product.longitude, centerLat, centerLon),
    }))
    .filter(product => {
      // Include products within radius
      // Exclude products with invalid coordinates (0, 0) unless they're actually there
      if (product.latitude === 0 && product.longitude === 0) {
        return false
      }
      return product.distance <= radiusKm
    })
    .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
}
