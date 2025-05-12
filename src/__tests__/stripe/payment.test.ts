import { loadStripe } from '@stripe/stripe-js';

describe('Stripe Payment Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Stripe with correct public key', async () => {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    expect(stripe).toBeDefined();
  });

  it('should create a payment method', async () => {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    const mockPaymentMethod = {
      id: 'pm_test_123',
      card: {
        brand: 'visa',
        last4: '4242',
      },
    };

    (stripe?.createPaymentMethod as jest.Mock).mockResolvedValueOnce({
      paymentMethod: mockPaymentMethod,
      error: null,
    });

    const result = await stripe?.createPaymentMethod({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2024,
        cvc: '123',
      },
    });

    expect(result?.paymentMethod).toEqual(mockPaymentMethod);
    expect(result?.error).toBeNull();
  });

  it('should handle payment confirmation', async () => {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    const mockPaymentIntent = {
      id: 'pi_test_123',
      status: 'succeeded',
    };

    (stripe?.confirmCardPayment as jest.Mock).mockResolvedValueOnce({
      paymentIntent: mockPaymentIntent,
      error: null,
    });

    const result = await stripe?.confirmCardPayment('client_secret_123', {
      payment_method: {
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2024,
          cvc: '123',
        },
      },
    });

    expect(result?.paymentIntent).toEqual(mockPaymentIntent);
    expect(result?.error).toBeNull();
  });

  it('should handle payment errors', async () => {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    const mockError = {
      type: 'card_error',
      message: 'Your card was declined.',
    };

    (stripe?.confirmCardPayment as jest.Mock).mockResolvedValueOnce({
      paymentIntent: null,
      error: mockError,
    });

    const result = await stripe?.confirmCardPayment('client_secret_123', {
      payment_method: {
        card: {
          number: '4000000000000002', // Test card that will be declined
          exp_month: 12,
          exp_year: 2024,
          cvc: '123',
        },
      },
    });

    expect(result?.paymentIntent).toBeNull();
    expect(result?.error).toEqual(mockError);
  });
}); 