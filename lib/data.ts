import "server-only";

import { demoChildMode, demoParentDashboard } from "@/lib/demo-data";
import {
  buildChildCheckInWeek,
  getServerLocalDateString,
  getWeekStartForDate,
} from "@/lib/daily-bonus";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  isChildModeConfigured,
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { resolveChildModeSessionForParent } from "@/lib/child-mode";
import { buildChildTaskView, isTaskScheduledForDate } from "@/lib/tasks";
import type {
  BoopTransactionView,
  ChildModeData,
  PendingBoopAward,
  PendingBoopAwardView,
  ParentDashboardData,
  RedemptionView,
  TaskCompletion,
  TaskCompletionView,
  Task,
} from "@/lib/types";

export async function getParentDashboardData(): Promise<ParentDashboardData> {
  if (!isSupabaseConfigured()) {
    return {
      ...demoParentDashboard,
      subscription: null,
      usingDemoMode: true,
      childModeReady: isChildModeConfigured(),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ...demoParentDashboard,
      family: null,
      subscription: null,
      pendingBoopAwards: [],
      pendingBoopTotal: 0,
      requiresAuth: true,
      userEmail: null,
      usingDemoMode: false,
      childModeReady: isChildModeConfigured(),
    };
  }

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    return {
      ...demoParentDashboard,
      boopers: [],
      children: [],
      deviceModes: [],
      family: null,
      subscription: null,
      pendingBoopAwards: [],
      pendingBoopTotal: 0,
      taskCompletions: [],
      pendingTaskCompletions: [],
      redemptions: [],
      requiresAuth: false,
      rewards: [],
      tasks: [],
      transactions: [],
      userEmail: user.email ?? null,
      usingDemoMode: false,
      childModeReady: isChildModeConfigured(),
    };
  }

  const admin = isServiceRoleConfigured() ? createSupabaseAdminClient() : null;

  const [subscriptionResult, childrenResult, boopersResult, managedInventoryResult, tasksResult, rewardsResult, transactionsResult, pendingAwardsResult, redemptionsResult, deviceModesResult, taskCompletionsResult] =
    await Promise.all([
      supabase
        .from("family_subscriptions")
        .select("*")
        .eq("family_id", family.id)
        .maybeSingle(),
      supabase
        .from("child_profiles")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at"),
      supabase.from("boopers").select("*").eq("family_id", family.id).order("created_at"),
      admin
        ? admin.from("booper_inventory").select("uid").eq("family_id", family.id)
        : Promise.resolve({ data: null, error: null }),
      supabase.from("tasks").select("*").eq("family_id", family.id).order("created_at"),
      supabase.from("rewards").select("*").eq("family_id", family.id).order("created_at"),
      supabase
        .from("boop_transactions")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("pending_boop_awards")
        .select("*")
        .eq("family_id", family.id)
        .is("claimed_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("redemptions")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("device_child_mode")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("task_completions")
        .select("*")
        .order("submitted_at", { ascending: false }),
    ]);

  const children = childrenResult.data ?? [];
  const tasks = (tasksResult.data ?? []) as Task[];
  const managedUidSet = new Set(
    (managedInventoryResult.data ?? []).map((entry) => entry.uid),
  );
  const taskLookup = new Map(tasks.map((task) => [task.id, task]));
  const childLookup = new Map(children.map((child) => [child.id, child.display_name]));
  const rewardLookup = new Map(
    (rewardsResult.data ?? []).map((reward) => [reward.id, reward.title]),
  );

  const transactions: BoopTransactionView[] = (transactionsResult.data ?? []).map(
    (transaction) => ({
      ...transaction,
      childName: childLookup.get(transaction.child_profile_id) ?? null,
    }),
  );
  const pendingBoopAwards: PendingBoopAwardView[] = (
    (pendingAwardsResult.data ?? []) as PendingBoopAward[]
  ).map((award) => ({
    ...award,
    childName: childLookup.get(award.child_profile_id) ?? null,
  }));

  const redemptions: RedemptionView[] = (redemptionsResult.data ?? []).map(
    (redemption) => ({
      ...redemption,
      childName: childLookup.get(redemption.child_profile_id) ?? null,
      rewardTitle: rewardLookup.get(redemption.reward_id) ?? null,
    }),
  );

  const taskCompletions = ((taskCompletionsResult.data ?? []) as TaskCompletion[]).filter(
    (completion) => taskLookup.has(completion.task_id),
  );

  const pendingTaskCompletions: TaskCompletionView[] = taskCompletions
    .filter((completion) => completion.status === "pending")
    .map((completion) => ({
      ...completion,
      boopReward: taskLookup.get(completion.task_id)?.boop_reward ?? 0,
      childName: childLookup.get(completion.child_profile_id) ?? null,
      recurringType: taskLookup.get(completion.task_id)?.recurring_type ?? "none",
      taskTitle: taskLookup.get(completion.task_id)?.title ?? null,
    }));

  return {
    boopers: managedInventoryResult.data
      ? (boopersResult.data ?? []).filter((booper) => managedUidSet.has(booper.nfc_uid))
      : boopersResult.data ?? [],
    childModeReady: isChildModeConfigured(),
    children,
    deviceModes: deviceModesResult.data ?? [],
    family,
    subscription: subscriptionResult.data ?? null,
    pendingBoopAwards,
    pendingBoopTotal: pendingBoopAwards.reduce((sum, award) => sum + award.amount, 0),
    pendingTaskCompletions,
    redemptions,
    requiresAuth: false,
    rewards: rewardsResult.data ?? [],
    taskCompletions,
    tasks,
    transactions,
    userEmail: user.email ?? null,
    usingDemoMode: false,
  };
}

