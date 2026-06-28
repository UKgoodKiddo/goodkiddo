import { NextResponse } from "next/server";
import { z } from "zod";
import {
  setChildModeSelection,
  setChildModeSession,
} from "@/lib/child-mode";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const restoreSessionSchema = z.object({
  childProfileId: z.uuid(),
  familyId: z.uuid(),
});

export async function POST(request: Request) {
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

  const parsed = restoreSessionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid-payload" }, { status: 400 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("id", parsed.data.familyId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    return NextResponse.json({ ok: false, reason: "family-not-found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data: child } = await admin
    .from("child_profiles")
    .select("id, family_id")
    .eq("id", parsed.data.childProfileId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ ok: false, reason: "child-not-found" }, { status: 404 });
  }

  const { data: deviceMode, error } = await supabase
    .from("device_child_mode")
    .insert({
      child_profile_id: child.id,
      device_label: "Restored child mode",
      family_id: family.id,
    })
    .select("id")
    .single();

  if (error || !deviceMode) {
    return NextResponse.json({ ok: false, reason: "device-mode-failed" }, { status: 500 });
  }

  await setChildModeSession({ deviceId: deviceMode.id });
  await setChildModeSelection({ childProfileId: child.id });

  return NextResponse.json({ ok: true });
}
