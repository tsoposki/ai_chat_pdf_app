import { currentUser } from "@clerk/nextjs/server";
import prismadb from "./prisma";
import { stripe } from "./stripe";

export const isValidSubscription = async () => { 
  const user = await currentUser();

  if (!user) return false;

  const subscription = await prismadb.subscription.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
    }
  });

  if (!subscription) return false;

  const isValid = Boolean(
    subscription.stripePriceId &&
    subscription.stripeCurrentPeriodEnd?.getTime()! > Date.now()
  );

  return isValid;
}

export const generateBillingPortalLink = async () => {
  const user = await currentUser();

  if (!user) return null;

  const subscription = await prismadb.subscription.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (subscription && subscription.stripeCustomerId) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/documents`,
    });

    return stripeSession.url;
  }

  return null;
}

const MAX_FREE_DOCUMENTS = 1;

export const isMaxFreeDocuments = async () => {
  const user = await currentUser();

  if (!user) return false;

  const doucments = await prismadb.document.findMany({
    where: {
      userId: user.id,
    },
  });

  return doucments?.length >= MAX_FREE_DOCUMENTS;
}

export const needToUpgrade = async () => {
  const user = await currentUser();

  if (!user) return false;

  const isSubscribed = await isValidSubscription();
  const reachedFreeQuota = await isMaxFreeDocuments();

  if (!isSubscribed) return reachedFreeQuota;

  return false;
}