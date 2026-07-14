/**
 * Withdrawal service (host balance + payment accounts + withdrawal requests).
 *
 * NOTE: a pre-existing `withdrawal.service.test.ts` in this folder imports from
 * `vitest` and hits a real DB — it is broken under Jest and is NOT relied upon.
 * This is a fresh, fully-mocked Jest suite (prisma mocked at the boundary,
 * node env). It does not touch/extend the broken file.
 */

const rent = { findMany: jest.fn() }
const withdrawalRequest = {
  findMany: jest.fn(),
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  groupBy: jest.fn(),
}
const paymentAccount = {
  count: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  findUnique: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { rent, withdrawalRequest, paymentAccount },
}))

import { PaymentMethod, WithdrawalType, WithdrawalStatus } from '@prisma/client'
import {
  calculateHostBalance,
  createPaymentAccount,
  createWithdrawalRequest,
  cancelWithdrawalRequest,
  getWithdrawalStats,
} from '../withdrawal.service'

beforeEach(() => {
  jest.clearAllMocks()
  rent.findMany.mockResolvedValue([])
  withdrawalRequest.findMany.mockResolvedValue([])
})

describe('calculateHostBalance', () => {
  it('returns a zero balance when the host has no rentals or withdrawals', async () => {
    const balance = await calculateHostBalance('user1')

    expect(balance.totalEarned).toBe(0)
    expect(balance.availableBalance).toBe(0)
    expect(balance.canWithdraw50Percent).toBe(false)
    expect(balance.canWithdraw100Percent).toBe(false)
  })

  it('sums paid rents and subtracts withdrawn + pending amounts', async () => {
    rent.findMany.mockResolvedValue([
      { id: 'r1', prices: BigInt(1000), payment: 'CLIENT_PAID' },
      { id: 'r2', prices: BigInt(500), payment: 'MID_TRANSFER_DONE' },
    ])
    // 1st withdrawalRequest.findMany = PAID (withdrawn), 2nd = pending set
    withdrawalRequest.findMany
      .mockResolvedValueOnce([{ amount: 200 }]) // withdrawn
      .mockResolvedValueOnce([{ amount: 300 }]) // pending

    const balance = await calculateHostBalance('user1')

    expect(balance.totalEarned).toBe(1500)
    expect(balance.totalWithdrawn).toBe(200)
    expect(balance.pendingWithdrawals).toBe(300)
    expect(balance.availableBalance).toBe(1000) // 1500 - 200 - 300
    expect(balance.amount50Percent).toBe(500)
    expect(balance.amount100Percent).toBe(1000)
    expect(balance.canWithdraw50Percent).toBe(true)
    expect(balance.canWithdraw100Percent).toBe(true)
  })
})

describe('createPaymentAccount', () => {
  it('marks the first account as default and unvalidated', async () => {
    paymentAccount.count.mockResolvedValue(0)
    paymentAccount.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data }))

    const account = await createPaymentAccount('user1', {
      method: PaymentMethod.SEPA_VIREMENT,
      accountHolderName: 'Jean',
      iban: 'FR7630001007941234567890185',
    })

    expect(account.isDefault).toBe(true)
    expect(account.isValidated).toBe(false)
  })

  it('does not mark a subsequent account as default', async () => {
    paymentAccount.count.mockResolvedValue(2)
    paymentAccount.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a2', ...data }))

    const account = await createPaymentAccount('user1', {
      method: PaymentMethod.PAYPAL,
      accountHolderName: 'Jean',
      paypalEmail: 'j@x.com',
    })

    expect(account.isDefault).toBe(false)
  })

  it('rejects SEPA without an IBAN', async () => {
    await expect(
      createPaymentAccount('user1', {
        method: PaymentMethod.SEPA_VIREMENT,
        accountHolderName: 'Jean',
      })
    ).rejects.toThrow('IBAN requis pour SEPA')
  })

  it('rejects a Mobile Money number with an invalid format', async () => {
    await expect(
      createPaymentAccount('user1', {
        method: PaymentMethod.MOBILE_MONEY,
        accountHolderName: 'Rakoto',
        mobileNumber: '0321234567',
      })
    ).rejects.toThrow('Format de numéro invalide')
  })

  it('rejects MoneyGram without full name and phone', async () => {
    await expect(
      createPaymentAccount('user1', {
        method: PaymentMethod.MONEYGRAM,
        accountHolderName: 'Jane',
        moneygramFullName: 'Jane Smith',
      })
    ).rejects.toThrow('Nom complet et téléphone requis pour MoneyGram')
  })
})

