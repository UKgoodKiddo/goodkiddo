import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

function normalizeUid(value: string) {
  return value.trim().toUpperCase();
}

export async function readNfcUid(manualUid?: string) {
  return {
    mode: "manual-entry" as const,
    nfc_uid: manualUid ? normalizeUid(manualUid) : null,
    message:
      "NFC hardware is not wired yet, so development uses manual UID entry.",
  };
}

export async function pairBooperToChild(
  supabase: SupabaseClient<Database>,
  nfc_uid: string,
  child_profile_id: string | null,
) {
  const normalizedUid = normalizeUid(nfc_uid);

  const { data, error } = await supabase
    .from("boopers")
    .update({ child_profile_id })
    .eq("nfc_uid", normalizedUid)
    .select("id, nfc_uid, child_profile_id")
    .single();

  return {
    booper: data ?? null,
    error,
    nfc_uid: normalizedUid,
    placeholder: true,
  };
}

export async function awardBoopFromNfc(
  supabase: SupabaseClient<Database>,
  nfc_uid: string,
  amount: number,
  reason: string,
  created_by: string,
  family_id: string,
) {
  const normalizedUid = normalizeUid(nfc_uid);

  const { data: inventoryBooper, error: booperError } = await supabase
    .from("booper_inventory")
    .select("id, child_profile_id, status")
    .eq("family_id", family_id)
    .eq("uid", normalizedUid)
    .maybeSingle();

  if (
    booperError ||
    !inventoryBooper?.child_profile_id ||
    inventoryBooper.status !== "assigned"
  ) {
    return {
      error:
        booperError ??
        new Error("No assigned imported Booper is paired to a child for this UID."),
      nfc_uid: normalizedUid,
      placeholder: true,
      transaction: null,
    };
  }

  const { data: pendingAward, error } = await supabase
    .from("pending_boop_awards")
    .insert({
      amount,
      child_profile_id: inventoryBooper.child_profile_id,
      awarded_by: created_by,
      source_type: "nfc_award",
      family_id,
      reason,
    })
    .select("id, child_profile_id, amount, reason")
    .single();

  return {
    error,
    nfc_uid: normalizedUid,
    placeholder: true,
    transaction: pendingAward ?? null,
  };
}
