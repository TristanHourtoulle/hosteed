/**
 * Tests for the Stripe webhook handler.
 *
 * Stripe signature verification, prisma, createRent and the email service are
 * all mocked at the boundary — no real Stripe/network/DB access.
 */

const mockConstructEvent = jest.fn()
const mockSessionsList = jest.fn()

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    checkout: { sessions: { list: mockSessionsList } },
  }))
)

const rentFindFirstMock = jest.fn()
const rentUpdateMock = jest.fn()
const userFindUniqueMock = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    rent: {
      findFirst: (...a: unknown[]) => rentFindFirstMock(...a),
      update: (...a: unknown[]) => rentUpdateMock(...a),
    },
    user: {
      findUnique: (...a: unknown[]) => userFindUniqueMock(...a),
    },
  },
}))

const createRentMock = jest.fn()
jest.mock('@/lib/services/rents.service', () => ({
  createRent: (...a: unknown[]) => createRentMock(...a),
}))

const sendDisputeNotificationMock = jest.fn()
const sendPaymentErrorMock = jest.fn()
const sendFromTemplateMock = jest.fn()
jest.mock('@/lib/services/email', () => ({
  emailService: {
    sendDisputeNotification: (...a: unknown[]) => sendDisputeNotificationMock(...a),
    sendPaymentError: (...a: unknown[]) => sendPaymentErrorMock(...a),
    sendFromTemplate: (...a: unknown[]) => sendFromTemplateMock(...a),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

// Re-export the real booking error classes so `instanceof` checks work.
import { BookingConflictError, BookingValidationError } from '@/lib/errors/booking.errors'

import { POST } from '../route'

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy'
})

beforeEach(() => {
  jest.clearAllMocks()
})

/** Build a webhook Request with a raw body and a signature header. */
function makeRequest(signature: string | null = 'sig_valid') {
  const headers: Record<string, string> = {}
  if (signature !== null) headers['stripe-signature'] = signature
  return new Request('http://localhost/webhook', {
    method: 'POST',
    headers,
    body: 'raw-body',
  })
}

function completedSessionMetadata(overrides: Record<string, string> = {}) {
  return {
    productId: 'prod-1',
    userId: 'user-1',
    arrivingDate: '2026-08-01',
    leavingDate: '2026-08-05',
    peopleNumber: '2',
    prices: '450',
    selectedExtras: '[]',
    ...overrides,
  }
}

describe('signature and configuration guards', () => {
  it('rejects a request with no signature header (400)', async () => {
    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Signature manquante')
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it('returns 500 when the webhook secret is not configured', async () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(makeRequest())
    process.env.STRIPE_WEBHOOK_SECRET = previous

    expect(res.status).toBe(500)
  })

  it('rejects an invalid signature (constructEvent throws) with 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature')
    })

    const res = await POST(makeRequest('bad_sig'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Erreur webhook')
    expect(createRentMock).not.toHaveBeenCalled()
  })
})

describe('checkout.session.completed', () => {
  it('creates the Rent (with room types) from the server-authored metadata', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          status: 'complete',
          payment_intent: 'pi_1',
          metadata: completedSessionMetadata({
            roomTypeLines: JSON.stringify([{ roomTypeId: 'rt-1', quantity: 2 }]),
          }),
        },
      },
    })
    rentFindFirstMock.mockResolvedValue(null) // no existing rent
    createRentMock.mockResolvedValue({ id: 'rent-new' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-new' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(createRentMock).toHaveBeenCalledTimes(1)
    const arg = createRentMock.mock.calls[0][0]
    expect(arg.productId).toBe('prod-1')
    expect(arg.userId).toBe('user-1')
    expect(arg.stripeId).toBe('pi_1')
    // Server-authored price from metadata, not client-supplied.
    expect(arg.prices).toBe(450)
    // Room types forwarded so createRent can persist RentRoomType rows.
    expect(arg.selectedRoomTypes).toEqual([{ roomTypeId: 'rt-1', quantity: 2 }])
    // Newly created rent is parked in WAITING / NOT_PAID (manual capture flow).
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-new' },
      data: { status: 'WAITING', payment: 'NOT_PAID' },
    })
  })

  it('is idempotent: skips createRent when a rent already exists for the payment intent', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          status: 'complete',
          payment_intent: 'pi_dup',
          metadata: completedSessionMetadata(),
        },
      },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'existing-rent' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(createRentMock).not.toHaveBeenCalled()
    expect(rentUpdateMock).not.toHaveBeenCalled()
  })

  it('returns 400 when required metadata is missing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          status: 'complete',
          payment_intent: 'pi_1',
          metadata: { productId: 'prod-1' }, // incomplete
        },
      },
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Métadonnées manquantes')
    expect(createRentMock).not.toHaveBeenCalled()
  })

  it('returns 409 when createRent raises a BookingConflictError', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          status: 'complete',
          payment_intent: 'pi_conflict',
          metadata: completedSessionMetadata(),
        },
      },
    })
    rentFindFirstMock.mockResolvedValue(null)
    createRentMock.mockRejectedValue(new BookingConflictError('dates taken'))

    const res = await POST(makeRequest())

    expect(res.status).toBe(409)
  })

  it('returns 400 when createRent raises a BookingValidationError', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          status: 'complete',
          payment_intent: 'pi_invalid',
          metadata: completedSessionMetadata(),
        },
      },
    })
    rentFindFirstMock.mockResolvedValue(null)
    createRentMock.mockRejectedValue(new BookingValidationError('bad input'))

    const res = await POST(makeRequest())

    expect(res.status).toBe(400)
  })
})

