import "server-only";

import Stripe from "stripe";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { getDefaultBooperPackStatus } from "@/lib/subscriptions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  Database,
  FamilySubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/types";

let stripeClient: Stripe | null = null;

type FamilySubscriptionInsert =
  Database["public"]["Tables"]["family_subscriptions"]["Insert"];

const MONTHLY_PRICE_PENCE = 399;
const MONTHLY_STARTER_PACK_PENCE = 999;
const YEARLY_PRICE_PENCE = 3999;
const STRIPE_CURRENCY = "gbp";

type StripeCatalogProductConfig = {
  amountPence: number;
  description: string;
  name: string;
  recurringInterval?: "month" | "year";
  slug:
    | "monthly_family_plus"
    | "monthly_family_plus_starter_pack"
    | "yearly_family_plus";
};

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripeServerClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  return env.STRIPE_WEBHOOK_SECRET;
}

export function buildCheckoutSuccessUrl() {
  return `${getSiteUrl()}/parent/plan/success?session_id={CHECKOUT_SESSION_ID}`;
}

export function buildCheckoutCancelUrl() {
  return `${getSiteUrl()}/parent/plan?status=checkout-cancelled`;
}

export function buildStripeBillingPortalReturnUrl() {
  return `${getSiteUrl()}/parent/settings`;
}

const STRIPE_CATALOG_PRODUCTS: Record<
  StripeCatalogProductConfig["slug"],
  StripeCatalogProductConfig
> = {
  monthly_family_plus: {
    amountPence: MONTHLY_PRICE_PENCE,
    description: "Monthly Family+ access for one family account.",
    name: "Monthly Family+",
    recurringInterval: "month",
    slug: "monthly_family_plus",
  },
  monthly_family_plus_starter_pack: {
    amountPence: MONTHLY_STARTER_PACK_PENCE,
    description: "Starter pack with 4 Boopers for your first family setup.",
    name: "Booper Starter Pack",
    slug: "monthly_family_plus_starter_pack",
  },
  yearly_family_plus: {
    amountPence: YEARLY_PRICE_PENCE,
    description: "Yearly Family+ access and 4 included Boopers.",
    name: "Yearly Family+",
    recurringInterval: "year",
    slug: "yearly_family_plus",
  },
};

async function getOrCreateGoodKiddoProduct(
  config: StripeCatalogProductConfig,
) {
  const stripe = getStripeServerClient();
  const existingProducts = await stripe.products.list({
    limit: 100,
  });

  const existing = existingProducts.data.find(
    (product) => product.metadata?.goodkiddo_catalog_slug === config.slug,
  );

  if (existing) {
    const needsUpdate =
      !existing.active ||
      existing.name !== config.name ||
      existing.description !== config.description;

    if (!needsUpdate) {
      return existing;
    }

    return stripe.products.update(existing.id, {
      active: true,
      description: config.description,
      metadata: {
        ...existing.metadata,
        goodkiddo_catalog_slug: config.slug,
      },
      name: config.name,
    });
  }

  return stripe.products.create({
    active: true,
    description: config.description,
    metadata: {
      goodkiddo_catalog_slug: config.slug,
    },
    name: config.name,
  });
}

function doesPriceMatchCatalogConfig(
  price: Stripe.Price,
  config: StripeCatalogProductConfig,
) {
  const recurringInterval = price.recurring?.interval ?? null;
  const expectedInterval = config.recurringInterval ?? null;

  return (
    price.active &&
    price.currency === STRIPE_CURRENCY &&
    price.type === (expectedInterval ? "recurring" : "one_time") &&
    price.unit_amount === config.amountPence &&
    recurringInterval === expectedInterval
  );
}

