import {
  assignInventoryToFamilyAction,
  importBooperInventoryAction,
  releaseInventoryFromFamilyAction,
  updateInventoryStatusAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getSuperAdminStatusBanner } from "@/lib/super-admin-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import { formatDateTime, formatInventoryStatus } from "@/lib/utils";

export default async function SuperAdminBoopersPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getSuperAdminDashboardData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getSuperAdminStatusBanner(bannerCode, searchParams);
  const familyNameLookup = new Map(
    dashboard.families.map((family) => [family.familyId, family.familyName]),
  );

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">CSV UID import</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Paste supplier CSV data or upload a CSV file, assign a batch number, and import only brand-new UIDs as available boopers.
          </p>

          <form action={importBooperInventoryAction} className="mt-6 grid gap-3">
            <input
              className="field"
              name="batchNumber"
              placeholder="Batch number e.g. JULY-2026-A"
              required
            />
            <textarea
              className="field min-h-36"
              name="csvText"
              placeholder={"Paste CSV here if you do not want to upload a file.\nuid\n04A224FF9911"}
            />
            <input
              accept=".csv,text/csv"
              className="field"
              name="inventoryFile"
              type="file"
            />
            <button className="btn btn-primary" type="submit">
              Import booper UIDs
            </button>
          </form>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">Import rules</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            <p>Only active super admins can import or assign inventory.</p>
            <p>New UIDs are inserted as `available` and linked to the batch number you provide.</p>
            <p>Existing UIDs are skipped and counted as duplicates in the import summary.</p>
            <p>UIDs must match the allowed import format and are normalized to uppercase with spaces removed.</p>
          </div>
        </ShellCard>
      </section>

      <ShellCard className="rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">Booper inventory</h2>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Assign, reassign, release, disable, or mark a booper as lost. Parent pairing to children stays inside the family account.
            </p>
          </div>
          <StatusPill tone="sky">{dashboard.inventory.length} total boopers</StatusPill>
        </div>

        <div className="mt-6 space-y-3">
          {dashboard.inventory.length ? (
            dashboard.inventory.map((item) => (
              <div key={item.id} className="list-row rounded-[1.5rem] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold">{item.uid}</p>
                      <StatusPill tone={item.family_id ? "mint" : "sun"}>
                        {formatInventoryStatus(item.status)}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      Batch: {item.batch_number}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {item.family_id
                        ? `Assigned to ${familyNameLookup.get(item.family_id) ?? item.family_id}`
                        : "Not assigned to a family"}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      Imported {formatDateTime(item.imported_at)}
                    </p>
                    {item.notes ? (
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">Notes: {item.notes}</p>
                    ) : null}
                  </div>

                  <div className="grid w-full max-w-md gap-3">
                    <form action={assignInventoryToFamilyAction} className="grid gap-3">
                      <input name="inventoryId" type="hidden" value={item.id} />
                      <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                      <select className="field" defaultValue={item.family_id ?? ""} name="familyId" required>
                        <option value="">Assign to family</option>
                        {dashboard.families.map((family) => (
                          <option key={family.familyId} value={family.familyId}>
                            {family.familyName}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-primary w-full" type="submit">
                        {item.family_id ? "Reassign booper" : "Assign booper"}
                      </button>
                    </form>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <form action={updateInventoryStatusAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <input name="status" type="hidden" value="disabled" />
                        <button className="btn btn-secondary w-full" type="submit">
                          Disable
                        </button>
                      </form>
                      <form action={updateInventoryStatusAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <input name="status" type="hidden" value="lost" />
                        <button className="btn btn-secondary w-full" type="submit">
                          Mark lost
                        </button>
                      </form>
                      <form action={updateInventoryStatusAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <input
                          name="status"
                          type="hidden"
                          value={item.family_id ? "assigned" : "available"}
                        />
                        <button className="btn btn-ghost w-full" type="submit">
                          Restore
                        </button>
                      </form>
                    </div>

                    {item.family_id ? (
                      <form action={releaseInventoryFromFamilyAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <button className="btn btn-ghost w-full" type="submit">
                          Release from family
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
              No booper inventory imported yet.
            </div>
          )}
        </div>
      </ShellCard>
    </main>
  );
}