describe('other event types', () => {
  it('marks the rent RESERVED/CLIENT_PAID on payment_intent.succeeded', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_ok' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'RESERVED', accepted: true, payment: 'CLIENT_PAID' },
    })
  })

  it('cancels the rent and emails the guest on payment_intent.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_fail' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1', userId: 'user-1', prices: '450' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })
    userFindUniqueMock.mockResolvedValue({
      email: 'guest@example.com',
      name: 'Guest',
      emailOptOut: false,
      emailBounced: false,
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'CANCEL', payment: 'NOT_PAID' },
    })
    expect(sendPaymentErrorMock).toHaveBeenCalledTimes(1)
  })

  it('cancels and marks the rent DISPUTE on charge.dispute.created', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'charge.dispute.created',
      data: { object: { payment_intent: 'pi_disp', status: 'needs_response' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1', userId: 'user-1', prices: '450' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })
    userFindUniqueMock.mockResolvedValue({
      email: 'guest@example.com',
      name: 'Guest',
      emailOptOut: false,
      emailBounced: false,
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'CANCEL', payment: 'DISPUTE' },
    })
    expect(sendDisputeNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('captures the payment on payment_intent.captured', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.captured',
      data: { object: { id: 'pi_cap' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'RESERVED', accepted: true, payment: 'CLIENT_PAID' },
    })
  })

  it('cancels and marks the rent REFUNDED on charge.refunded', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: { object: { payment_intent: 'pi_ref' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1', userId: 'user-1', prices: '450' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })
    userFindUniqueMock.mockResolvedValue({
      email: 'guest@example.com',
      name: 'Guest',
      emailOptOut: false,
      emailBounced: false,
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'CANCEL', payment: 'REFUNDED' },
    })
    expect(sendFromTemplateMock).toHaveBeenCalledTimes(1)
  })

  it('restores the rent to RESERVED/CLIENT_PAID when a dispute is won (charge.dispute.closed)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'charge.dispute.closed',
      data: { object: { payment_intent: 'pi_disp', status: 'won' } },
    })
    rentFindFirstMock.mockResolvedValue({ id: 'rent-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { status: 'RESERVED', payment: 'CLIENT_PAID' },
    })
  })

  it('creates a rent from the checkout session when payment_intent.succeeded finds no rent', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_new' } },
    })
    // First findFirst (initial lookup) => none; second (idempotency guard) => none.
    rentFindFirstMock.mockResolvedValue(null)
    mockSessionsList.mockResolvedValue({
      data: [
        {
          id: 'cs_1',
          metadata: completedSessionMetadata({
            roomTypeLines: JSON.stringify([{ roomTypeId: 'rt-1', quantity: 1 }]),
          }),
        },
      ],
    })
    createRentMock.mockResolvedValue({ id: 'rent-new' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-new' })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(mockSessionsList).toHaveBeenCalledWith({ payment_intent: 'pi_new' })
    expect(createRentMock).toHaveBeenCalledTimes(1)
    const arg = createRentMock.mock.calls[0][0]
    expect(arg.stripeId).toBe('pi_new')
    expect(arg.selectedRoomTypes).toEqual([{ roomTypeId: 'rt-1', quantity: 1 }])
    // Session-created rent goes straight to RESERVED / CLIENT_PAID.
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-new' },
      data: { status: 'RESERVED', payment: 'CLIENT_PAID' },
    })
  })

  it('is idempotent on payment_intent.succeeded when a rent already exists for the intent', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup' } },
    })
    // Initial lookup none, then session found, then idempotency guard finds a rent.
    rentFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-rent' })
    mockSessionsList.mockResolvedValue({
      data: [{ id: 'cs_1', metadata: completedSessionMetadata() }],
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(createRentMock).not.toHaveBeenCalled()
  })

  it('acknowledges an unhandled event type without touching the database', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: { id: 'in_1' } },
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(rentUpdateMock).not.toHaveBeenCalled()
    expect(createRentMock).not.toHaveBeenCalled()
  })
})