async function getOrCreateGoodKiddoPrice(
  config: StripeCatalogProductConfig,
) {
  const stripe = getStripeServerClient();
  const product = await getOrCreateGoodKiddoProduct(config);
  const existingPrices = await stripe.prices.list({
    active: true,
    limit: 100,
    product: product.id,
  });

  const existing = existingPrices.data.find((price) =>
    doesPriceMatchCatalogConfig(price, config),
  );

  if (existing) {
    return existing;
  }

  return stripe.prices.create({
    currency: STRIPE_CURRENCY,
    metadata: {
      goodkiddo_catalog_slug: config.slug,
    },
    product: product.id,
    recurring: config.recurringInterval
      ? {
          interval: config.recurringInterval,
        }
      : undefined,
    unit_amount: config.amountPence,
  });
}

async function getOrCreateGoodKiddoPortalConfigurationId() {
  const stripe = getStripeServerClient();

  const existingConfigurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });

  const existing = existingConfigurations.data.find(
    (configuration) =>
      configuration.metadata?.goodkiddo_portal_type === "parent-settings",
  );

  if (existing) {
    return existing.id;
  }

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your goodKiddo Family+ billing details.",
    },
    default_return_url: buildStripeBillingPortalReturnUrl(),
    features: {
      customer_update: {
        enabled: false,
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: false,
      },
      subscription_update: {
        enabled: false,
      },
    },
    metadata: {
      goodkiddo_portal_type: "parent-settings",
    },
    name: "goodKiddo Parent Billing Portal",
  });

  return configuration.id;
}

export async function buildPlanLineItems(
  plan: Exclude<SubscriptionPlan, "beta_1_0">,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  if (plan === "monthly_family_plus") {
    const monthlyPrice = await getOrCreateGoodKiddoPrice(
      STRIPE_CATALOG_PRODUCTS.monthly_family_plus,
    );
    const starterPackPrice = await getOrCreateGoodKiddoPrice(
      STRIPE_CATALOG_PRODUCTS.monthly_family_plus_starter_pack,
    );

    return [
      {
        price: monthlyPrice.id,
        quantity: 1,
      },
      {
        price: starterPackPrice.id,
        quantity: 1,
      },
    ];
  }

  const yearlyPrice = await getOrCreateGoodKiddoPrice(
    STRIPE_CATALOG_PRODUCTS.yearly_family_plus,
  );

  return [
    {
      price: yearlyPrice.id,
      quantity: 1,
    },
  ];
}

export async function createStripeCheckoutSession(input: {
  existingCustomerId?: string | null;
  familyId: string;
  familyName: string;
  plan: Exclude<SubscriptionPlan, "beta_1_0">;
  userEmail?: string | null;
}) {
  const stripe = getStripeServerClient();
  const lineItems = await buildPlanLineItems(input.plan);

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    cancel_url: buildCheckoutCancelUrl(),
    client_reference_id: input.familyId,
    customer: input.existingCustomerId || undefined,
    customer_email: input.existingCustomerId ? undefined : input.userEmail ?? undefined,
    line_items: lineItems,
    locale: "en-GB",
    metadata: {
      booper_pack_included: "true",
      family_id: input.familyId,
      family_name: input.familyName,
      subscription_plan: input.plan,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        family_id: input.familyId,
        subscription_plan: input.plan,
      },
    },
    success_url: buildCheckoutSuccessUrl(),
  });

  return session;
}

export async function createStripeBillingPortalSession(input: {
  stripeCustomerId: string;
}) {
  const stripe = getStripeServerClient();
  const configuration = await getOrCreateGoodKiddoPortalConfigurationId();

  const session = await stripe.billingPortal.sessions.create({
    configuration,
    customer: input.stripeCustomerId,
    locale: "en-GB",
    return_url: buildStripeBillingPortalReturnUrl(),
  });

  return session;
}

export async function updateStripeSubscriptionCancelAtPeriodEnd(input: {
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
}) {
  const stripe = getStripeServerClient();

  const subscription = await stripe.subscriptions.update(
    input.stripeSubscriptionId,
    {
      cancel_at_period_end: input.cancelAtPeriodEnd,
    },
  );

  await syncStripeSubscription({ subscription });

  return subscription;
}

function mapStripeStatusToLegacyStatus(status: SubscriptionStatus) {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    case "inactive":
    default:
      return "trial";
  }
}

