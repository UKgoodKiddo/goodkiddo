import { redirect } from "next/navigation";
import { updateParentPinAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ShellCard } from "@/components/shell-card";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
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

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getParentStatusBanner(bannerCode);

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Settings</p>
          <h2 className="mt-3 text-3xl font-extrabold">Family details</h2>
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
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Child mode PIN</p>
          <h2 className="mt-3 text-3xl font-extrabold">Parent unlock code</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Save a 4-digit parent PIN for exiting child mode. The default PIN is 0000 until you change it here.
          </p>

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
        </ShellCard>
      </section>
    </main>
  );
}
