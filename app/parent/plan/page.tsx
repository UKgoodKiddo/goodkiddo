import { redirect } from "next/navigation";
import { startStripeCheckoutAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import {
  SUBSCRIPTION_PLAN_OPTIONS,
  formatBooperPackStatus,
  formatSubscriptionPlan,
  formatSubscriptionStatusLabel,
} from "@/lib/subscriptions";

function getPlanStatusBanner(code?: string) {
  switch (code) {
    case "checkout-cancelled":
      return {
        message: "Checkout was cancelled before payment was completed.",
        tone: "sun" as const,
      };
    case "checkout-processing":
      return {
        message: "We are still waiting for Stripe to finish syncing that checkout. Please try again in a moment.",
        tone: "sky" as const,
      };
    case "action-failed":
      return {
        message: "That Stripe action could not be completed. Please try again.",
        tone: "rose" as const,
      };
    default:
      return null;
  }
}

export default async function ParentPlanPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getParentDashboardData(),
    props.searchParams,
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  if (!dashboard.family) {
    redirect("/parent");
  }

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getPlanStatusBanner(bannerCode);
  const currentSubscription = dashboard.subscription;
  const currentPlanChosen = Boolean(currentSubscription?.subscription_plan);

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <ShellCard className="rounded-[2rem] p-6 sm:p-8">
        <h2 className="text-4xl font-extrabold">Choose your plan</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
          Pick the Family+ plan that fits your household. Beta 1.0 is kept private
          and can only be assigned by SuperAdmin.
        </p>
      </ShellCard>

      {currentPlanChosen ? (
        <ShellCard className="rounded-[2rem] p-6 sm:p-8">
          <h3 className="text-3xl font-extrabold">Current plan</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Plan</p>
              <p className="mt-2 text-xl font-extrabold">
                {formatSubscriptionPlan(currentSubscription?.subscription_plan)}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Status</p>
              <p className="mt-2 text-xl font-extrabold">
                {formatSubscriptionStatusLabel(currentSubscription?.subscription_status)}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Renews</p>
              <p className="mt-2 text-xl font-extrabold">
                {currentSubscription?.subscription_current_period_end
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(currentSubscription.subscription_current_period_end))
                  : "Not set"}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--ink-soft)]">Booper pack</p>
              <p className="mt-2 text-xl font-extrabold">
                {currentSubscription?.booper_pack_included
                  ? formatBooperPackStatus(currentSubscription.booper_pack_status)
                  : "Not included"}
              </p>
            </div>
          </div>
        </ShellCard>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        {SUBSCRIPTION_PLAN_OPTIONS.map((plan) => (
          <ShellCard key={plan.id} className="rounded-[2rem] p-6 sm:p-8">
            <h3 className="text-3xl font-extrabold">{plan.label}</h3>
            <p className="mt-3 text-lg font-black text-[color:var(--primary-strong)]">
              {plan.priceLabel}
            </p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
              {plan.description}
            </p>
            <form action={startStripeCheckoutAction} className="mt-6">
              <input name="plan" type="hidden" value={plan.id} />
              <LoadingSubmitButton
                className="btn btn-primary w-full"
                pendingLabel="Opening Checkout..."
              >
                Continue with {plan.label}
              </LoadingSubmitButton>
            </form>
          </ShellCard>
        ))}
      </section>
    </main>
  );
}
