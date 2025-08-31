import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prismadb from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prismadb.subscription.findUnique({
      where: { userId: user.id },
    });

    const nowMs = Date.now();
    const periodEndMs = subscription?.stripeCurrentPeriodEnd?.getTime() ?? 0;
    const isValid = Boolean(subscription?.stripePriceId) && periodEndMs > nowMs;

    return NextResponse.json({
      userId: user.id,
      subscription,
      now: new Date(nowMs).toISOString(),
      nowMs,
      isValid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
