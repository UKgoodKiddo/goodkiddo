import "server-only";

import { revalidatePath } from "next/cache";
import {
  BOOP_POP_PIRATES_BIOME_ID,
  BOOP_POP_PIRATES_COLLECTIBLE_IDS,
  isBoopPopPiratesCollectibleId,
  type BoopPopPiratesCollectibleId,
} from "@/lib/boop-pop-pirates";
import { resolveChildModeSessionForParent } from "@/lib/child-mode";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { ChildProfile } from "@/lib/types";

type ChildBiomeCollectibleRow = {
  collectible_id: string;
};

export type BoopPopPiratesPageData = {
  assigned: boolean;
  child: ChildProfile | null;
  collectedCollectibleIds: BoopPopPiratesCollectibleId[];
  familyName: string | null;
  setupMessage: string | null;
  usingDemoMode: boolean;
};

type VerifiedChildModeContext = {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  childProfileId: string;
  familyId: string;
  familyName: string;
  parentSupabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

function isDuplicateKeyError(error: { code?: string } | null) {
  return error?.code === "23505";
}

async function getVerifiedChildModeContext(): Promise<VerifiedChildModeContext | null> {
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
    familyId: family.id,
    familyName: family.family_name,
    parentSupabase,
  };
}

function revalidateBoopPopPiratesRoutes() {
  revalidatePath("/child/achievements");
  revalidatePath("/child/kiddo_explorers");
  revalidatePath("/child/kiddo_explorers/boop_pop_pirates");
}

async function getCollectedBoopPopPiratesCollectibleIds(context: VerifiedChildModeContext) {
  const { data, error } = await context.admin
    .from("child_biome_collectibles")
    .select("collectible_id")
    .eq("family_id", context.familyId)
    .eq("child_profile_id", context.childProfileId)
    .eq("biome_id", BOOP_POP_PIRATES_BIOME_ID)
    .order("collected_at");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ChildBiomeCollectibleRow[])
    .map((row) => row.collectible_id)
    .filter(isBoopPopPiratesCollectibleId);
}

export async function getBoopPopPiratesPageData(): Promise<BoopPopPiratesPageData> {
  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    return {
      assigned: false,
      child: null,
      collectedCollectibleIds: [],
      familyName: null,
      setupMessage:
        "Configure Supabase plus child mode secrets to open Boop Pop Pirates.",
      usingDemoMode: true,
    };
  }

  const context = await getVerifiedChildModeContext();

  if (!context) {
    return {
      assigned: false,
      child: null,
      collectedCollectibleIds: [],
      familyName: null,
      setupMessage: "Launch child mode from the parent dashboard to open this biome.",
      usingDemoMode: false,
    };
  }

  const [childResult, collectiblesResult] = await Promise.all([
    context.admin
      .from("child_profiles")
      .select("*")
      .eq("id", context.childProfileId)
      .eq("family_id", context.familyId)
      .maybeSingle(),
    context.admin
      .from("child_biome_collectibles")
      .select("collectible_id")
      .eq("family_id", context.familyId)
      .eq("child_profile_id", context.childProfileId)
      .eq("biome_id", BOOP_POP_PIRATES_BIOME_ID)
      .order("collected_at"),
  ]);

  if (!childResult.data) {
    return {
      assigned: false,
      child: null,
      collectedCollectibleIds: [],
      familyName: context.familyName,
      setupMessage: "This child profile could not be loaded on this device.",
      usingDemoMode: false,
    };
  }

  return {
    assigned: true,
    child: childResult.data,
    collectedCollectibleIds: ((collectiblesResult.data ??
      []) as ChildBiomeCollectibleRow[])
      .map((row) => row.collectible_id)
      .filter(isBoopPopPiratesCollectibleId),
    familyName: context.familyName,
    setupMessage: null,
    usingDemoMode: false,
  };
}

export async function persistBoopPopPiratesCollectible(
  collectibleId: BoopPopPiratesCollectibleId,
) {
  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    throw new Error("Boop Pop Pirates persistence is not configured.");
  }

  const context = await getVerifiedChildModeContext();

  if (!context) {
    throw new Error("Child mode is not active for Boop Pop Pirates persistence.");
  }

  const { error: insertError } = await context.admin
    .from("child_biome_collectibles")
    .insert({
      biome_id: BOOP_POP_PIRATES_BIOME_ID,
      child_profile_id: context.childProfileId,
      collectible_id: collectibleId,
      family_id: context.familyId,
    });

  if (insertError && !isDuplicateKeyError(insertError)) {
    throw new Error(insertError.message);
  }

  const collectedCollectibleIds = await getCollectedBoopPopPiratesCollectibleIds(
    context,
  );

  if (collectedCollectibleIds.length === BOOP_POP_PIRATES_COLLECTIBLE_IDS.length) {
    const { error: achievementError } = await context.parentSupabase.rpc(
      "award_child_achievement",
      {
        target_achievement_id: BOOP_POP_PIRATES_BIOME_ID,
        target_child_profile_id: context.childProfileId,
      },
    );

    if (achievementError) {
      throw new Error(achievementError.message);
    }
  }

  revalidateBoopPopPiratesRoutes();

  return {
    alreadyCollected: Boolean(insertError),
    childId: context.childProfileId,
  };
}
