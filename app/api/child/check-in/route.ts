import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveChildModeSessionForParent } from "@/lib/child-mode";
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

  const admin = createSupabaseAdminClient();
  const deviceMode = await resolveChildModeSessionForParent({
    admin,
    parentSupabase,
    parentUserId: user.id,
  });

  if (!deviceMode) {
    return NextResponse.json({ ok: false, reason: "no-child-session" }, { status: 200 });
  }

  try {
    const result = await recordDailyChildCheckIn({
      actorUserId: user.id,
      admin,
      childProfileId: deviceMode.childProfileId,
      familyId: deviceMode.familyId,
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