function mapStripeSubscriptionStatus(
  value: Stripe.Subscription.Status | null | undefined,
): SubscriptionStatus {
  switch (value) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

function unixToIso(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.current_period_end ?? null;
}

async function findExistingSubscription(input: {
  familyId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const admin = createSupabaseAdminClient();

  if (input.familyId) {
    const result = await admin
      .from("family_subscriptions")
      .select("*")
      .eq("family_id", input.familyId)
      .maybeSingle();

    return (result.data ?? null) as FamilySubscription | null;
  }

  if (input.stripeSubscriptionId) {
    const result = await admin
      .from("family_subscriptions")
      .select("*")
      .eq("stripe_subscription_id", input.stripeSubscriptionId)
      .maybeSingle();

    return (result.data ?? null) as FamilySubscription | null;
  }

  if (input.stripeCustomerId) {
    const result = await admin
      .from("family_subscriptions")
      .select("*")
      .eq("stripe_customer_id", input.stripeCustomerId)
      .maybeSingle();

    return (result.data ?? null) as FamilySubscription | null;
  }

  return null;
}

export async function upsertFamilySubscriptionRecord(
  patch: FamilySubscriptionInsert,
) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("family_subscriptions").upsert(patch, {
    onConflict: "family_id",
  });

  if (error) {
    throw error;
  }
}

export async function syncStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.mode !== "subscription") {
    throw new Error("Unexpected Stripe Checkout mode.");
  }

  const familyId = session.metadata?.family_id ?? session.client_reference_id ?? null;
  const subscriptionPlan = session.metadata?.subscription_plan as SubscriptionPlan | undefined;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (!familyId || !subscriptionPlan || !subscriptionId) {
    throw new Error("Missing Stripe Checkout metadata for family subscription sync.");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncStripeSubscription({
    familyId,
    subscription,
  });
}

export async function syncStripeSubscription(input: {
  familyId?: string | null;
  subscription: Stripe.Subscription;
}) {
  const plan = (input.subscription.metadata?.subscription_plan ?? null) as SubscriptionPlan | null;
  const familyId = input.familyId ?? input.subscription.metadata?.family_id ?? null;
  const customerId =
    typeof input.subscription.customer === "string"
      ? input.subscription.customer
      : input.subscription.customer?.id ?? null;

  const existing = await findExistingSubscription({
    familyId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: input.subscription.id,
  });

  const resolvedFamilyId = familyId ?? existing?.family_id ?? null;
  const existingPlan =
    existing?.subscription_plan === "monthly_family_plus" ||
    existing?.subscription_plan === "yearly_family_plus" ||
    existing?.subscription_plan === "beta_1_0"
      ? existing.subscription_plan
      : null;
  const resolvedPlan: SubscriptionPlan | null = plan ?? existingPlan;

  if (!resolvedFamilyId || !resolvedPlan) {
    throw new Error("Could not resolve the family or plan for this Stripe subscription.");
  }

  const status = mapStripeSubscriptionStatus(input.subscription.status);
  const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(input.subscription);
  const packStatus = getDefaultBooperPackStatus(
    resolvedPlan,
    existing?.booper_pack_status ?? null,
  );

  await upsertFamilySubscriptionRecord({
    family_id: resolvedFamilyId,
    plan_code: resolvedPlan,
    provider_customer_id: customerId,
    provider_subscription_id: input.subscription.id,
    renewal_date: unixToIso(currentPeriodEnd),
    status: mapStripeStatusToLegacyStatus(status),
    subscription_current_period_end: unixToIso(currentPeriodEnd),
    subscription_plan: resolvedPlan,
    subscription_provider: "stripe",
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: input.subscription.id,
    subscription_cancel_at_period_end: input.subscription.cancel_at_period_end,
    booper_pack_included: resolvedPlan !== "beta_1_0",
    booper_pack_status: resolvedPlan === "beta_1_0" ? null : packStatus,
  });
}

export async function syncStripeSubscriptionFromWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.id) {
        await syncStripeCheckoutSession(session.id);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscription({ subscription });
      return;
    }
    default:
      return;
  }
}
