import Image from "next/image";
import { redirect } from "next/navigation";
import { createFamilyAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { ClearChildModeStorage } from "@/components/clear-child-mode-storage";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ParentDashboardExperience } from "@/components/parent-dashboard-experience";
import { ShellCard } from "@/components/shell-card";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { getTaskCardCatalog } from "@/lib/task-card-catalog";
import { buildChildTaskView, isTaskScheduledForDate } from "@/lib/tasks";
import { getParentStatusBanner } from "@/lib/parent-status";
import { getParentDashboardData } from "@/lib/data";
import { getServerLocalDateString } from "@/lib/daily-bonus";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";
import { formatDateTime } from "@/lib/utils";

export default async function ParentPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams, taskCatalog] = await Promise.all([
    getParentDashboardData(),
    props.searchParams,
    getTaskCardCatalog(),
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getParentStatusBanner(bannerCode);
  const shouldClearChildMode =
    typeof searchParams.unlock === "string" && searchParams.unlock === "1";

  if (!dashboard.family) {
    return (
      <main className="flex flex-1 flex-col gap-6">
        {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

        <ShellCard className="parent-hero rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="parent-eyebrow">Start here</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
                Create your family hub
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                This is the shared home for your children, tasks, rewards, Boopers,
                and approvals.
              </p>
              <form action={createFamilyAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  className="field max-w-md"
                  name="familyName"
                  placeholder="The Robinson family"
                  required
                />
                <LoadingSubmitButton
                  className="btn btn-primary whitespace-nowrap"
                  pendingLabel="Creating..."
                >
                  Create family
                </LoadingSubmitButton>
              </form>
            </div>

            <div className="flex justify-center">
              <div className="rounded-[2rem] bg-[linear-gradient(180deg,#1a61e6,#0c42b6)] p-5 shadow-[0_24px_50px_rgba(12,66,182,0.22)]">
                <Image
                  alt="goodKiddo mascot"
                  height={180}
                  src={GOODKIDDO_ASSETS.boopHappy}
                  width={180}
                />
              </div>
            </div>
          </div>
        </ShellCard>
      </main>
    );
  }

  if (subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  const pendingApprovals =
    dashboard.pendingTaskCompletions.length +
    dashboard.redemptions.filter((redemption) => redemption.status === "pending").length;
  const todayKey = getServerLocalDateString();
  const pendingAwardsByChildId = new Map<string, number>();
  for (const award of dashboard.pendingBoopAwards) {
    pendingAwardsByChildId.set(
      award.child_profile_id,
      (pendingAwardsByChildId.get(award.child_profile_id) ?? 0) + award.amount,
    );
  }

  const childSnapshotCards = dashboard.children.map((child) => {
    const visibleTasks = dashboard.tasks.filter(
      (task) =>
        task.active &&
        (!task.child_profile_id || task.child_profile_id === child.id) &&
        isTaskScheduledForDate(task),
    );
    const childTaskViews = visibleTasks.map((task) =>
      buildChildTaskView(
        task,
        dashboard.taskCompletions.filter(
          (completion) => completion.child_profile_id === child.id && completion.task_id === task.id,
        ),
      ),
    );
    const completedTodayCount = childTaskViews.filter((task) => {
      if (!task.lastSubmittedAt || !["approved", "pending"].includes(task.currentStatus)) {
        return false;
      }

      return task.lastSubmittedAt.slice(0, 10) === todayKey;
    }).length;

    return {
      activeTaskCount: childTaskViews.filter((task) => task.currentStatus !== "approved").length,
      completedTodayCount,
      id: child.id,
      name: child.display_name,
      spendableBoops: child.boop_balance,
      avatarUrl: child.avatar_url,
      waitingToCollectBoops: pendingAwardsByChildId.get(child.id) ?? 0,
    };
  });
  const childOptions = dashboard.children.map((child) => ({
    avatarUrl: child.avatar_url,
    id: child.id,
    name: child.display_name,
  }));
  const childBalances = dashboard.children.map((child) => ({
    avatarUrl: child.avatar_url,
    boopBalance: child.boop_balance,
    createdAtLabel: formatDateTime(child.created_at),
    id: child.id,
    name: child.display_name,
  }));

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4">
      {shouldClearChildMode ? <ClearChildModeStorage /> : null}
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}
      <ParentDashboardExperience
        balances={childBalances}
        childOptions={childOptions}
        childSnapshotCards={childSnapshotCards}
        pendingApprovals={pendingApprovals}
        pendingRewardRequestCount={
          dashboard.redemptions.filter((redemption) => redemption.status === "pending").length
        }
        pendingTaskCompletionCount={dashboard.pendingTaskCompletions.length}
        taskCatalog={taskCatalog.categories}
      />
    </main>
  );
}
