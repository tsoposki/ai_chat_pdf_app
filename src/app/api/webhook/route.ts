import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import prismadb from "@/lib/prisma";

export const runtime = "nodejs";

// Compute a Date by adding months/years to now without new deps
function addIntervalToNow(interval: "day" | "week" | "month" | "year", count: number): Date {
  const now = new Date();
  const d = new Date(now.getTime());
  if (interval === "day") {
    d.setDate(d.getDate() + count);
  } else if (interval === "week") {
    d.setDate(d.getDate() + 7 * count);
  } else if (interval === "month") {
    d.setMonth(d.getMonth() + count);
  } else if (interval === "year") {
    d.setFullYear(d.getFullYear() + count);
  }
  return d;
}

function getCurrentPeriodEndSec(subscription: any): number | undefined {
  return (
    subscription?.current_period_end ??
    subscription?.current_period?.end ??
    subscription?.trial_end ??
    undefined
  );
}

function computeFallbackPeriodEnd(subscription: any): Date | null {
  try {
    const price = subscription?.items?.data?.[0]?.price;
    const interval = price?.recurring?.interval as
      | "day"
      | "week"
      | "month"
      | "year"
      | undefined;
    const intervalCount = (price?.recurring?.interval_count as number | undefined) ?? 1;
    if (interval) {
      const end = addIntervalToNow(interval, intervalCount);
      try {
        console.log("[Stripe Webhook] Fallback period end computed", { interval, intervalCount, end });
      } catch {}
      return end;
    }
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  // Use raw body Buffer for Stripe signature verification
  const rawBody = await request.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);
  const hdrs = await headers();
  const signature = (hdrs.get("stripe-signature") || hdrs.get("Stripe-Signature")) as string | null;

  try {
    console.log("[Stripe Webhook] Hit /api/webhook", {
      hasSignature: Boolean(signature),
      bodyLength: bodyBuffer.length,
      contentType: hdrs.get("content-type"),
    });
  } catch {}

  let event: Stripe.Event;

  try {
    if (!signature) {
      try { console.error("[Stripe Webhook] Missing Stripe-Signature header"); } catch {}
      return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });
    }
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      try { console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET env var"); } catch {}
      return NextResponse.json({ error: "Server misconfigured: missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(bodyBuffer, signature, secret);
  } catch (error) {
    try {
      console.error("[Stripe Webhook] Invalid signature", { message: (error as any)?.message });
    } catch {}
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try { console.log("[Stripe Webhook] Event received:", event.type); } catch {}

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.client_reference_id) {
      try { console.error("[Stripe Webhook] Missing client_reference_id on session", { sessionId: session.id }); } catch {}
      return new NextResponse("Client reference ID is required", { status: 400 });
    }

    // Only process if this session has a subscription
    if (session.subscription) {
      const subscription = (await stripe.subscriptions.retrieve(
        session.subscription as string
      )) as any;

      let currentPeriodEndSec = getCurrentPeriodEndSec(subscription);
      if (!currentPeriodEndSec) {
        const fallback = computeFallbackPeriodEnd(subscription);
        currentPeriodEndSec = fallback ? Math.floor(fallback.getTime() / 1000) : undefined;
      }

      try {
        const priceId = subscription?.items?.data?.[0]?.price?.id;
        console.log("[Stripe Webhook] checkout.session.completed", {
          sessionId: session.id,
          userId: session.client_reference_id,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          currentPeriodEndSec,
        });
      } catch {}

      try {
        const periodEndDate = currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null;
        const priceId = subscription?.items?.data?.[0]?.price?.id as string | undefined;
        const result = await prismadb.subscription.upsert({
          where: {
            userId: session.client_reference_id,
          },
          create: {
            userId: session.client_reference_id,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId ?? null,
            stripeCurrentPeriodEnd: periodEndDate,
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId ?? null,
            stripeCurrentPeriodEnd: periodEndDate,
          },
        });
        try { console.log("[Stripe Webhook] Upserted subscription", { id: result.id, userId: result.userId, stripeCurrentPeriodEnd: result.stripeCurrentPeriodEnd }); } catch {}
      } catch (dbError: any) {
        try { console.error("[Stripe Webhook] DB upsert error", { message: dbError?.message }); } catch {}
        return new NextResponse("Database error", { status: 500 });
      }
    } else {
      try { console.log("[Stripe Webhook] Session had no subscription", { sessionId: session.id }); } catch {}
    }
  } else if (event.type === "customer.subscription.created") {
    const subscription = event.data.object as any;

    let currentPeriodEndSec = getCurrentPeriodEndSec(subscription);
    if (!currentPeriodEndSec) {
      const fallback = computeFallbackPeriodEnd(subscription);
      currentPeriodEndSec = fallback ? Math.floor(fallback.getTime() / 1000) : undefined;
    }

    try {
      console.log("[Stripe Webhook] customer.subscription.created", {
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId: subscription?.items?.data?.[0]?.price?.id,
        currentPeriodEndSec,
      });
    } catch {}

    try {
      const existing = await prismadb.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!existing) {
        try { console.log("[Stripe Webhook] No local record yet for created; will be upserted via checkout.session.completed", { subscriptionId: subscription.id }); } catch {}
      } else {
        const periodEndDate = currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null;
        const result = await prismadb.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription?.items?.data?.[0]?.price?.id ?? null,
            stripeCurrentPeriodEnd: periodEndDate,
          },
        });
        try { console.log("[Stripe Webhook] Updated existing subscription (created)", { id: result.id, userId: result.userId }); } catch {}
      }
    } catch (dbError: any) {
      try { console.error("[Stripe Webhook] DB op error (created)", { message: dbError?.message }); } catch {}
    }
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;

    if (!subscription.id) {
      try { console.error("[Stripe Webhook] Missing subscription.id on update event"); } catch {}
      return new NextResponse("Subscription ID is required", { status: 400 });
    }

    let currentPeriodEndSec = getCurrentPeriodEndSec(subscription);
    if (!currentPeriodEndSec) {
      const fallback = computeFallbackPeriodEnd(subscription);
      currentPeriodEndSec = fallback ? Math.floor(fallback.getTime() / 1000) : undefined;
    }

    try {
      console.log("[Stripe Webhook] customer.subscription.updated", {
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId: subscription?.items?.data?.[0]?.price?.id,
        currentPeriodEndSec,
      });
    } catch {}

    try {
      const periodEndDate = currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null;
      const result = await prismadb.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription?.items?.data?.[0]?.price?.id ?? null,
          stripeCurrentPeriodEnd: periodEndDate,
        },
      });
      try { console.log("[Stripe Webhook] Updated subscription", { id: result.id, userId: result.userId }); } catch {}
    } catch (dbError: any) {
      try { console.error("[Stripe Webhook] DB update error", { message: dbError?.message }); } catch {}
      return new NextResponse("Database error", { status: 500 });
    }
  } else if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = (invoice as any).subscription as string | null;
    if (!subId) {
      try { console.log("[Stripe Webhook] invoice.payment_succeeded without subscription"); } catch {}
    } else {
      const subscription = (await stripe.subscriptions.retrieve(subId)) as any;

      let currentPeriodEndSec = getCurrentPeriodEndSec(subscription);
      if (!currentPeriodEndSec) {
        const fallback = computeFallbackPeriodEnd(subscription);
        currentPeriodEndSec = fallback ? Math.floor(fallback.getTime() / 1000) : undefined;
      }

      try {
        console.log("[Stripe Webhook] invoice.payment_succeeded -> subscription", {
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription?.items?.data?.[0]?.price?.id,
          currentPeriodEndSec,
        });
      } catch {}

      try {
        const periodEndDate = currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null;
        const result = await prismadb.subscription.update({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            stripePriceId: subscription?.items?.data?.[0]?.price?.id ?? null,
            stripeCurrentPeriodEnd: periodEndDate,
          },
        });
        try { console.log("[Stripe Webhook] Updated subscription (invoice)", { id: result.id, userId: result.userId }); } catch {}
      } catch (dbError: any) {
        try { console.error("[Stripe Webhook] DB update error (invoice)", { message: dbError?.message }); } catch {}
      }
    }
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      console.log("[Stripe Webhook] customer.subscription.deleted", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch {}

    try {
      await prismadb.subscription.delete({
        where: {
          stripeSubscriptionId: subscription.id,
        },
      });
    } catch (dbError: any) {
      // It might already be deleted; do not fail the webhook
      try { console.error("[Stripe Webhook] DB delete error", { message: dbError?.message }); } catch {}
    }
  } else {
    try { console.log("[Stripe Webhook] Unhandled event type", { type: event.type }); } catch {}
  }

  return new NextResponse(null, { status: 200 });
}