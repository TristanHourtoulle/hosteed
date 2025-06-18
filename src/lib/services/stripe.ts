import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  amount: number;
  currency?: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode?: 'payment';
  payment_intent_data?: {
    capture_method: 'manual';
  };
}

export const StripeService = {
  async createPaymentIntent({
    amount,
    currency = 'eur',
    metadata = {},
  }: CreatePaymentIntentParams) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency,
        capture_method: 'manual',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Erreur lors de la création du PaymentIntent:', error);
      return {
        success: false,
        error: 'Erreur lors de la création du paiement',
      };
    }
  },

  async capturePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      return {
        success: true,
        paymentIntent,
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
        e
      }
    }
  },

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du PaymentIntent:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération du paiement',
      };
    }
  },

  async RefundPaymentIntent(paymentIntentId: string) {
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      })
      return {
        success: true,
        paymentIntentId
      }
    } catch (e) {
      console.error('Erreur lors de la création du PaymentIntent:', e);
      return {
        success: false,
        error: 'Erreur lors de la création du paiement',
      };
    }
  },

  async createCheckoutSession({
    amount,
    currency = 'eur',
    productName,
    successUrl,
    cancelUrl,
    metadata = {},
  }: CreateCheckoutSessionParams) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: productName,
              },
              unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de la session de paiement',
      };
    }
  }
};
