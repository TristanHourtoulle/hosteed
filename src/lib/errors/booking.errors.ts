/**
 * Thrown when a booking cannot be created due to a date conflict
 * with an existing reservation (overbooking prevention).
 *
 * @example
 * throw new BookingConflictError('No rooms available for this period')
 */
export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingConflictError'
  }
}

/**
 * Thrown when booking input parameters are missing or invalid.
 *
 * @example
 * throw new BookingValidationError('Missing required field: productId')
 */
export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingValidationError'
  }
}
