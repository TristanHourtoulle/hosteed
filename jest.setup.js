require('@testing-library/jest-dom')

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() =>
    Promise.resolve({
      createPaymentMethod: jest.fn(),
      confirmCardPayment: jest.fn(),
      createToken: jest.fn(),
    })
  ),
}))