describe('createWithdrawalRequest', () => {
  beforeEach(() => {
    // Give the host a 1000€ available balance for these tests.
    rent.findMany.mockResolvedValue([{ id: 'r1', prices: BigInt(1000), payment: 'CLIENT_PAID' }])
  })

  it('throws when the amount exceeds the available (100%) balance', async () => {
    await expect(
      createWithdrawalRequest({
        userId: 'user1',
        amount: 5000,
        withdrawalType: WithdrawalType.FULL_100,
        paymentMethod: PaymentMethod.SEPA_VIREMENT,
        paymentDetails: {},
      })
    ).rejects.toThrow('supérieur au montant disponible')
  })

  it('caps a PARTIAL_50 request at 50% of the balance', async () => {
    await expect(
      createWithdrawalRequest({
        userId: 'user1',
        amount: 600, // > 500 (50% of 1000)
        withdrawalType: WithdrawalType.PARTIAL_50,
        paymentMethod: PaymentMethod.SEPA_VIREMENT,
        paymentDetails: {},
      })
    ).rejects.toThrow('supérieur au montant disponible')
  })

  it('throws for a non-positive amount', async () => {
    await expect(
      createWithdrawalRequest({
        userId: 'user1',
        amount: 0,
        withdrawalType: WithdrawalType.FULL_100,
        paymentMethod: PaymentMethod.SEPA_VIREMENT,
        paymentDetails: {},
      })
    ).rejects.toThrow('doit être supérieur à 0')
  })

  it('creates a PENDING request when using a validated account', async () => {
    paymentAccount.findUnique.mockResolvedValue({ id: 'acc1', isValidated: true })
    withdrawalRequest.create.mockImplementation(({ data }) => Promise.resolve({ id: 'w1', ...data }))

    const req = await createWithdrawalRequest({
      userId: 'user1',
      amount: 400,
      withdrawalType: WithdrawalType.FULL_100,
      paymentAccountId: 'acc1',
      paymentMethod: PaymentMethod.SEPA_VIREMENT,
      paymentDetails: {},
    })

    expect(req.status).toBe(WithdrawalStatus.PENDING)
  })

  it('requires ACCOUNT_VALIDATION when the account is not validated', async () => {
    paymentAccount.findUnique.mockResolvedValue({ id: 'acc1', isValidated: false })
    withdrawalRequest.create.mockImplementation(({ data }) => Promise.resolve({ id: 'w1', ...data }))

    const req = await createWithdrawalRequest({
      userId: 'user1',
      amount: 400,
      withdrawalType: WithdrawalType.FULL_100,
      paymentAccountId: 'acc1',
      paymentMethod: PaymentMethod.SEPA_VIREMENT,
      paymentDetails: {},
    })

    expect(req.status).toBe(WithdrawalStatus.ACCOUNT_VALIDATION)
  })

  it('requires ACCOUNT_VALIDATION when no account id is provided', async () => {
    withdrawalRequest.create.mockImplementation(({ data }) => Promise.resolve({ id: 'w1', ...data }))

    const req = await createWithdrawalRequest({
      userId: 'user1',
      amount: 400,
      withdrawalType: WithdrawalType.FULL_100,
      paymentMethod: PaymentMethod.SEPA_VIREMENT,
      paymentDetails: {},
    })

    expect(req.status).toBe(WithdrawalStatus.ACCOUNT_VALIDATION)
  })

  it('throws when the referenced payment account is not found', async () => {
    paymentAccount.findUnique.mockResolvedValue(null)

    await expect(
      createWithdrawalRequest({
        userId: 'user1',
        amount: 400,
        withdrawalType: WithdrawalType.FULL_100,
        paymentAccountId: 'missing',
        paymentMethod: PaymentMethod.SEPA_VIREMENT,
        paymentDetails: {},
      })
    ).rejects.toThrow('Compte de paiement introuvable')
  })
})

describe('cancelWithdrawalRequest', () => {
  it('throws when the request is not found', async () => {
    withdrawalRequest.findUnique.mockResolvedValue(null)
    await expect(cancelWithdrawalRequest('w1', 'user1')).rejects.toThrow(
      'Demande de retrait introuvable'
    )
  })

  it('throws when the caller does not own the request', async () => {
    withdrawalRequest.findUnique.mockResolvedValue({
      id: 'w1',
      userId: 'other',
      status: WithdrawalStatus.PENDING,
    })
    await expect(cancelWithdrawalRequest('w1', 'user1')).rejects.toThrow('Non autorisé')
  })

  it('throws when the request is already processed', async () => {
    withdrawalRequest.findUnique.mockResolvedValue({
      id: 'w1',
      userId: 'user1',
      status: WithdrawalStatus.APPROVED,
    })
    await expect(cancelWithdrawalRequest('w1', 'user1')).rejects.toThrow(
      "Impossible d'annuler une demande déjà traitée"
    )
  })

  it('cancels a pending request', async () => {
    withdrawalRequest.findUnique.mockResolvedValue({
      id: 'w1',
      userId: 'user1',
      status: WithdrawalStatus.PENDING,
    })
    withdrawalRequest.update.mockResolvedValue({ id: 'w1', status: WithdrawalStatus.CANCELLED })

    const result = await cancelWithdrawalRequest('w1', 'user1')

    expect(result.status).toBe(WithdrawalStatus.CANCELLED)
    expect(withdrawalRequest.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { status: WithdrawalStatus.CANCELLED },
    })
  })
})

describe('getWithdrawalStats', () => {
  it('returns the balance and a per-status breakdown', async () => {
    withdrawalRequest.groupBy.mockResolvedValue([
      { status: WithdrawalStatus.PAID, _count: 2, _sum: { amount: 300 } },
      { status: WithdrawalStatus.PENDING, _count: 1, _sum: { amount: null } },
    ])

    const stats = await getWithdrawalStats('user1')

    expect(stats.balance).toBeDefined()
    expect(stats.requests).toEqual([
      { status: WithdrawalStatus.PAID, count: 2, totalAmount: 300 },
      { status: WithdrawalStatus.PENDING, count: 1, totalAmount: 0 },
    ])
  })
})
