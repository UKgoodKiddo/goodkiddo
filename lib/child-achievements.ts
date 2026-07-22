import "server-only";

import { demoChildMode } from "@/lib/demo-data";
import {
  ACHIEVEMENT_DEFINITION_MAP,
  FINAL_ACHIEVEMENT_ID,
  isAchievementId,
  STANDARD_ACHIEVEMENT_IDS,
  STANDARD_BADGE_COUNT,
  type AchievementId,
} from "@/lib/achievement-definitions";
import { resolveChildModeSessionForParent } from "@/lib/child-mode";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { ChildAchievement, ChildProfile } from "@/lib/types";

export type AchievementPreviewMode =
  | "all-locked"
  | "some-unlocked"
  | "all-standard"
  | "super-boop";

export type ChildAchievementsPageData = {
  assigned: boolean;
  canUnlockSuperBoop: boolean;
  child: ChildProfile | null;
  familyName: string | null;
  previewMode: AchievementPreviewMode | null;
  setupMessage: string | null;
  unlockedBadgeCount: number;
  unlockedAchievementIds: AchievementId[];
  unlockedAtById: Partial<Record<AchievementId, string>>;
  unlockedStandardBadgeCount: number;
  usingDemoMode: boolean;
};

export type AwardAchievementResult = {
  canUnlockSuperBoop: boolean;
  unlockedBadgeCount: number;
  unlockedAchievementIds: AchievementId[];
  unlockedAtById: Partial<Record<AchievementId, string>>;
  unlockedStandardBadgeCount: number;
};

const DEV_PREVIEW_UNLOCKS: Record<AchievementPreviewMode, readonly AchievementId[]> = {
  "all-locked": [],
  "all-standard": [...STANDARD_ACHIEVEMENT_IDS],
  "some-unlocked": [
    "boop-pop-pirates",
    "creative-cove",
    "feelings-forest",
  ],
  "super-boop": [...STANDARD_ACHIEVEMENT_IDS, FINAL_ACHIEVEMENT_ID],
};

function buildAchievementState(rows: readonly Pick<ChildAchievement, "achievement_id" | "unlocked_at">[]) {
  const unlockedAtById: Partial<Record<AchievementId, string>> = {};
  const unlockedAchievementIds: AchievementId[] = [];

  for (const row of rows) {
    if (!isAchievementId(row.achievement_id)) {
      continue;
    }

    unlockedAchievementIds.push(row.achievement_id);
    unlockedAtById[row.achievement_id] = row.unlocked_at;
  }

  const unlockedStandardBadgeCount = STANDARD_ACHIEVEMENT_IDS.filter(
    (achievementId) => unlockedAtById[achievementId],
  ).length;

  return {
    canUnlockSuperBoop: unlockedStandardBadgeCount === STANDARD_BADGE_COUNT,
    unlockedBadgeCount: unlockedAchievementIds.length,
    unlockedAchievementIds,
    unlockedAtById,
    unlockedStandardBadgeCount,
  };
}

function coercePreviewMode(value: string | undefined): AchievementPreviewMode | null {
  if (process.env.NODE_ENV === "production" || !value) {
    return null;
  }

  switch (value) {
    case "all-locked":
    case "some-unlocked":
    case "all-standard":
    case "super-boop":
      return value;
    default:
      return null;
  }
}

function applyPreviewMode(previewMode: AchievementPreviewMode) {
  const baseDate = new Date("2026-07-12T09:00:00.000Z").getTime();
  const unlockedAtById: Partial<Record<AchievementId, string>> = {};

  DEV_PREVIEW_UNLOCKS[previewMode].forEach((achievementId, index) => {
    unlockedAtById[achievementId] = new Date(baseDate + index * 86_400_000).toISOString();
  });

  const unlockedStandardBadgeCount = STANDARD_ACHIEVEMENT_IDS.filter(
    (achievementId) => unlockedAtById[achievementId],
  ).length;

  return {
    canUnlockSuperBoop: unlockedStandardBadgeCount === STANDARD_BADGE_COUNT,
    unlockedBadgeCount: DEV_PREVIEW_UNLOCKS[previewMode].length,
    unlockedAchievementIds: [...DEV_PREVIEW_UNLOCKS[previewMode]],
    unlockedAtById,
    unlockedStandardBadgeCount,
  };
}

async function getVerifiedChildModeContext() {
  const parentSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await parentSupabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const deviceMode = await resolveChildModeSessionForParent({
    admin,
    parentSupabase,
    parentUserId: user.id,
  });

  if (!deviceMode) {
    return null;
  }

  const { data: family } = await parentSupabase
    .from("families")
    .select("id, family_name")
    .eq("id", deviceMode.familyId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    return null;
  }

  return {
    admin,
    childProfileId: deviceMode.childProfileId,
    familyName: family.family_name,
    familyId: family.id,
    parentSupabase,
  };
}