export async function getChildModeData(): Promise<ChildModeData> {
  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    return {
      ...demoChildMode,
      assigned: false,
      dailyCheckInWeek: [],
      pendingBoopAwards: [],
      pendingBoopTotal: 0,
      tasks: [],
      recentTransactions: [],
      setupMessage:
        "Configure Supabase plus child mode secrets to read live child data.",
      usingDemoMode: true,
    };
  }

  const parentSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await parentSupabase.auth.getUser();

  if (!user) {
    return {
      ...demoChildMode,
      assigned: false,
      child: null,
      dailyCheckInWeek: [],
      deviceLabel: null,
      familyName: null,
      pendingBoopAwards: [],
      pendingBoopTotal: 0,
      tasks: [],
      recentTransactions: [],
      redemptions: [],
      rewards: [],
      setupMessage:
        "Parent sign-in has expired on this device. Sign in again to continue child mode.",
      usingDemoMode: false,
    };
  }

  const supabase = createSupabaseAdminClient();
  const resolvedDeviceMode = await resolveChildModeSessionForParent({
    admin: supabase,
    parentSupabase,
    parentUserId: user.id,
  });

  if (!resolvedDeviceMode) {
    return {
      ...demoChildMode,
      assigned: false,
      child: null,
      dailyCheckInWeek: [],
      deviceLabel: null,
      familyName: null,
      pendingBoopAwards: [],
      pendingBoopTotal: 0,
      tasks: [],
      recentTransactions: [],
      redemptions: [],
      rewards: [],
      setupMessage:
        "Launch child mode from the parent dashboard to bind this device.",
      usingDemoMode: false,
    };
  }

  const referenceDate = getServerLocalDateString();
  const weekStart = getWeekStartForDate(referenceDate);
  const [familyResult, childResult, tasksResult, taskCompletionsResult, rewardsResult, redemptionsResult, transactionsResult, pendingAwardsResult, dailyCheckInsResult] =
    await Promise.all([
    supabase.from("families").select("family_name").eq("id", resolvedDeviceMode.familyId).single(),
    supabase
      .from("child_profiles")
      .select("*")
      .eq("id", resolvedDeviceMode.childProfileId)
      .single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("active", true)
      .order("created_at"),
    supabase
      .from("task_completions")
      .select("*")
      .eq("child_profile_id", resolvedDeviceMode.childProfileId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("rewards")
      .select("*")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("active", true)
      .order("cost"),
    supabase
      .from("redemptions")
      .select("*")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("child_profile_id", resolvedDeviceMode.childProfileId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("boop_transactions")
      .select("*")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("child_profile_id", resolvedDeviceMode.childProfileId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("pending_boop_awards")
      .select("*")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("child_profile_id", resolvedDeviceMode.childProfileId)
      .is("claimed_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("child_daily_checkins")
      .select("checkin_date")
      .eq("family_id", resolvedDeviceMode.familyId)
      .eq("child_profile_id", resolvedDeviceMode.childProfileId)
      .gte("checkin_date", weekStart)
      .lte("checkin_date", referenceDate)
      .order("checkin_date"),
    ]);

  const allFamilyRewards = rewardsResult.data ?? [];
  const visibleRewards = allFamilyRewards.filter(
    (reward) =>
      reward.active &&
      (!reward.child_profile_id ||
        reward.child_profile_id === resolvedDeviceMode.childProfileId),
  );
  const rewardLookup = new Map(allFamilyRewards.map((reward) => [reward.id, reward.title]));
  const visibleTasks = ((tasksResult.data ?? []) as Task[]).filter(
    (task) =>
      (!task.child_profile_id || task.child_profile_id === resolvedDeviceMode.childProfileId) &&
      isTaskScheduledForDate(task),
  );
  const childTasks = visibleTasks.map((task) =>
    buildChildTaskView(
      task,
      ((taskCompletionsResult.data ?? []) as TaskCompletion[]).filter(
        (completion) => completion.task_id === task.id,
      ),
    ),
  );

  return {
    assigned: true,
    child: childResult.data ?? null,
    dailyCheckInWeek: buildChildCheckInWeek(
      (dailyCheckInsResult.data ?? []).map((row) => row.checkin_date),
      referenceDate,
    ),
    deviceLabel: resolvedDeviceMode.deviceLabel,
    familyName: familyResult.data?.family_name ?? null,
    pendingBoopAwards: (pendingAwardsResult.data ?? []) as PendingBoopAward[],
    pendingBoopTotal: ((pendingAwardsResult.data ?? []) as PendingBoopAward[]).reduce(
      (sum, award) => sum + award.amount,
      0,
    ),
    tasks: childTasks,
    recentTransactions: (transactionsResult.data ?? []).map((transaction) => ({
      ...transaction,
      childName: childResult.data?.display_name ?? null,
    })),
    redemptions: (redemptionsResult.data ?? []).map((redemption) => ({
      ...redemption,
      childName: childResult.data?.display_name ?? null,
      rewardTitle: rewardLookup.get(redemption.reward_id) ?? null,
    })),
    rewards: visibleRewards,
    setupMessage: null,
    usingDemoMode: false,
  };
}
