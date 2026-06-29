import { NextResponse } from "next/server";
import { z } from "zod";
import {
  setChildModeSelection,
  setChildModeSession,
} from "@/lib/child-mode";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";

const restoreSessionSchema = z.object({
  childProfileId: z.uuid(),
  familyId: z.uuid(),
});

const restoreSessionRedirectSchema = restoreSessionSchema.extend({
  returnTo: z.string().trim().min(1).max(512).optional(),
});

function buildRedirectTarget(
  request: Request,
  returnTo: string | undefined,
  status: string,
) {
  const fallbackUrl = new URL("/child", request.url);

  let targetUrl: URL;
  try {
    targetUrl = returnTo ? new URL(returnTo, request.url) : fallbackUrl;
  } catch {
    targetUrl = fallbackUrl;
  }

  if (!targetUrl.pathname.startsWith("/child")) {
    targetUrl = fallbackUrl;
  }

  targetUrl.searchParams.set("status", status);
  return targetUrl;
}

async function restoreChildModeSession(params: {
  childProfileId: string;
  familyId: string;
}) {
  const { childProfileId, familyId } = params;

  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "not-authenticated" }, { status: 401 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("id", familyId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    return NextResponse.json({ ok: false, reason: "family-not-found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data: child } = await admin
    .from("child_profiles")
    .select("id, family_id")
    .eq("id", childProfileId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ ok: false, reason: "child-not-found" }, { status: 404 });
  }

  await setChildModeSession({
    childProfileId: child.id,
    deviceLabel: "Restored child mode",
    familyId: family.id,
  });
  await setChildModeSelection({ childProfileId: child.id });

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const parsed = restoreSessionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid-payload" }, { status: 400 });
  }

  return restoreChildModeSession({
    childProfileId: parsed.data.childProfileId,
    familyId: parsed.data.familyId,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? undefined;
  const parsed = restoreSessionRedirectSchema.safeParse({
    childProfileId: url.searchParams.get("childProfileId"),
    familyId: url.searchParams.get("familyId"),
    returnTo,
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      buildRedirectTarget(request, returnTo, "child-mode-required"),
    );
  }

  const restoreResult = await restoreChildModeSession({
    childProfileId: parsed.data.childProfileId,
    familyId: parsed.data.familyId,
  });

  if (restoreResult.ok) {
    return NextResponse.redirect(
      buildRedirectTarget(request, parsed.data.returnTo, "child-mode-ready"),
    );
  }

  return NextResponse.redirect(
    buildRedirectTarget(request, parsed.data.returnTo, "child-mode-required"),
  );
}
