// Utility function to convert BigInt fields to strings for JSON serialization
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString() as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as T
  }

  if (typeof obj === 'object') {
    // Handle Date objects specifically
    if (obj instanceof Date) {
      return obj.toISOString() as T
    }

    const serialized = {} as T
    for (const [key, value] of Object.entries(obj)) {
      ;(serialized as Record<string, unknown>)[key] = serializeBigInt(value)
    }
    return serialized
  }

  return obj
}
