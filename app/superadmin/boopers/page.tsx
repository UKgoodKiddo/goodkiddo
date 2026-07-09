import {
  assignInventoryToFamilyAction,
  importBooperInventoryAction,
  releaseInventoryFromFamilyAction,
  updateInventoryStatusAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { SuperAdminUidImportForm } from "@/components/superadmin-uid-import-form";
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
  const batchNumbers = Array.from(
    new Set(
      dashboard.inventory
        .map((item) => item.batch_number)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">CSV UID import</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Paste supplier CSV data or upload a CSV file, assign a batch number, and import only brand-new UIDs as available boopers.
          </p>

          <SuperAdminUidImportForm action={importBooperInventoryAction} />
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">Import rules</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            <p>Only active super admins can import or assign inventory.</p>
            <p>New UIDs are inserted as `available` and linked to the batch number you provide.</p>
            <p>Existing UIDs are skipped and counted as duplicates in the import summary.</p>
            <p>UIDs must match the allowed import format and are normalized to uppercase with spaces removed.</p>
            <p>Optional CSV columns `ndef_url` and `ndef_text` are supported for pre-encoded tags.</p>
            <p>
              You can also generate those values during import with{" "}
              <code>{"{uid}"}</code> templates in the optional fields above.
            </p>
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">TagWriter NDEF export</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Create a TagWriter-ready CSV from imported Boopers. This export writes one URL record
            per row using stored `ndef_url` values first, then falls back to your chosen base URL
            plus each UID.
          </p>

          <form
            action="/superadmin/boopers/tagwriter"
            className="mt-6 grid gap-3"
            method="GET"
            target="_blank"
          >
            <select className="field" defaultValue="" name="batchNumber">
              <option value="">Export every imported batch</option>
              {batchNumbers.map((batchNumber) => (
                <option key={batchNumber} value={batchNumber}>
                  {batchNumber}
                </option>
              ))}
            </select>
            <input
              className="field"
              defaultValue="https://goodkiddo.co.uk/b"
              name="baseUrl"
              placeholder="Base URL e.g. https://goodkiddo.co.uk/b"
            />
            <LoadingSubmitButton className="btn btn-primary" pendingLabel="Exporting...">
              Export TagWriter CSV
            </LoadingSubmitButton>
          </form>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          <h2 className="text-3xl font-extrabold">What gets encoded</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            <p>
              Format: `LINK_RECORD`,`https://goodkiddo.co.uk/b/[uid]`,`URL`,`description`
            </p>
            <p>
              Best practice is still a plain HTTPS link only. The tag should not store boops,
              names, or any family data.
            </p>
            <p>
              If you imported `ndef_url`, that exact URL is exported. If not, the export builds one
              from the base URL field and each UID.
            </p>
            <p>
              The description column uses imported `ndef_text` when available, otherwise the
              Booper serial label.
            </p>
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
                    {item.ndef_url ? (
                      <p className="mt-1 break-all text-sm text-[color:var(--ink-soft)]">
                        NDEF URL: {item.ndef_url}
                      </p>
                    ) : null}
                    {item.ndef_text ? (
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                        NDEF text: {item.ndef_text}
                      </p>
                    ) : null}
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
                      <LoadingSubmitButton
                        className="btn btn-primary w-full"
                        pendingLabel={item.family_id ? "Reassigning..." : "Assigning..."}
                      >
                        {item.family_id ? "Reassign booper" : "Assign booper"}
                      </LoadingSubmitButton>
                    </form>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <form action={updateInventoryStatusAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
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
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <input name="status" type="hidden" value="lost" />
                        <LoadingSubmitButton
                          className="btn btn-secondary w-full"
                          pendingLabel="Saving..."
                        >
                          Mark lost
                        </LoadingSubmitButton>
                      </form>
                      <form action={updateInventoryStatusAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <input
                          name="status"
                          type="hidden"
                          value={item.family_id ? "assigned" : "available"}
                        />
                        <LoadingSubmitButton
                          className="btn btn-ghost w-full"
                          pendingLabel="Restoring..."
                        >
                          Restore
                        </LoadingSubmitButton>
                      </form>
                    </div>

                    {item.family_id ? (
                      <form action={releaseInventoryFromFamilyAction}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <input name="returnTo" type="hidden" value="/superadmin/boopers" />
                        <LoadingSubmitButton
                          className="btn btn-ghost w-full"
                          pendingLabel="Releasing..."
                        >
                          Release from family
                        </LoadingSubmitButton>
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
