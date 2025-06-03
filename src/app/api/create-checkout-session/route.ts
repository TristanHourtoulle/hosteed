import { NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/stripe';

export async function POST(req: Request) {
  try {
    const { amount, productName, metadata } = await req.json();

    const result = await StripeService.createCheckoutSession({
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
      },
      amount,
      productName,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/product/${metadata.productId}/reservation`,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
