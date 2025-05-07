import { NextResponse } from 'next/server';
import { createRent } from '@/lib/services/rents.service';
import Stripe from "stripe";
import {SendMail} from "@/lib/services/email.service";

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

      console.log('Métadonnées de la session Stripe:', {
        productId: session.metadata?.productId,
        userId: session.metadata?.userId,
        arrivingDate: session.metadata?.arrivingDate,
        leavingDate: session.metadata?.leavingDate,
        peopleNumber: session.metadata?.peopleNumber,
        options: session.metadata?.options
      });
      if (!session.metadata?.productId || !session.metadata?.userId ||
          !session.metadata?.arrivingDate || !session.metadata?.leavingDate ||
          !session.metadata?.peopleNumber || !session.id || session.status != "complete") {
        console.error('Métadonnées manquantes dans la session Stripe:', session.metadata);
        return NextResponse.json(
          { error: 'Métadonnées manquantes' },
          { status: 400 }
        );
      }
      try {
        const rent = await createRent({
          productId: session.metadata.productId,
          userId: session.metadata.userId,
          arrivingDate: new Date(session.metadata.arrivingDate),
          leavingDate: new Date(session.metadata.leavingDate),
          peopleNumber: parseInt(session.metadata.peopleNumber),
          options: session.metadata.options ? JSON.parse(session.metadata.options) : [],
          stripeId: session.id
        });
        console.log(session.metadata.userEmail, session.metadata.productName);
        if (session.metadata.userEmail || session.metadata.productName)
           await SendMail(session.metadata.userEmail, "Confirmation de demande de reservation", `Nous confirmons votre la bonne recepetion de votre demande de reservation pour ${session.metadata?.peopleNumber} personne dans l'hebergement ${session.metadata.productName}.`);
        if (!rent) {
          console.error('Échec de la création de la réservation');
          return NextResponse.json(
            { error: 'Échec de la création de la réservation' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation' },
          { status: 500 }
        );
      }
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
