/**
 * Unit tests for the server-side StripeService wrapper.
 *
 * The `stripe` SDK is mocked at the boundary — no real network calls. The
 * module reads STRIPE_SECRET_KEY at eval time, so the service is `require`d
 * lazily after the env var is set.
 */

const mockCheckoutCreate = jest.fn()
const mockPaymentIntentCreate = jest.fn()
const mockPaymentIntentCapture = jest.fn()
const mockPaymentIntentRetrieve = jest.fn()
const mockRefundCreate = jest.fn()

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
    paymentIntents: {
      create: mockPaymentIntentCreate,
      capture: mockPaymentIntentCapture,
      retrieve: mockPaymentIntentRetrieve,
    },
    refunds: { create: mockRefundCreate },
  }))
)

type StripeServiceType = typeof import('../stripe').StripeService
let StripeService: StripeServiceType

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
  StripeService = require('../stripe').StripeService
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('StripeService.createCheckoutSession', () => {
  it('converts the euro amount to integer cents and builds a single card line item', async () => {
    mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe/session' })

    const result = await StripeService.createCheckoutSession({
      amount: 118.5,
      productName: 'Hotel Booking',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
      metadata: { productId: 'p1' },
    })

    expect(result.success).toBe(true)
    expect(result.url).toBe('https://stripe/session')

    const params = mockCheckoutCreate.mock.calls[0][0]
    expect(params.payment_method_types).toEqual(['card'])
    expect(params.mode).toBe('payment')
    expect(params.payment_intent_data).toEqual({ capture_method: 'manual' })
    expect(params.line_items).toHaveLength(1)
    expect(params.line_items[0].quantity).toBe(1)
    expect(params.line_items[0].price_data.currency).toBe('eur')
    expect(params.line_items[0].price_data.product_data.name).toBe('Hotel Booking')
    // 118.5 EUR => 11850 cents (rounded)
    expect(params.line_items[0].price_data.unit_amount).toBe(11850)
    expect(params.success_url).toBe('https://app/success')
    expect(params.cancel_url).toBe('https://app/cancel')
    expect(params.metadata).toEqual({ productId: 'p1' })
  })

  it('rounds fractional cents to the nearest integer', async () => {
    mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe/s' })

    await StripeService.createCheckoutSession({
      amount: 10.999,
      productName: 'X',
      successUrl: 's',
      cancelUrl: 'c',
    })

    // 10.999 * 100 = 1099.9 => rounded to 1100
    expect(mockCheckoutCreate.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(1100)
  })

  it('returns a failure object when the Stripe SDK throws', async () => {
    mockCheckoutCreate.mockRejectedValue(new Error('stripe error'))

    const result = await StripeService.createCheckoutSession({
      amount: 100,
      productName: 'X',
      successUrl: 's',
      cancelUrl: 'c',
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/session de paiement/)
  })
})

describe('StripeService.createPaymentIntent', () => {
  it('creates a manual-capture intent with the amount in cents', async () => {
    mockPaymentIntentCreate.mockResolvedValue({
      client_secret: 'cs_123',
      id: 'pi_123',
    })

    const result = await StripeService.createPaymentIntent({ amount: 50, metadata: { a: 'b' } })

    expect(result.success).toBe(true)
    expect(result.clientSecret).toBe('cs_123')
    expect(result.paymentIntentId).toBe('pi_123')

    const params = mockPaymentIntentCreate.mock.calls[0][0]
    expect(params.amount).toBe(5000)
    expect(params.currency).toBe('eur')
    expect(params.capture_method).toBe('manual')
    expect(params.metadata).toEqual({ a: 'b' })
  })

  it('returns a failure object when creation throws', async () => {
    mockPaymentIntentCreate.mockRejectedValue(new Error('boom'))
    const result = await StripeService.createPaymentIntent({ amount: 10 })
    expect(result.success).toBe(false)
  })
})

describe('StripeService.capturePaymentIntent', () => {
  it('captures the given payment intent', async () => {
    mockPaymentIntentCapture.mockResolvedValue({ id: 'pi_1', status: 'succeeded' })
    const result = await StripeService.capturePaymentIntent('pi_1')
    expect(result.success).toBe(true)
    expect(mockPaymentIntentCapture).toHaveBeenCalledWith('pi_1')
  })

  it('returns failure on capture error', async () => {
    mockPaymentIntentCapture.mockRejectedValue(new Error('cannot capture'))
    const result = await StripeService.capturePaymentIntent('pi_1')
    expect(result.success).toBe(false)
  })
})

describe('StripeService.retrievePaymentIntent', () => {
  it('retrieves the payment intent', async () => {
    mockPaymentIntentRetrieve.mockResolvedValue({ id: 'pi_1', status: 'requires_capture' })
    const result = await StripeService.retrievePaymentIntent('pi_1')
    expect(result.success).toBe(true)
    expect(result.paymentIntent).toMatchObject({ id: 'pi_1' })
  })

  it('returns failure when retrieval throws', async () => {
    mockPaymentIntentRetrieve.mockRejectedValue(new Error('not found'))
    const result = await StripeService.retrievePaymentIntent('pi_1')
    expect(result.success).toBe(false)
  })
})

describe('StripeService.RefundPaymentIntent', () => {
  it('creates a refund for the payment intent', async () => {
    mockRefundCreate.mockResolvedValue({ id: 're_1' })
    const result = await StripeService.RefundPaymentIntent('pi_1')
    expect(result.success).toBe(true)
    expect(mockRefundCreate).toHaveBeenCalledWith({ payment_intent: 'pi_1' })
  })

  it('returns failure when the refund throws', async () => {
    mockRefundCreate.mockRejectedValue(new Error('already refunded'))
    const result = await StripeService.RefundPaymentIntent('pi_1')
    expect(result.success).toBe(false)
  })
})

describe('StripeService when Stripe is not configured', () => {
  it('short-circuits every method with a "not configured" error', async () => {
    await jest.isolateModulesAsync(async () => {
      const previous = process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_SECRET_KEY
      const { StripeService: Unconfigured } = require('../stripe')
      process.env.STRIPE_SECRET_KEY = previous

      const checkout = await Unconfigured.createCheckoutSession({
        amount: 10,
        productName: 'X',
        successUrl: 's',
        cancelUrl: 'c',
      })
      expect(checkout).toEqual({ success: false, error: 'Stripe not configured' })

      const intent = await Unconfigured.createPaymentIntent({ amount: 10 })
      expect(intent).toEqual({ success: false, error: 'Stripe not configured' })

      const capture = await Unconfigured.capturePaymentIntent('pi_1')
      expect(capture.success).toBe(false)

      const refund = await Unconfigured.RefundPaymentIntent('pi_1')
      expect(refund.success).toBe(false)

      // The SDK constructor must not have been invoked without a key.
      expect(mockCheckoutCreate).not.toHaveBeenCalled()
    })
  })
})
