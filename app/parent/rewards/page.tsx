import Image from "next/image";
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { ParentRewardWizardLauncher } from "@/components/parent-reward-wizard-launcher";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import { getRewardIconPath } from "@/lib/goodkiddo-assets";
import { getParentStatusBanner } from "@/lib/parent-status";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";

export default async function ParentRewardsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getParentDashboardData(),
    props.searchParams,
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  if (dashboard.family && subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getParentStatusBanner(bannerCode);

  const childOptions = dashboard.children.map((child) => ({
    avatarUrl: child.avatar_url,
    id: child.id,
    name: child.display_name,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <div className="parent-soft-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Create reward
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">Open the reward wizard</h2>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ParentRewardWizardLauncher
                childOptions={childOptions}
                triggerLabel="Create reward"
              />
            </div>
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <h2 className="text-3xl font-extrabold">Reward tips</h2>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Quick reward-value guides for small wins and bigger treats.
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
            </summary>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="metric-tile rounded-[1.4rem] p-4">
                <p className="text-sm font-bold text-[color:var(--ink-soft)]">Quick yes</p>
                <p className="mt-2 text-lg font-extrabold">10-20 boops</p>
              </div>
              <div className="metric-tile rounded-[1.4rem] p-4">
                <p className="text-sm font-bold text-[color:var(--ink-soft)]">Bigger treat</p>
                <p className="mt-2 text-lg font-extrabold">25-50 boops</p>
              </div>
              <div className="metric-tile rounded-[1.4rem] p-4">
                <p className="text-sm font-bold text-[color:var(--ink-soft)]">Save up</p>
                <p className="mt-2 text-lg font-extrabold">75+ boops</p>
              </div>
            </div>
          </details>
        </ShellCard>
      </section>

      <ShellCard className="rounded-[1.8rem] p-6">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold">Active rewards</h2>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                {dashboard.rewards.length
                  ? `${dashboard.rewards.length} reward${dashboard.rewards.length === 1 ? "" : "s"} ready to manage.`
                  : "No rewards yet."}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
          </summary>

          <div className="mt-6">
            {dashboard.rewards.length ? (
              <div className="grid max-h-[68rem] gap-4 overflow-y-auto pr-1">
                {dashboard.rewards.map((reward) => (
                  <ShellCard key={reward.id} className="rounded-[1.8rem] p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        <div className="parent-task-edit-art shrink-0">
                          <Image
                            alt={reward.title}
                            className="h-auto w-full object-contain"
                            height={180}
                            src={getRewardIconPath(reward.title)}
                            width={180}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-extrabold">{reward.title}</h3>
                            <StatusPill tone={reward.active ? "mint" : "rose"}>
                              {reward.active ? "Active" : "Paused"}
                            </StatusPill>
                            <StatusPill tone="sky">{reward.cost} boops</StatusPill>
                          </div>

                          <p className="mt-3 text-sm font-bold text-[color:var(--ink-soft)]">
                            {dashboard.children.find((child) => child.id === reward.child_profile_id)
                              ?.display_name ?? "All children"}
                          </p>
                          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                            {reward.description || "No description yet"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ParentRewardWizardLauncher
                          childOptions={childOptions}
                          initialReward={{
                            active: reward.active,
                            childProfileId: reward.child_profile_id,
                            cost: reward.cost,
                            description: reward.description,
                            rewardId: reward.id,
                            title: reward.title,
                          }}
                          triggerLabel="Edit reward"
                          triggerTone="secondary"
                        />
                      </div>
                    </div>
                  </ShellCard>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                No rewards yet.
              </div>
            )}
          </div>
        </details>
      </ShellCard>
    </main>
  );
}
