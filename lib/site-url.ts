import { env } from "@/lib/env";

const FALLBACK_SITE_URL = "https://www.goodkiddo.co.uk";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return FALLBACK_SITE_URL;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getSiteUrl() {
  return normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL);
}

export function getBooperBaseUrl() {
  return `${getSiteUrl()}/b`;
}
