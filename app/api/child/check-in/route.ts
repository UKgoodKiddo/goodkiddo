import { NextResponse } from "next/server";
import { z } from "zod";
import { readChildModeSession } from "@/lib/child-mode";
import { recordDailyChildCheckIn } from "@/lib/daily-bonus";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const checkInSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 200 });
  }

  const parsed = checkInSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid-date" }, { status: 400 });
  }

  const parentSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await parentSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "no-user" }, { status: 200 });
  }

  const session = await readChildModeSession();

  if (!session) {
    return NextResponse.json({ ok: false, reason: "no-child-session" }, { status: 200 });
  }

  const admin = createSupabaseAdminClient();
  const { data: deviceMode } = await admin
    .from("device_child_mode")
    .select("*")
    .eq("id", session.deviceId)
    .maybeSingle();

  if (!deviceMode) {
    return NextResponse.json({ ok: false, reason: "missing-device-mode" }, { status: 200 });
  }

  const { data: family } = await parentSupabase
    .from("families")
    .select("id")
    .eq("id", deviceMode.family_id)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    return NextResponse.json({ ok: false, reason: "family-mismatch" }, { status: 200 });
  }

  try {
    const result = await recordDailyChildCheckIn({
      actorUserId: user.id,
      admin,
      childProfileId: deviceMode.child_profile_id,
      familyId: deviceMode.family_id,
      localDate: parsed.data.localDate,
    });

    return NextResponse.json({
      awardedAmount: result.awardedAmount,
      createdCheckIn: result.createdCheckIn,
      daysChecked: result.daysChecked,
      ok: true,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "check-in-failed" }, { status: 500 });
  }
}
