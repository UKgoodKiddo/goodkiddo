import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createFamilyAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { ClearChildModeStorage } from "@/components/clear-child-mode-storage";
import { ShellCard } from "@/components/shell-card";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import { buildChildTaskView } from "@/lib/tasks";
import { getParentStatusBanner } from "@/lib/parent-status";
import { getParentDashboardData } from "@/lib/data";
import { getServerLocalDateString } from "@/lib/daily-bonus";
import { formatBoops, formatDateTime } from "@/lib/utils";

export default async function ParentPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getParentDashboardData(),
    props.searchParams,
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
              <p className="eyebrow">Start here</p>
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
                <button className="btn btn-primary whitespace-nowrap" type="submit">
                  Create family
                </button>
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
      (task) => task.active && (!task.child_profile_id || task.child_profile_id === child.id),
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

  return (
    <main className="flex flex-1 flex-col gap-6">
      {shouldClearChildMode ? <ClearChildModeStorage /> : null}
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group" name="parent-dashboard-panels">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div>
                <p className="text-sm font-bold text-[color:var(--ink-soft)]">Today&apos;s progress</p>
                <h2 className="mt-1 text-3xl font-extrabold">Family snapshot</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--ink-soft)] shadow-[0_8px_18px_rgba(20,36,82,0.08)]">
                  <span className="group-open:hidden">Tap to open</span>
                  <span className="hidden group-open:inline">Close</span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 4V16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    <path d="M4 10H16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </span>
              </div>
            </summary>

            <div className="mt-6">
              {childSnapshotCards.length ? (
                <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                  {childSnapshotCards.map((child) => (
                    <Link
                      key={child.id}
                      aria-label={`Open ${child.name}'s child profile`}
                      className="flex min-h-[10.75rem] w-full flex-col rounded-[1.9rem] border border-[rgba(31,71,178,0.12)] bg-white p-4 text-left shadow-[0_18px_38px_rgba(31,71,178,0.08)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
                      href={`/parent/children#child-${child.id}`}
                    >
                      <div className="grid grid-cols-[2.55rem_minmax(0,1fr)] items-start gap-3">
                        {child.avatarUrl ? (
                          <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[#dff3ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                            <Image
                              alt={`${child.name} avatar`}
                              className="h-[2.3rem] w-[2.3rem] rounded-full object-cover"
                              height={37}
                              src={child.avatarUrl}
                              width={37}
                            />
                          </div>
                        ) : (
                          <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffe783,#ffd34d)] text-[1.15rem] font-black text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                            {child.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 pt-1">
                          <p className="text-[clamp(0.98rem,3.5vw,1.25rem)] font-extrabold leading-[1.05] text-[color:var(--foreground)]">
                            {child.name}
                          </p>
                          <p className="mt-2 whitespace-nowrap text-[clamp(0.88rem,3.15vw,1.08rem)] font-extrabold leading-none text-[color:var(--primary-strong)]">
                            {formatBoops(child.waitingToCollectBoops)}
                          </p>
                          <p className="mt-1 text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
                            to collect
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[rgba(31,71,178,0.12)] pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p className="text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
                              Active tasks
                            </p>
                            <p className="mt-2 text-[1.5rem] font-extrabold leading-none text-[color:var(--primary-strong)]">
                              {child.activeTaskCount}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.76rem] font-bold leading-4 text-[color:var(--ink-soft)]">
                              Completed today
                            </p>
                            <p className="mt-2 text-[1.5rem] font-extrabold leading-none text-[#2aa84a]">
                              {child.completedTodayCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="metric-tile rounded-[1.4rem] p-4 text-sm text-[color:var(--ink-soft)]">
                  Child cards will appear here once profiles exist.
                </div>
              )}
            </div>
          </details>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Pending approvals</p>
          <h2 className="mt-3 text-3xl font-extrabold">Needs your eyes</h2>
          <div className="mt-6 flex items-center justify-between rounded-[1.6rem] bg-[#f6f9ff] px-5 py-5">
            <div>
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                Outstanding approvals
              </p>
              <p className="mt-2 text-4xl font-extrabold">{pendingApprovals}</p>
            </div>
            <Link className="btn btn-secondary" href="/parent/approvals">
              Open approvals
            </Link>
          </div>
          <div className="mt-4 space-y-3 text-sm text-[color:var(--ink-soft)]">
            <p>{dashboard.pendingTaskCompletions.length} task completions waiting.</p>
            <p>
              {dashboard.redemptions.filter((redemption) => redemption.status === "pending").length} reward
              requests waiting.
            </p>
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group" name="parent-dashboard-panels">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div>
                <p className="text-sm font-bold text-[color:var(--ink-soft)]">Child boop balances</p>
                <h2 className="mt-1 text-3xl font-extrabold">Who&apos;s saving up?</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--ink-soft)] shadow-[0_8px_18px_rgba(20,36,82,0.08)]">
                  <span className="group-open:hidden">Tap to open</span>
                  <span className="hidden group-open:inline">Close</span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 4V16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    <path d="M4 10H16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </span>
              </div>
            </summary>

            <div className="mt-6 grid gap-3">
              {dashboard.children.length ? (
                dashboard.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between rounded-[1.4rem] bg-[#f8fbff] px-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {child.avatar_url ? (
                        <Image
                          alt={`${child.display_name} avatar`}
                          className="h-12 w-12 rounded-[1rem] object-cover"
                          height={48}
                          src={child.avatar_url}
                          width={48}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[color:var(--sun)] text-lg font-black text-[color:var(--foreground)]">
                          {child.display_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold">{child.display_name}</p>
                        <p className="text-sm text-[color:var(--ink-soft)]">
                          Created {formatDateTime(child.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-[color:var(--primary-strong)]">
                      {formatBoops(child.boop_balance)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                  Add your first child profile to start tracking boops.
                </div>
              )}
            </div>
          </details>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Recent activity</p>
          <h2 className="mt-3 text-3xl font-extrabold">Latest wins</h2>
          <div className="mt-6 grid gap-3">
            {dashboard.transactions.length ? (
              dashboard.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-4 rounded-[1.4rem] bg-white px-4 py-4 shadow-[0_10px_26px_rgba(20,36,82,0.08)]"
                >
                  <div className="min-w-0">
                    <p className="text-base font-extrabold">{transaction.reason}</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {transaction.childName ?? "Child"} · {formatDateTime(transaction.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold text-[color:var(--primary-strong)]">
                    {transaction.amount > 0 ? "+" : ""}
                    {formatBoops(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Activity will appear here once tasks, rewards, or manual boops start moving.
              </div>
            )}
          </div>
        </ShellCard>
      </section>
    </main>
  );
}
