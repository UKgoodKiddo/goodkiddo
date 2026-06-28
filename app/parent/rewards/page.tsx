import Image from "next/image";
import { redirect } from "next/navigation";
import { updateRewardAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { RewardPresetBuilder } from "@/components/reward-preset-builder";
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

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Add reward</p>
          <h2 className="mt-3 text-3xl font-extrabold">Create a reward</h2>
          <div className="mt-6">
            <RewardPresetBuilder />
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Guidance</p>
          <h2 className="mt-3 text-3xl font-extrabold">Keep rewards simple and clear</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="metric-tile rounded-[1.4rem] p-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Small wins</p>
              <p className="mt-2 text-lg font-extrabold">10 boops</p>
            </div>
            <div className="metric-tile rounded-[1.4rem] p-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Weekend treat</p>
              <p className="mt-2 text-lg font-extrabold">20 boops</p>
            </div>
            <div className="metric-tile rounded-[1.4rem] p-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Big prize</p>
              <p className="mt-2 text-lg font-extrabold">40+ boops</p>
            </div>
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-4">
        {dashboard.rewards.length ? (
          dashboard.rewards.map((reward) => (
            <ShellCard key={reward.id} className="rounded-[1.8rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="task-icon-frame h-16 w-16">
                    <Image
                      alt=""
                      className="task-icon-art"
                      height={52}
                      src={getRewardIconPath(reward.title)}
                      width={52}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold">{reward.title}</h3>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      {reward.description || "No description yet"}
                    </p>
                  </div>
                </div>
                <StatusPill tone={reward.active ? "sky" : "rose"}>
                  {reward.cost} boops
                </StatusPill>
              </div>

              <form action={updateRewardAction} className="mt-5 grid gap-3 lg:grid-cols-[1fr_120px_1fr_auto]">
                <input type="hidden" name="rewardId" value={reward.id} />
                <input
                  className="field"
                  defaultValue={reward.title}
                  name="title"
                  required
                />
                <input
                  className="field"
                  defaultValue={reward.cost}
                  min={1}
                  name="cost"
                  required
                  type="number"
                />
                <input
                  className="field"
                  defaultValue={reward.description ?? ""}
                  name="description"
                />
                <button className="btn btn-primary" type="submit">
                  Save reward
                </button>
                <label className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-4 py-3 text-sm font-bold lg:col-span-4">
                  <input
                    defaultChecked={reward.active}
                    name="active"
                    type="checkbox"
                    value="on"
                  />
                  Reward is active
                </label>
              </form>
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
