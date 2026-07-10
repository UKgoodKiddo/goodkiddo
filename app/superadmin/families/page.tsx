import {
  assignInventoryToFamilyAction,
  releaseInventoryFromFamilyAction,
  updateInventoryStatusAction,
  upsertFamilySubscriptionAction,
  viewSuperAdminFamilyAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getSuperAdminStatusBanner } from "@/lib/super-admin-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import {
  BOOPER_PACK_STATUS_OPTIONS,
  SUBSCRIPTION_PROVIDER_OPTIONS,
  SUBSCRIPTION_STATUS_OPTIONS,
  formatBooperPackStatus,
  formatSubscriptionPlan,
  formatSubscriptionStatusLabel,
} from "@/lib/subscriptions";
import { formatDateTime, formatInventoryStatus } from "@/lib/utils";

export default async function SuperAdminFamiliesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getSuperAdminDashboardData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getSuperAdminStatusBanner(bannerCode, searchParams);
  const selectedFamilyId =
    typeof searchParams.familyId === "string" ? searchParams.familyId : null;
  const selectedFamily =
    dashboard.families.find((family) => family.familyId === selectedFamilyId) ?? null;
  const assignedInventory = selectedFamily
    ? dashboard.inventory.filter((item) => item.family_id === selectedFamily.familyId)
    : [];
  const otherFamilies = dashboard.families.filter(
    (family) => family.familyId !== selectedFamily?.familyId,
  );

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">Families</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Open a family to view assigned boopers and manage the live subscription
            record without reading child-profile data.
          </p>

          <div className="mt-6 space-y-3">
            {dashboard.families.length ? (
              dashboard.families.map((family) => (
                <form key={family.familyId} action={viewSuperAdminFamilyAction}>
                  <input name="familyId" type="hidden" value={family.familyId} />
                  <LoadingSubmitButton
                    className={`list-row flex w-full items-center justify-between rounded-[1.4rem] p-4 text-left transition-colors ${
                      selectedFamily?.familyId === family.familyId
                        ? "border-[color:var(--primary)] bg-[rgba(20,86,216,0.08)]"
                        : ""
                    }`}
                    pendingLabel="Opening..."
                  >
                    <div>
                      <p className="text-lg font-extrabold">{family.familyName}</p>
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                        {family.parentEmail ?? family.parentUserId}
                      </p>
                    </div>
                    <StatusPill tone="sky">{family.assignedInventoryCount} boopers</StatusPill>
                  </LoadingSubmitButton>
                </form>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
                No families exist yet.
              </div>
            )}
          </div>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          {selectedFamily ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold">{selectedFamily.familyName}</h2>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Parent: {selectedFamily.parentEmail ?? selectedFamily.parentUserId}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Started {formatDateTime(selectedFamily.createdAt)}
                  </p>
                </div>
                <StatusPill
                  tone={
                    selectedFamily.subscription?.subscription_status === "active"
                      ? "mint"
                      : "sun"
                  }
                >
                  {selectedFamily.subscription
                    ? `${formatSubscriptionStatusLabel(
                        selectedFamily.subscription.subscription_status,
                      )} · ${formatSubscriptionPlan(
                        selectedFamily.subscription.subscription_plan,
                      )}`
                    : "No subscription"}
                </StatusPill>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-3">
                  <h3 className="text-xl font-extrabold">Assigned boopers</h3>
                  {assignedInventory.length ? (
                    assignedInventory.map((item) => (
                      <div key={item.id} className="list-row rounded-[1.4rem] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold">{item.uid}</p>
                          <StatusPill tone={item.status === "assigned" ? "mint" : "sun"}>
                            {formatInventoryStatus(item.status)}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                          Batch: {item.batch_number}
                        </p>
                        <div className="mt-3 grid gap-2">
                          <div className="grid gap-2 sm:grid-cols-3">
                            <form action={updateInventoryStatusAction}>
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <input name="status" type="hidden" value="disabled" />
                              <LoadingSubmitButton
                                className="btn btn-secondary w-full"
                                pendingLabel="Saving..."
                              >
                                Disable
                              </LoadingSubmitButton>
                            </form>
                            <form action={updateInventoryStatusAction}>
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <input name="status" type="hidden" value="lost" />
                              <LoadingSubmitButton
                                className="btn btn-secondary w-full"
                                pendingLabel="Saving..."
                              >
                                Mark lost
                              </LoadingSubmitButton>
                            </form>
                            <form action={releaseInventoryFromFamilyAction}>
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <LoadingSubmitButton
                                className="btn btn-ghost w-full"
                                pendingLabel="Releasing..."
                              >
                                Release
                              </LoadingSubmitButton>
                            </form>
                          </div>

                          {otherFamilies.length ? (
                            <form
                              action={assignInventoryToFamilyAction}
                              className="grid gap-2 sm:grid-cols-[1fr_auto]"
                            >
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <select className="field" defaultValue="" name="familyId" required>
                                <option value="">Reassign to another family</option>
                                {otherFamilies.map((family) => (
                                  <option key={family.familyId} value={family.familyId}>
                                    {family.familyName}
                                  </option>
                                ))}
                              </select>
                              <LoadingSubmitButton
                                className="btn btn-primary"
                                pendingLabel="Reassigning..."
                              >
                                Reassign
                              </LoadingSubmitButton>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
                      No boopers are assigned to this family yet.
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold">Subscription</h3>
                  <form action={upsertFamilySubscriptionAction} className="mt-4 grid gap-3">
                    <input name="familyId" type="hidden" value={selectedFamily.familyId} />
                    <select
                      className="field"
                      defaultValue={
                        selectedFamily.subscription?.subscription_plan ?? "beta_1_0"
                      }
                      name="subscriptionPlan"
                    >
                      <option value="monthly_family_plus">Monthly Family+</option>
                      <option value="yearly_family_plus">Yearly Family+</option>
                      <option value="beta_1_0">Beta 1.0</option>
                    </select>
                    <select
                      className="field"
                      defaultValue={
                        selectedFamily.subscription?.subscription_status ?? "inactive"
                      }
                      name="subscriptionStatus"
                    >
                      {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatSubscriptionStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="field"
                      defaultValue={
                        selectedFamily.subscription?.subscription_provider ?? "manual"
                      }
                      name="subscriptionProvider"
                    >
                      {SUBSCRIPTION_PROVIDER_OPTIONS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider === "stripe" ? "Stripe" : "Manual"}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field"
                      defaultValue={
                        selectedFamily.subscription?.subscription_current_period_end?.slice(
                          0,
                          10,
                        ) ?? ""
                      }
                      name="subscriptionCurrentPeriodEnd"
                      type="date"
                    />
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.stripe_customer_id ?? ""}
                      name="stripeCustomerId"
                      placeholder="Stripe customer ID"
                    />
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.stripe_subscription_id ?? ""}
                      name="stripeSubscriptionId"
                      placeholder="Stripe subscription ID"
                    />
                    <label className="inline-flex items-center gap-3 rounded-[1.2rem] bg-[#f8fbff] px-4 py-4 text-sm font-bold text-[color:var(--foreground)]">
                      <input
                        defaultChecked={
                          selectedFamily.subscription?.booper_pack_included ?? false
                        }
                        name="booperPackIncluded"
                        type="checkbox"
                        value="true"
                      />
                      Starter Booper pack included
                    </label>
                    <select
                      className="field"
                      defaultValue={selectedFamily.subscription?.booper_pack_status ?? ""}
                      name="booperPackStatus"
                    >
                      <option value="">No pack status</option>
                      {BOOPER_PACK_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatBooperPackStatus(status)}
                        </option>
                      ))}
                    </select>
                    <LoadingSubmitButton
                      className="btn btn-primary"
                      pendingLabel="Saving..."
                    >
                      Save subscription
                    </LoadingSubmitButton>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center rounded-[1.6rem] border border-dashed border-[color:var(--line-strong)] p-6 text-center text-sm leading-7 text-[color:var(--ink-soft)]">
              Choose a family on the left to log a family-view event, inspect assigned
              boopers, and update the subscription record.
            </div>
          )}
        </ShellCard>
      </section>
    </main>
  );
}