export async function getChildAchievementsPageData(params?: {
  preview?: string;
}): Promise<ChildAchievementsPageData> {
  const previewMode = coercePreviewMode(params?.preview);
  const previewState = previewMode ? applyPreviewMode(previewMode) : null;

  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    return {
      assigned: false,
      canUnlockSuperBoop: previewState?.canUnlockSuperBoop ?? false,
      child: demoChildMode.child,
      familyName: demoChildMode.familyName,
      previewMode,
      setupMessage:
        "Configure Supabase plus child mode secrets to read live child achievement data.",
      unlockedBadgeCount: previewState?.unlockedBadgeCount ?? 0,
      unlockedAchievementIds: previewState?.unlockedAchievementIds ?? [],
      unlockedAtById: previewState?.unlockedAtById ?? {},
      unlockedStandardBadgeCount: previewState?.unlockedStandardBadgeCount ?? 0,
      usingDemoMode: true,
    };
  }

  const context = await getVerifiedChildModeContext();

  if (!context) {
    return {
      assigned: false,
      canUnlockSuperBoop: false,
      child: null,
      familyName: null,
      previewMode,
      setupMessage: "Launch child mode from the parent dashboard to bind this device.",
      unlockedBadgeCount: 0,
      unlockedAchievementIds: [],
      unlockedAtById: {},
      unlockedStandardBadgeCount: 0,
      usingDemoMode: false,
    };
  }

  const [childResult, achievementsResult] = await Promise.all([
    context.admin
      .from("child_profiles")
      .select("*")
      .eq("id", context.childProfileId)
      .eq("family_id", context.familyId)
      .maybeSingle(),
    context.admin
      .from("child_achievements")
      .select("achievement_id, unlocked_at")
      .eq("family_id", context.familyId)
      .eq("child_profile_id", context.childProfileId)
      .order("unlocked_at"),
  ]);

  if (!childResult.data) {
    return {
      assigned: false,
      canUnlockSuperBoop: false,
      child: null,
      familyName: context.familyName,
      previewMode,
      setupMessage: "This child profile could not be loaded on this device.",
      unlockedBadgeCount: 0,
      unlockedAchievementIds: [],
      unlockedAtById: {},
      unlockedStandardBadgeCount: 0,
      usingDemoMode: false,
    };
  }

  const liveState = buildAchievementState(achievementsResult.data ?? []);

  return {
    assigned: true,
    canUnlockSuperBoop: previewState?.canUnlockSuperBoop ?? liveState.canUnlockSuperBoop,
    child: childResult.data,
    familyName: context.familyName,
    previewMode,
    setupMessage: null,
    unlockedBadgeCount: previewState?.unlockedBadgeCount ?? liveState.unlockedBadgeCount,
    unlockedAchievementIds:
      previewState?.unlockedAchievementIds ?? liveState.unlockedAchievementIds,
    unlockedAtById: previewState?.unlockedAtById ?? liveState.unlockedAtById,
    unlockedStandardBadgeCount:
      previewState?.unlockedStandardBadgeCount ?? liveState.unlockedStandardBadgeCount,
    usingDemoMode: false,
  };
}

export async function awardAchievement(params: {
  achievementId: AchievementId;
  childId: string;
}): Promise<AwardAchievementResult> {
  const context = await getVerifiedChildModeContext();

  if (!context || context.childProfileId !== params.childId) {
    throw new Error("Child mode is not active for this achievement award.");
  }

  if (!ACHIEVEMENT_DEFINITION_MAP[params.achievementId]) {
    throw new Error(`Unknown achievement id "${params.achievementId}".`);
  }

  const { error } = await context.parentSupabase.rpc("award_child_achievement", {
    target_achievement_id: params.achievementId,
    target_child_profile_id: params.childId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: allAchievements, error: allAchievementsError } = await context.admin
    .from("child_achievements")
    .select("achievement_id, unlocked_at")
    .eq("family_id", context.familyId)
    .eq("child_profile_id", params.childId)
    .order("unlocked_at");

  if (allAchievementsError) {
    throw new Error(allAchievementsError.message);
  }

  const fullState = buildAchievementState(allAchievements ?? []);

  return fullState;
}

export async function unlockAchievement(childId: string, achievementId: AchievementId) {
  return awardAchievement({
    achievementId,
    childId,
  });
}
