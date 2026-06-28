import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  readChildModeSelection,
  readChildModeSession,
} from "@/lib/child-mode";
import { buildChildStatusPath, CHILD_PAGE_ROUTES } from "@/lib/child-ui";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const rewardRequestSchema = z.object({
  rewardId: z.uuid(),
  returnTo: z.enum(CHILD_PAGE_ROUTES).optional(),
});

function revalidateParentWorkspace() {
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  revalidatePath("/parent/tasks");
  revalidatePath("/parent/approvals");
  revalidatePath("/parent/rewards");
  revalidatePath("/parent/boopers");
}

function revalidateChildWorkspace() {
  revalidatePath("/child");
  revalidatePath("/child/collect");
  revalidatePath("/child/rewards");
  revalidatePath("/child/activity");
  revalidatePath("/child/profile");
}

export async function POST(request: Request) {
  const parsed = rewardRequestSchema.safeParse(await request.json());
  const returnTo = parsed.success ? (parsed.data.returnTo ?? "/child") : "/child";

  if (!parsed.success || !isSupabaseConfigured() || !isChildModeConfigured()) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "action-failed"),
    });
  }

  const parentSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await parentSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      ok: false,
      redirectTo: "/auth/login",
    });
  }

  const admin = createSupabaseAdminClient();
  const [session, selectedChildProfileId] = await Promise.all([
    readChildModeSession(),
    readChildModeSelection(),
  ]);

  let familyId: string | null = null;
  let childProfileId: string | null = null;

  if (session) {
    const { data: deviceMode } = await admin
      .from("device_child_mode")
      .select("family_id, child_profile_id")
      .eq("id", session.deviceId)
      .maybeSingle();

    if (deviceMode) {
      familyId = deviceMode.family_id;
      childProfileId = deviceMode.child_profile_id;
    }
  }

  if ((!familyId || !childProfileId) && selectedChildProfileId) {
    const { data: family } = await parentSupabase
      .from("families")
      .select("id")
      .eq("parent_user_id", user.id)
      .maybeSingle();

    if (family) {
      const { data: child } = await admin
        .from("child_profiles")
        .select("id, family_id")
        .eq("id", selectedChildProfileId)
        .eq("family_id", family.id)
        .maybeSingle();

      if (child) {
        familyId = child.family_id;
        childProfileId = child.id;
      }
    }
  }

  if (!familyId || !childProfileId) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "child-mode-required"),
    });
  }

  const { data: reward } = await admin
    .from("rewards")
    .select("*")
    .eq("id", parsed.data.rewardId)
    .eq("family_id", familyId)
    .eq("active", true)
    .maybeSingle();

  if (!reward) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "action-failed"),
    });
  }

  const { data: transactionRows, error: transactionError } = await admin
    .from("boop_transactions")
    .select("amount")
    .eq("child_profile_id", childProfileId);

  if (transactionError) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "action-failed"),
    });
  }

  const availableBoops = (transactionRows ?? []).reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  if (availableBoops < reward.cost) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "not-enough-boops"),
    });
  }

  const { error } = await admin.from("redemptions").insert({
    child_profile_id: childProfileId,
    cost_at_redemption: reward.cost,
    family_id: familyId,
    reward_id: reward.id,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({
      ok: false,
      redirectTo: buildChildStatusPath(returnTo, "action-failed"),
    });
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();

  return NextResponse.json({
    ok: true,
    redirectTo: buildChildStatusPath(returnTo, "reward-requested"),
  });
}
