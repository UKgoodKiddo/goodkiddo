import {
  assignInventoryToFamilyAction,
  releaseInventoryFromFamilyAction,
  updateInventoryStatusAction,
  upsertFamilySubscriptionAction,
  viewSuperAdminFamilyAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getSuperAdminStatusBanner } from "@/lib/super-admin-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import { formatDateTime, formatInventoryStatus, formatSubscriptionStatus } from "@/lib/utils";

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
            Open a family to view assigned boopers and the subscription placeholder without reading child-profile data.
          </p>

          <div className="mt-6 space-y-3">
            {dashboard.families.length ? (
              dashboard.families.map((family) => (
                <form key={family.familyId} action={viewSuperAdminFamilyAction}>
                  <input name="familyId" type="hidden" value={family.familyId} />
                  <button
                    className={`list-row flex w-full items-center justify-between rounded-[1.4rem] p-4 text-left transition-colors ${
                      selectedFamily?.familyId === family.familyId
                        ? "border-[color:var(--primary)] bg-[rgba(20,86,216,0.08)]"
                        : ""
                    }`}
                    type="submit"
                  >
                    <div>
                      <p className="text-lg font-extrabold">{family.familyName}</p>
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                        {family.parentEmail ?? family.parentUserId}
                      </p>
                    </div>
                    <StatusPill tone="sky">{family.assignedInventoryCount} boopers</StatusPill>
                  </button>
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
                <StatusPill tone={selectedFamily.subscription?.status === "active" ? "mint" : "sun"}>
                  {selectedFamily.subscription
                    ? `${formatSubscriptionStatus(selectedFamily.subscription.status)} · ${selectedFamily.subscription.plan_code}`
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
                              <button className="btn btn-secondary w-full" type="submit">
                                Disable
                              </button>
                            </form>
                            <form action={updateInventoryStatusAction}>
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <input name="status" type="hidden" value="lost" />
                              <button className="btn btn-secondary w-full" type="submit">
                                Mark lost
                              </button>
                            </form>
                            <form action={releaseInventoryFromFamilyAction}>
                              <input name="inventoryId" type="hidden" value={item.id} />
                              <input name="returnTo" type="hidden" value="/superadmin/families" />
                              <button className="btn btn-ghost w-full" type="submit">
                                Release
                              </button>
                            </form>
                          </div>

                          {otherFamilies.length ? (
                            <form action={assignInventoryToFamilyAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
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
                              <button className="btn btn-primary" type="submit">
                                Reassign
                              </button>
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
                  <h3 className="text-xl font-extrabold">Subscription placeholder</h3>
                  <form action={upsertFamilySubscriptionAction} className="mt-4 grid gap-3">
                    <input name="familyId" type="hidden" value={selectedFamily.familyId} />
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.plan_code ?? "starter"}
                      name="planCode"
                      placeholder="Plan code"
                      required
                    />
                    <select
                      className="field"
                      defaultValue={selectedFamily.subscription?.status ?? "trial"}
                      name="status"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past due</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.renewal_date?.slice(0, 10) ?? ""}
                      name="renewalDate"
                      type="date"
                    />
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.provider_customer_id ?? ""}
                      name="providerCustomerId"
                      placeholder="Provider customer ID"
                    />
                    <input
                      className="field"
                      defaultValue={selectedFamily.subscription?.provider_subscription_id ?? ""}
                      name="providerSubscriptionId"
                      placeholder="Provider subscription ID"
                    />
                    <button className="btn btn-primary" type="submit">
                      Save subscription placeholder
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center rounded-[1.6rem] border border-dashed border-[color:var(--line-strong)] p-6 text-center text-sm leading-7 text-[color:var(--ink-soft)]">
              Choose a family on the left to log a family-view event, inspect assigned boopers, and update the subscription placeholder.
            </div>
          )}
        </ShellCard>
      </section>
    </main>
  );
}
