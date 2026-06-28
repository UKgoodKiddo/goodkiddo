import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
import { formatBoops, formatDateTime } from "@/lib/utils";

export default async function ParentActivityPage(props: {
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

      <ShellCard className="rounded-[1.8rem] p-6">
        <p className="eyebrow">Activity</p>
        <h2 className="mt-3 text-3xl font-extrabold">Recent family movement</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          Keep an eye on awarded boops, pending collections, and reward requests without digging through every section.
        </p>
      </ShellCard>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Recent activity</p>
          <h3 className="mt-3 text-2xl font-extrabold">Boop transactions</h3>
          <div className="mt-6 grid gap-3">
            {dashboard.transactions.length ? (
              dashboard.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-[1.4rem] bg-white px-4 py-4 shadow-[0_10px_26px_rgba(20,36,82,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
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
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Transactions will appear here once you start awarding or approving boops.
              </div>
            )}
          </div>
        </ShellCard>

        <div className="grid gap-6">
          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="eyebrow">Waiting to collect</p>
            <h3 className="mt-3 text-2xl font-extrabold">Pending boops</h3>
            <div className="mt-6 grid gap-3">
              {dashboard.pendingBoopAwards.length ? (
                dashboard.pendingBoopAwards.slice(0, 6).map((award) => (
                  <div
                    key={award.id}
                    className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold">{award.childName ?? "Child"}</p>
                        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                          {award.reason}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-extrabold text-[color:var(--primary)]">
                        +{formatBoops(award.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                  No boops are waiting to be collected right now.
                </div>
              )}
            </div>
          </ShellCard>

          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="eyebrow">Reward queue</p>
            <h3 className="mt-3 text-2xl font-extrabold">Recent reward requests</h3>
            <div className="mt-6 grid gap-3">
              {dashboard.redemptions.length ? (
                dashboard.redemptions.slice(0, 6).map((redemption) => (
                  <div
                    key={redemption.id}
                    className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4"
                  >
                    <p className="text-base font-extrabold">
                      {redemption.childName ?? "Child"} requested {redemption.rewardTitle ?? "a reward"}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {redemption.status} · {formatDateTime(redemption.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                  Reward requests will show here once children begin redeeming.
                </div>
              )}
            </div>
          </ShellCard>
        </div>
      </section>
    </main>
  );
}
