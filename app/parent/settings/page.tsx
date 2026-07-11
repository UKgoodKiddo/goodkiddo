import { redirect } from "next/navigation";
import {
  openStripeBillingPortalAction,
  toggleParentSubscriptionCancellationAction,
  updateParentPinAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
import {
  formatBooperPackStatus,
  formatSubscriptionPlan,
  formatSubscriptionStatusLabel,
  subscriptionNeedsPlanSelection,
} from "@/lib/subscriptions";
import { formatDateTime } from "@/lib/utils";

export default async function ParentSettingsPage(props: {
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

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <p className="eyebrow">Settings</p>
                <h2 className="mt-2 text-3xl font-extrabold">Family details</h2>
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

            {dashboard.family ? (
              <div className="mt-6 grid gap-3">
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Family name</p>
                  <p className="mt-2 text-xl font-extrabold">{dashboard.family.family_name}</p>
                </div>
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Children</p>
                  <p className="mt-2 text-xl font-extrabold">{dashboard.children.length}</p>
                </div>
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Created</p>
                  <p className="mt-2 text-xl font-extrabold">
                    {formatDateTime(dashboard.family.created_at)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Create a family first to use parent settings.
              </div>
            )}
          </details>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <h2 className="text-3xl font-extrabold">Subscription</h2>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Your Family+ plan, Stripe status, and Booper pack progress live here.
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

            {dashboard.subscription ? (
              <div className="mt-6 grid gap-3">
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Plan</p>
                  <p className="mt-2 text-xl font-extrabold">
                    {formatSubscriptionPlan(dashboard.subscription.subscription_plan)}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Status</p>
                  <p className="mt-2 text-xl font-extrabold">
                    {formatSubscriptionStatusLabel(
                      dashboard.subscription.subscription_status,
                    )}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Renews</p>
                  <p className="mt-2 text-xl font-extrabold">
                    {dashboard.subscription.subscription_current_period_end
                      ? formatDateTime(
                          dashboard.subscription.subscription_current_period_end,
                        )
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">Booper pack</p>
                  <p className="mt-2 text-xl font-extrabold">
                    {dashboard.subscription.booper_pack_included
                      ? formatBooperPackStatus(
                          dashboard.subscription.booper_pack_status,
                        )
                      : "Not included"}
                  </p>
                </div>

                {dashboard.subscription.subscription_provider === "stripe" ? (
                  <div className="grid gap-3 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                    <div>
                      <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                        Manage subscription
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                        Use Stripe for payment methods and billing history. Cancel only here in
                        goodKiddo.
                      </p>
                    </div>

                    {dashboard.subscription.subscription_cancel_at_period_end ? (
                      <div className="rounded-[1.2rem] bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                        Cancellation is already scheduled for{" "}
                        {dashboard.subscription.subscription_current_period_end
                          ? formatDateTime(
                              dashboard.subscription.subscription_current_period_end,
                            )
                          : "the end of this billing period"}
                        .
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <form action={openStripeBillingPortalAction}>
                        <LoadingSubmitButton
                          className="btn btn-secondary"
                          pendingLabel="Opening Stripe..."
                        >
                          Manage billing on Stripe
                        </LoadingSubmitButton>
                      </form>

                      <form action={toggleParentSubscriptionCancellationAction}>
                        <input
                          name="mode"
                          type="hidden"
                          value={
                            dashboard.subscription.subscription_cancel_at_period_end
                              ? "resume"
                              : "cancel"
                          }
                        />
                        <LoadingSubmitButton
                          className={
                            dashboard.subscription.subscription_cancel_at_period_end
                              ? "btn btn-secondary"
                              : "btn btn-primary"
                          }
                          pendingLabel={
                            dashboard.subscription.subscription_cancel_at_period_end
                              ? "Keeping subscription..."
                              : "Cancelling..."
                          }
                        >
                          {dashboard.subscription.subscription_cancel_at_period_end
                            ? "Keep subscription"
                            : "Cancel subscription"}
                        </LoadingSubmitButton>
                      </form>
                    </div>
                  </div>
                ) : dashboard.subscription.subscription_plan === "beta_1_0" ? (
                  <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                    <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                      Manage subscription
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      Beta 1.0 access is managed by goodKiddo Super Admin.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                    <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                      Manage subscription
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      This family is not linked to a live Stripe subscription yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Choose a plan first to start the Stripe subscription flow.
              </div>
            )}
          </details>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div className="min-w-0">
                <p className="eyebrow">Child mode PIN</p>
                <h2 className="mt-2 text-3xl font-extrabold">Parent unlock code</h2>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Save a 4-digit parent PIN for child mode exit.
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

            {typeof dashboard.family?.parent_pin === "string" ? (
              <form action={updateParentPinAction} className="mt-6 grid gap-3">
                <input
                  className="field text-center text-xl tracking-[0.4em]"
                  inputMode="numeric"
                  maxLength={4}
                  name="parentPin"
                  pattern="[0-9]{4}"
                  placeholder="New PIN"
                  required
                  type="password"
                />
                <input
                  className="field text-center text-xl tracking-[0.4em]"
                  inputMode="numeric"
                  maxLength={4}
                  name="confirmParentPin"
                  pattern="[0-9]{4}"
                  placeholder="Confirm PIN"
                  required
                  type="password"
                />
                <LoadingSubmitButton
                  className="btn btn-primary sm:w-fit"
                  pendingLabel="Saving..."
                >
                  Save parent PIN
                </LoadingSubmitButton>
              </form>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Run the latest family migration before saving the parent PIN here.
              </div>
            )}
          </details>
        </ShellCard>
      </section>
    </main>
  );
}
