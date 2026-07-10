import { NextResponse } from "next/server";
import { getStripeServerClient, getStripeWebhookSecret, isStripeConfigured, syncStripeSubscriptionFromWebhookEvent } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  try {
    const rawBody = await request.text();
    const stripe = getStripeServerClient();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );

    await syncStripeSubscriptionFromWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe webhook error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
