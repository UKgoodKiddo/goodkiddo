import "server-only";

import type { BooperInventory } from "@/lib/types";

function escapeCsvValue(value: string) {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export function normalizeTagWriterBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  const parsed = new URL(trimmed);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("The TagWriter base URL must start with http:// or https://.");
  }

  return trimmed;
}

export function resolveTagWriterUrl(item: Pick<BooperInventory, "ndef_url" | "uid">, baseUrl: string) {
  return item.ndef_url?.trim() || `${baseUrl}/${item.uid}`;
}

export function buildTagWriterLinkCsv(
  inventory: Pick<BooperInventory, "ndef_text" | "ndef_url" | "serial_label" | "uid">[],
  baseUrl: string,
) {
  return inventory
    .map((item) => {
      const url = resolveTagWriterUrl(item, baseUrl);
      const description = item.ndef_text?.trim() || item.serial_label || item.uid;

      return [
        "LINK_RECORD",
        url,
        "URL",
        description,
      ]
        .map(escapeCsvValue)
        .join(",");
    })
    .join("\r\n");
}
