import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";
import { formatBoops, formatDateTime } from "@/lib/utils";

function CollapseIcon() {
  return (
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
  );
}

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

  if (dashboard.family && subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getParentStatusBanner(bannerCode);

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <ShellCard className="rounded-[1.8rem] p-6">
        <h2 className="text-3xl font-extrabold">Recent activity</h2>
      </ShellCard>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold">Boop transactions</h3>
              </div>
              <CollapseIcon />
            </summary>

            <div className="mt-6">
              {dashboard.transactions.length ? (
                <div className="grid max-h-[52rem] gap-3 overflow-y-auto pr-1">
                  {dashboard.transactions.map((transaction) => (
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
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                  Transactions will appear here once you start awarding or approving boops.
                </div>
              )}
            </div>
          </details>
        </ShellCard>

        <div className="grid gap-6">
          <ShellCard className="rounded-[1.8rem] p-6">
            <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold">Pending boops</h3>
              </div>
              <CollapseIcon />
            </summary>

              <div className="mt-6">
                {dashboard.pendingBoopAwards.length ? (
                  <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
                    {dashboard.pendingBoopAwards.map((award) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                    No boops are waiting to be collected right now.
                  </div>
                )}
              </div>
            </details>
          </ShellCard>

          <ShellCard className="rounded-[1.8rem] p-6">
            <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold">Reward requests</h3>
              </div>
              <CollapseIcon />
            </summary>

              <div className="mt-6">
                {dashboard.redemptions.length ? (
                  <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
                    {dashboard.redemptions.map((redemption) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                    Reward requests will show here once children begin redeeming.
                  </div>
                )}
              </div>
            </details>
          </ShellCard>
        </div>
      </section>
    </main>
  );
}
