import { NextResponse } from 'next/server';
import { createRent } from '@/lib/services/rents.service';
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session complétée:', session);

      // Créer la réservation
      const rent = await createRent({
        productId: session.metadata?.productId!,
        userId: session.metadata?.userId!,
        arrivingDate: new Date(session.metadata?.arrivingDate!),
        leavingDate: new Date(session.metadata?.leavingDate!),
        peopleNumber: parseInt(session.metadata?.peopleNumber!),
        options: session.metadata?.options ? JSON.parse(session.metadata.options) : [],
      });

      console.log('Réservation créée:', rent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json(
      { error: 'Erreur webhook' },
      { status: 400 }
    );
  }
}
