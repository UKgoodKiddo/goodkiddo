import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatBoops(value: number) {
  return `${value} boop${value === 1 ? "" : "s"}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function formatDateTimeDetailed(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatRecurringType(value: "none" | "daily" | "weekly") {
  switch (value) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    default:
      return "One-time";
  }
}

export function formatSubscriptionStatus(
  value:
    | "inactive"
    | "trialing"
    | "active"
    | "past_due"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "paused"
    | "canceled",
) {
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
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

export function formatInventoryStatus(
  value: "available" | "assigned" | "lost" | "disabled" | "retired",
) {
  switch (value) {
    case "available":
      return "Available";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
