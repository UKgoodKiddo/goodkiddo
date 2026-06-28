import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, isChildModeConfigured } from "@/lib/env";

const COOKIE_NAME = "goodkiddo-child-mode";
const SELECTION_COOKIE_NAME = "goodkiddo-child-profile";

export type ChildModeSession = {
  childProfileId: string;
  deviceLabel?: string | null;
  familyId: string;
};

export type ChildModeSelection = {
  childProfileId: string;
};

function signPayload(payload: string) {
  return createHmac("sha256", env.CHILD_MODE_COOKIE_SECRET)
    .update(payload)
    .digest("base64url");
}

function serializeSession(session: ChildModeSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function parseSession(rawValue: string): ChildModeSession | null {
  const [payload, signature] = rawValue.split(".");

  if (!payload || !signature || !isChildModeConfigured()) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<ChildModeSession>;

    if (
      typeof parsed.childProfileId !== "string" ||
      typeof parsed.familyId !== "string"
    ) {
      return null;
    }

    return {
      childProfileId: parsed.childProfileId,
      deviceLabel:
        typeof parsed.deviceLabel === "string" ? parsed.deviceLabel : null,
      familyId: parsed.familyId,
    };
  } catch {
    return null;
  }
}

export async function readChildModeSession() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  return parseSession(rawValue);
}

export async function setChildModeSession(session: ChildModeSession) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function setChildModeSelection(selection: ChildModeSelection) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTION_COOKIE_NAME, selection.childProfileId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readChildModeSelection() {
  const cookieStore = await cookies();
  const explicitSelection = cookieStore.get(SELECTION_COOKIE_NAME)?.value;

  if (explicitSelection) {
    return explicitSelection;
  }

  const session = await readChildModeSession();
  return session?.childProfileId ?? null;
}

export async function clearChildModeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(SELECTION_COOKIE_NAME);
}

export async function resolveChildModeSessionForParent(params: {
  admin: ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdminClient>;
  parentSupabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>
  >;
  parentUserId: string;
}) {
  const { admin, parentSupabase, parentUserId } = params;
  const [session, selectedChildProfileId] = await Promise.all([
    readChildModeSession(),
    readChildModeSelection(),
  ]);

  if (session) {
    const [{ data: family }, { data: child }] = await Promise.all([
      parentSupabase
        .from("families")
        .select("id")
        .eq("id", session.familyId)
        .eq("parent_user_id", parentUserId)
        .maybeSingle(),
      admin
        .from("child_profiles")
        .select("id, family_id")
        .eq("id", session.childProfileId)
        .eq("family_id", session.familyId)
        .maybeSingle(),
    ]);

    if (family && child) {
      return {
        childProfileId: child.id,
        deviceLabel: session.deviceLabel ?? null,
        familyId: child.family_id,
      };
    }
  }

  if (!selectedChildProfileId) {
    return null;
  }

  const { data: family } = await parentSupabase
    .from("families")
    .select("id")
    .eq("parent_user_id", parentUserId)
    .maybeSingle();

  if (!family) {
    return null;
  }

  const { data: child } = await admin
    .from("child_profiles")
    .select("id, family_id")
    .eq("id", selectedChildProfileId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!child) {
    return null;
  }

  return {
    childProfileId: child.id,
    deviceLabel: null,
    familyId: child.family_id,
  };
}
