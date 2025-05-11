import { NextResponse } from 'next/server';
import { createRent } from '@/lib/services/rents.service';
import Stripe from "stripe";
import {SendMail} from "@/lib/services/email.service";
import { prisma } from '@/lib/prisma';

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

    // Gestion des litiges
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntent = dispute.payment_intent as string;

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent }
      });

      console.log('Charge DISPUTE CREATED', paymentIntent, rent);
      if (rent) {
        const updatRequest = await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'CANCEL',
            payment: 'DISPUTE'
          }
        });
        console.log(updatRequest);
        if (rent.userId) {
          const user = await prisma.user.findUnique({
            where: { id: rent.userId }
          });
          if (user?.email) {
            await SendMail(
              user.email,
              "Paiement contesté",
              "Votre paiement a été contesté. Nous vous contacterons pour plus d'informations."
            );
          }
        }
      }
    }

    // Gestion des litiges résolus
    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntent = dispute.payment_intent as string;

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent }
      });

      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: dispute.status === 'won' ? 'RESERVED' : 'CANCEL',
            payment: dispute.status === 'won' ? 'CLIENT_PAID' : 'NOT_PAID'
          }
        });
      }
    }

    // Gestion des paiements réussis
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id }
      });

      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'RESERVED',
            payment: 'CLIENT_PAID'
          }
        });
      }
    }

    // Gestion des paiements échoués
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const rent = await prisma.rent.findFirst({
        where: { stripeId: paymentIntent.id }
      });

      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'CANCEL',
            payment: 'NOT_PAID'
          }
        });

        if (rent.userId) {
          const user = await prisma.user.findUnique({
            where: { id: rent.userId }
          });
          if (user?.email) {
            await SendMail(
              user.email,
              "Paiement échoué",
              "Votre paiement n'a pas pu être traité. Veuillez réessayer ou contacter notre service client."
            );
          }
        }
      }
    }

    // Gestion des remboursements
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;

      const rent = await prisma.rent.findFirst({
        where: { stripeId: charge.payment_intent as string }
      });

      if (rent) {
        await prisma.rent.update({
          where: { id: rent.id },
          data: {
            status: 'CANCEL',
            payment: 'REFUNDED'
          }
        });

        if (rent.userId) {
          const user = await prisma.user.findUnique({
            where: { id: rent.userId }
          });
          if (user?.email) {
            await SendMail(
              user.email,
              "Remboursement effectué",
              "Votre remboursement a été effectué avec succès."
            );
          }
        }
      }
    }

    // Gestion des sessions de paiement complétées
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.metadata?.productId || !session.metadata?.userId ||
          !session.metadata?.arrivingDate || !session.metadata?.leavingDate ||
          !session.metadata?.peopleNumber || !session.payment_intent || session.status != "complete") {
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
          stripeId: session.payment_intent.toString()
        });

        if (session.metadata.userEmail || session.metadata.productName) {
          await SendMail(
            session.metadata.userEmail,
            "Confirmation de demande de reservation",
            `Nous confirmons votre la bonne recepetion de votre demande de reservation pour ${session.metadata?.peopleNumber} personne dans l'hebergement ${session.metadata.productName}.`
          );
        }

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
