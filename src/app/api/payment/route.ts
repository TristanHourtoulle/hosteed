import { NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/stripe';

export async function POST(req: Request) {
  try {
    const { amount, currency, metadata } = await req.json();

    const result = await StripeService.createPaymentIntent({
      amount,
      currency,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
} 