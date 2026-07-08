import Image from "next/image";
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { ParentRewardWizardLauncher } from "@/components/parent-reward-wizard-launcher";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import { getRewardIconPath } from "@/lib/goodkiddo-assets";
import { getParentStatusBanner } from "@/lib/parent-status";

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
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
            Reward tips
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">Keep rewards simple</h2>
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
        </ShellCard>
      </section>

      <section className="grid gap-4">
        {dashboard.rewards.length ? (
          dashboard.rewards.map((reward) => (
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
          ))
        ) : (
          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">No rewards yet.</p>
          </ShellCard>
        )}
      </section>
    </main>
  );
}
