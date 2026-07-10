import type {
  BooperPackStatus,
  FamilySubscription,
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
} from "@/lib/types";

export const PUBLIC_SUBSCRIPTION_PLANS = [
  "monthly_family_plus",
  "yearly_family_plus",
] as const satisfies readonly SubscriptionPlan[];

export const SUBSCRIPTION_PLAN_OPTIONS: Array<{
  booperPackIncluded: boolean;
  description: string;
  id: Exclude<SubscriptionPlan, "beta_1_0">;
  label: string;
  priceLabel: string;
}> = [
  {
    booperPackIncluded: true,
    description: "£3.99/month plus a £9.99 one-time Booper Starter Pack with 4 Boopers.",
    id: "monthly_family_plus",
    label: "Monthly Family+",
    priceLabel: "£13.98 today, then £3.99/month",
  },
  {
    booperPackIncluded: true,
    description: "£39.99/year and includes 4 free Boopers in the plan.",
    id: "yearly_family_plus",
    label: "Yearly Family+",
    priceLabel: "£39.99/year",
  },
];

export const BOOPER_PACK_STATUS_OPTIONS: BooperPackStatus[] = [
  "pending",
  "packed",
  "shipped",
  "delivered",
];

export const SUBSCRIPTION_PROVIDER_OPTIONS: SubscriptionProvider[] = [
  "stripe",
  "manual",
];

export const SUBSCRIPTION_STATUS_OPTIONS: SubscriptionStatus[] = [
  "inactive",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
  "canceled",
];

export function formatSubscriptionPlan(plan: string | null | undefined) {
  switch (plan) {
    case "monthly_family_plus":
      return "Monthly Family+";
    case "yearly_family_plus":
      return "Yearly Family+";
    case "beta_1_0":
      return "Beta 1.0";
    default:
      return "No plan";
  }
}

export function formatSubscriptionStatusLabel(value: string | null | undefined) {
  switch (value) {
    case "trialing":
      return "Trialing";
    case "past_due":
      return "Past due";
    case "incomplete_expired":
      return "Incomplete expired";
    case "inactive":
      return "Inactive";
    case "canceled":
      return "Canceled";
    default:
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";
  }
}

export function formatBooperPackStatus(value: string | null | undefined) {
  if (!value) {
    return "Not required";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function familyHasChosenPlan(subscription: FamilySubscription | null | undefined) {
  return Boolean(subscription?.subscription_plan);
}

export function familyHasActiveSubscription(
  subscription: FamilySubscription | null | undefined,
) {
  if (!subscription?.subscription_plan) {
    return false;
  }

  return (
    subscription.subscription_status === "active" ||
    subscription.subscription_status === "trialing"
  );
}

export function subscriptionNeedsPlanSelection(subscription: FamilySubscription | null | undefined) {
  return !familyHasActiveSubscription(subscription);
}

export function getDefaultBooperPackStatus(
  plan: SubscriptionPlan,
  existingStatus?: BooperPackStatus | null,
) {
  if (existingStatus) {
    return existingStatus;
  }

  return plan === "monthly_family_plus" || plan === "yearly_family_plus" ? "pending" : null;
}
