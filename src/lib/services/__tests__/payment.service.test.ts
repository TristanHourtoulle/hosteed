import { PaymentStatus, RentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'

const rentFindUniqueMock = jest.fn()
const rentUpdateMock = jest.fn()
const payRequestCreateMock = jest.fn()
const payRequestUpdateMock = jest.fn()
const payRequestFindUniqueMock = jest.fn()
const payRequestFindManyMock = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    rent: {
      findUnique: (...a: unknown[]) => rentFindUniqueMock(...a),
      update: (...a: unknown[]) => rentUpdateMock(...a),
    },
    payRequest: {
      create: (...a: unknown[]) => payRequestCreateMock(...a),
      update: (...a: unknown[]) => payRequestUpdateMock(...a),
      findUnique: (...a: unknown[]) => payRequestFindUniqueMock(...a),
      findMany: (...a: unknown[]) => payRequestFindManyMock(...a),
    },
  },
}))

const sendFromTemplateMock = jest.fn()
jest.mock('@/lib/services/email', () => ({
  emailService: {
    sendFromTemplate: (...a: unknown[]) => sendFromTemplateMock(...a),
  },
}))

import {
  getPayablePricesPerRent,
  createPayRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  requestPaymentInfo,
  getAllPaymentRequest,
  getPaymentRequestById,
} from '../payment.service'

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
  jest.clearAllMocks()
  sendFromTemplateMock.mockResolvedValue(undefined)
})

/** Minimal rent factory covering the fields the service reads. */
function makeRent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rent-1',
    prices: '100',
    hostAmount: null,
    totalAmount: null,
    hostCommission: null,
    payment: PaymentStatus.CLIENT_PAID,
    status: RentStatus.RESERVED,
    arrivingDate: new Date('2026-08-01'),
    leavingDate: new Date('2026-08-05'),
    product: {
      name: 'Villa',
      commission: 20,
      contract: false,
      owner: {
        id: 'host-1',
        name: 'Host',
        lastname: 'One',
        email: 'host@example.com',
      },
    },
    user: {
      id: 'guest-1',
      name: 'Guest',
      lastname: 'Two',
      email: 'guest@example.com',
    },
    ...overrides,
  }
}

describe('getPayablePricesPerRent', () => {
  it('uses the new pricing fields (hostAmount/hostCommission) when present', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({
        hostAmount: 80,
        totalAmount: 100,
        hostCommission: 20,
        product: { name: 'Villa', commission: 20, contract: true },
        payment: PaymentStatus.CLIENT_PAID,
      })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.totalPricesPayable).toBe(80)
    expect(result.commission).toBe(20)
    // contract + CLIENT_PAID => full host amount is available
    expect(result.availablePrice).toBe(80)
  })

  it('falls back to legacy commission math when hostAmount is null', async () => {
    // price = 100 - 100 * (20/100) = 80
    // Default status is RESERVED, so only half becomes available (see below).
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ hostAmount: null, prices: '100', payment: PaymentStatus.CLIENT_PAID })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.totalPricesPayable).toBe(80)
    expect(result.commission).toBe(20)
    // RESERVED + CLIENT_PAID (non-contract) => half is available
    expect(result.availablePrice).toBe(40) // 80 / 2
  })

  it('returns half availablePrice for a RESERVED + CLIENT_PAID non-contract rent', async () => {
    // Regression guard: RESERVED must match the CHECKIN/RESERVED half branch.
    // The previous `status === (CHECKIN || RESERVED)` bug let RESERVED fall
    // through to the full-payout branch, over-paying the host.
    rentFindUniqueMock.mockResolvedValue(
      makeRent({
        hostAmount: 80,
        hostCommission: 20,
        status: RentStatus.RESERVED,
        payment: PaymentStatus.CLIENT_PAID,
        product: { name: 'Villa', commission: 20, contract: false },
      })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.availablePrice).toBe(40) // 80 / 2, not the full 80
  })

  it('computes pendingPrice as half for MID_TRANSFER_REQ', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ payment: PaymentStatus.MID_TRANSFER_REQ, status: RentStatus.CHECKIN })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.pendingPrice).toBe(40) // 80 / 2
  })

  it('computes transferredPrice as full for FULL_TRANSFER_DONE', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ payment: PaymentStatus.FULL_TRANSFER_DONE, status: RentStatus.CHECKOUT })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.transferredPrice).toBe(80)
  })

  it('returns half availablePrice for a CHECKIN + CLIENT_PAID rent', async () => {
    // CHECKIN + CLIENT_PAID (non-contract) => half is available.
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ status: RentStatus.CHECKIN, payment: PaymentStatus.CLIENT_PAID })
    )

    const result = await getPayablePricesPerRent('rent-1')

    expect(result.availablePrice).toBe(40) // 80 / 2
  })

  it('throws when the rent does not exist', async () => {
    rentFindUniqueMock.mockResolvedValue(null)
    await expect(getPayablePricesPerRent('missing')).rejects.toThrow('Rent not found')
  })

  it('throws when the rent has no product', async () => {
    rentFindUniqueMock.mockResolvedValue({ id: 'rent-1', product: null })
    await expect(getPayablePricesPerRent('rent-1')).rejects.toThrow('Product not found')
  })
})

