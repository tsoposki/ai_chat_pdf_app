import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import prismadb from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.client_reference_id) {
      return new NextResponse("Client reference ID is required", { status: 400 });
    }

    // Only process if this session has a subscription
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;

      await prismadb.subscription.upsert({
        where: {
          userId: session.client_reference_id,
        },
        create: {
          userId: session.client_reference_id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        }
      });
    }
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    if (!subscription.id) {
      return new NextResponse("Subscription ID is required", { status: 400 });
    }
    
    // Update subscription if it's still active
    await prismadb.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
      }
    });
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await prismadb.subscription.delete({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}