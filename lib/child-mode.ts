import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, isChildModeConfigured } from "@/lib/env";

const COOKIE_NAME = "goodkiddo-child-mode";
const SELECTION_COOKIE_NAME = "goodkiddo-child-profile";

type ChildModeSession = {
  deviceId: string;
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
    ) as ChildModeSession;

    if (!parsed.deviceId) {
      return null;
    }

    return parsed;
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
  return cookieStore.get(SELECTION_COOKIE_NAME)?.value ?? null;
}

export async function clearChildModeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(SELECTION_COOKIE_NAME);
}