describe('createPayRequest', () => {
  it('creates a FULL_TRANSFER_REQ for a RESERVED rent and updates the rent payment', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ status: RentStatus.RESERVED, hostAmount: 80, totalAmount: 100, hostCommission: 20 })
    )
    payRequestCreateMock.mockResolvedValue({ id: 'pr-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const result = await createPayRequest(
      'rent-1',
      PaymentStatus.FULL_TRANSFER_REQ,
      'host-1',
      'notes',
      PaymentMethod.SEPA_VIREMENT
    )

    expect(result.success).toBe(true)
    // Full host amount requested
    expect(payRequestCreateMock.mock.calls[0][0].data.prices).toBe('80')
    expect(payRequestCreateMock.mock.calls[0][0].data.status).toBe(PaymentReqStatus.RECEIVED)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { payment: PaymentStatus.FULL_TRANSFER_REQ },
    })
  })

  it('requests half the host amount for a MID_TRANSFER_REQ', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ status: RentStatus.RESERVED, hostAmount: 80, hostCommission: 20 })
    )
    payRequestCreateMock.mockResolvedValue({ id: 'pr-2' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const result = await createPayRequest(
      'rent-1',
      PaymentStatus.MID_TRANSFER_REQ,
      'host-1',
      '',
      PaymentMethod.PAYPAL
    )

    expect(result.success).toBe(true)
    expect(payRequestCreateMock.mock.calls[0][0].data.prices).toBe('40')
  })

  it('rejects an invalid request-type/status combination', async () => {
    // REST_TRANSFER_REQ requires payment == MID_TRANSFER_DONE.
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ status: RentStatus.RESERVED, payment: PaymentStatus.CLIENT_PAID })
    )

    const result = await createPayRequest(
      'rent-1',
      PaymentStatus.REST_TRANSFER_REQ,
      'host-1',
      '',
      PaymentMethod.OTHER
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Invalid payment request type/)
    expect(payRequestCreateMock).not.toHaveBeenCalled()
    expect(rentUpdateMock).not.toHaveBeenCalled()
  })

  it('still succeeds when the notification emails fail', async () => {
    rentFindUniqueMock.mockResolvedValue(
      makeRent({ status: RentStatus.RESERVED, hostAmount: 80, hostCommission: 20 })
    )
    payRequestCreateMock.mockResolvedValue({ id: 'pr-3' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })
    sendFromTemplateMock.mockRejectedValue(new Error('brevo down'))

    const result = await createPayRequest(
      'rent-1',
      PaymentStatus.FULL_TRANSFER_REQ,
      'host-1',
      '',
      PaymentMethod.SEPA_VIREMENT
    )

    expect(result.success).toBe(true)
  })

  it('returns a failure object when the rent is missing', async () => {
    rentFindUniqueMock.mockResolvedValue(null)

    const result = await createPayRequest(
      'missing',
      PaymentStatus.FULL_TRANSFER_REQ,
      'host-1',
      '',
      PaymentMethod.SEPA_VIREMENT
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('No rent found with this ID')
  })
})

describe('approvePaymentRequest', () => {
  it('maps MID_TRANSFER_REQ to MID_TRANSFER_DONE and updates the rent', async () => {
    payRequestUpdateMock.mockResolvedValue({
      id: 'pr-1',
      rentId: 'rent-1',
      PaymentRequest: PaymentStatus.MID_TRANSFER_REQ,
    })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const result = await approvePaymentRequest('pr-1')

    expect(payRequestUpdateMock.mock.calls[0][0].data.status).toBe(PaymentReqStatus.DONE)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { payment: PaymentStatus.MID_TRANSFER_DONE },
    })
    expect(result?.request.id).toBe('pr-1')
  })

  it('returns undefined when the update throws', async () => {
    payRequestUpdateMock.mockRejectedValue(new Error('not found'))
    const result = await approvePaymentRequest('missing')
    expect(result).toBeUndefined()
  })
})

describe('rejectPaymentRequest', () => {
  it('reverts a REST_TRANSFER_REQ back to MID_TRANSFER_DONE', async () => {
    payRequestFindUniqueMock.mockResolvedValue({
      id: 'pr-1',
      rentId: 'rent-1',
      prices: '40',
      notes: '',
      PaymentRequest: PaymentStatus.REST_TRANSFER_REQ,
      user: { name: 'Host', lastname: 'One', email: 'host@example.com' },
      rent: { product: { name: 'Villa' } },
    })
    payRequestUpdateMock.mockResolvedValue({ id: 'pr-1', rentId: 'rent-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    const result = await rejectPaymentRequest('pr-1', 'incomplete info')

    expect(payRequestUpdateMock.mock.calls[0][0].data.status).toBe(PaymentReqStatus.REFUSED)
    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { payment: PaymentStatus.MID_TRANSFER_DONE },
    })
    expect(result.request.id).toBe('pr-1')
  })

  it('reverts other request types back to CLIENT_PAID', async () => {
    payRequestFindUniqueMock.mockResolvedValue({
      id: 'pr-2',
      rentId: 'rent-1',
      prices: '80',
      notes: '',
      PaymentRequest: PaymentStatus.FULL_TRANSFER_REQ,
      user: { name: 'Host', lastname: 'One', email: 'host@example.com' },
      rent: { product: { name: 'Villa' } },
    })
    payRequestUpdateMock.mockResolvedValue({ id: 'pr-2', rentId: 'rent-1' })
    rentUpdateMock.mockResolvedValue({ id: 'rent-1' })

    await rejectPaymentRequest('pr-2', 'nope')

    expect(rentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'rent-1' },
      data: { payment: PaymentStatus.CLIENT_PAID },
    })
  })

  it('throws when the payment request is missing', async () => {
    payRequestFindUniqueMock.mockResolvedValue(null)
    await expect(rejectPaymentRequest('missing', 'r')).rejects.toThrow('Payment Request not found')
  })
})

describe('requestPaymentInfo', () => {
  it('appends the info request to the notes and notifies the host', async () => {
    payRequestFindUniqueMock.mockResolvedValue({
      id: 'pr-1',
      rentId: 'rent-1',
      prices: '80',
      notes: 'existing',
      user: { name: 'Host', lastname: 'One', email: 'host@example.com' },
      rent: { product: { name: 'Villa' } },
    })
    payRequestUpdateMock.mockResolvedValue({ id: 'pr-1' })

    await requestPaymentInfo('pr-1', 'Please send your IBAN')

    const noteArg = payRequestUpdateMock.mock.calls[0][0].data.notes
    expect(noteArg).toContain('existing')
    expect(noteArg).toContain('[INFO DEMANDÉE]: Please send your IBAN')
    expect(sendFromTemplateMock).toHaveBeenCalledWith(
      'payment-request-info-needed',
      'host@example.com',
      expect.any(String),
      expect.any(Object)
    )
  })

  it('throws when the payment request is missing', async () => {
    payRequestFindUniqueMock.mockResolvedValue(null)
    await expect(requestPaymentInfo('missing', 'x')).rejects.toThrow('Payment Request not found')
  })
})

describe('read helpers', () => {
  it('getAllPaymentRequest returns the list wrapped in { payRequest }', async () => {
    payRequestFindManyMock.mockResolvedValue([{ id: 'pr-1' }])
    const result = await getAllPaymentRequest()
    expect(result.payRequest).toHaveLength(1)
  })

  it('getPaymentRequestById transforms the rent dates and price', async () => {
    payRequestFindUniqueMock.mockResolvedValue({
      id: 'pr-1',
      rent: {
        arrivingDate: new Date('2026-08-01T00:00:00.000Z'),
        leavingDate: new Date('2026-08-05T00:00:00.000Z'),
        prices: '100',
        product: { name: 'Villa' },
      },
    })

    const result = await getPaymentRequestById('pr-1')

    expect(result.rent.checkIn).toBe('2026-08-01T00:00:00.000Z')
    expect(result.rent.totalPrice).toBe(100)
    expect(result.rent.product.address).toBe('Villa')
  })

  it('getPaymentRequestById throws when not found', async () => {
    payRequestFindUniqueMock.mockResolvedValue(null)
    await expect(getPaymentRequestById('missing')).rejects.toThrow('Payment request not found')
  })
})
