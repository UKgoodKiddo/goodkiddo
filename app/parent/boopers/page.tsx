import { redirect } from "next/navigation";
import {
  assignBooperToChildAction,
  collectWaitingBoopsForChildAction,
  awardBoopFromNfcAction,
  pairBooperAction,
  updateBooperStatusAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { NfcUidCapture } from "@/components/nfc-uid-capture";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";

export default async function ParentBoopersPage(props: {
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
  const prefilledBooperUid =
    typeof searchParams.booperUid === "string"
      ? searchParams.booperUid.trim()
      : "";
  const booperCountByChildId = new Map<string, number>();

  for (const booper of dashboard.boopers) {
    if (!booper.child_profile_id) {
      continue;
    }

    booperCountByChildId.set(
      booper.child_profile_id,
      (booperCountByChildId.get(booper.child_profile_id) ?? 0) + 1,
    );
  }

  const pendingByChildId = new Map<string, number>();
  for (const award of dashboard.pendingBoopAwards) {
    pendingByChildId.set(
      award.child_profile_id,
      (pendingByChildId.get(award.child_profile_id) ?? 0) + award.amount,
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      {prefilledBooperUid ? (
        <ShellCard className="rounded-[1.8rem] p-5">
          <p className="text-sm font-bold text-[color:var(--ink-soft)]">
            Booper tag opened
          </p>
          <p className="mt-2 text-xl font-extrabold">{prefilledBooperUid}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            This UID came from the encoded wristband link. Use the sections below to collect waiting boops, assign the Booper, or run a parent-side test.
          </p>
        </ShellCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <h2 className="text-3xl font-extrabold">Collect waiting Boops</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Use this on the parent phone. Scan the child&apos;s assigned Booper to move approved waiting boops into their spendable balance.
          </p>
          <div className="mt-6 grid gap-4">
            {dashboard.children.length ? (
              dashboard.children.map((child) => {
                const waitingBoops = pendingByChildId.get(child.id) ?? 0;

                return (
                  <form
                    action={collectWaitingBoopsForChildAction}
                    className="parent-soft-panel rounded-[1.5rem] p-4"
                    key={child.id}
                  >
                    <input type="hidden" name="childProfileId" value={child.id} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold">{child.display_name}</p>
                        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                          {waitingBoops} waiting boop{waitingBoops === 1 ? "" : "s"} to collect
                        </p>
                      </div>
                      <StatusPill tone={waitingBoops > 0 ? "sun" : "sky"}>
                        {waitingBoops > 0 ? "Ready to collect" : "Nothing waiting"}
                      </StatusPill>
                    </div>
                    <div className="mt-4">
                      <NfcUidCapture
                        autoSubmit
                        buttonLabel={`Scan Booper to collect for ${child.display_name}`}
                        defaultValue={prefilledBooperUid}
                        helperText={
                          waitingBoops > 0
                            ? "On supported phones, scanning will auto-submit. Desktop testing can still use manual UID entry."
                            : "This child has nothing waiting right now, but you can still test with a manual UID on desktop."
                        }
                        inputLabel="Assigned Booper UID"
                        inputName="nfcUid"
                        required
                      />
                    </div>
                    <button className="btn btn-secondary mt-4 w-full sm:w-auto" type="submit">
                      Collect waiting Boops
                    </button>
                  </form>
                );
              })
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Create a child profile first, then use the parent phone to collect waiting boops here.
              </div>
            )}
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <h2 className="text-3xl font-extrabold">Assign a new Booper</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Tap scan on the right child, approve NFC access if your device asks,
            then hold the wristband against the device. The UID must already
            exist in supplier inventory and still be available.
          </p>
          <div className="mt-6 grid gap-4">
            {dashboard.children.length ? (
              dashboard.children.map((child) => (
                <form
                  action={assignBooperToChildAction}
                  className="parent-soft-panel rounded-[1.5rem] p-4"
                  key={child.id}
                >
                  <input type="hidden" name="childProfileId" value={child.id} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{child.display_name}</p>
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                        {booperCountByChildId.get(child.id) ?? 0} linked Boopers
                      </p>
                    </div>
              <button className="btn btn-primary px-5 py-2.5 text-sm" type="submit">
                Assign manually
              </button>
                  </div>
                  <div className="mt-4">
                    <NfcUidCapture
                      autoSubmit
                      buttonLabel={`Scan wristband for ${child.display_name}`}
                      defaultValue={prefilledBooperUid}
                      helperText="On supported devices, scanning will auto-submit. You can also type the supplier UID and use Assign manually."
                      inputLabel="Imported Booper UID"
                      inputName="nfcUid"
                      required
                    />
                  </div>
                </form>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
                Create a child profile first, then assign a Booper here.
              </div>
            )}
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <h2 className="text-3xl font-extrabold">Award boops from a test UID</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Manual UID entry still works for development, but only imported and
            assigned Boopers can award boops.
          </p>
          <form action={awardBoopFromNfcAction} className="mt-6 grid gap-3">
            <NfcUidCapture
              buttonLabel="Scan Booper wristband"
              defaultValue={prefilledBooperUid}
              helperText="Use NFC on a compatible device, or type the paired supplier UID manually."
              inputLabel="Booper UID for award test"
              inputName="nfcUid"
              required
            />
            <input
              className="field"
              min={1}
              name="amount"
              placeholder="Boop amount"
              required
              type="number"
            />
            <input
              className="field"
              name="reason"
              placeholder="Reason for the NFC boop"
              required
            />
            <button className="btn btn-secondary" type="submit">
              Test award from UID
            </button>
          </form>
        </ShellCard>
      </section>

      <section className="grid gap-4">
        {dashboard.boopers.length ? (
          dashboard.boopers.map((booper) => (
            <ShellCard key={booper.id} className="rounded-[1.8rem] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-extrabold">{booper.label}</h3>
                    <StatusPill tone={booper.status === "active" ? "mint" : "rose"}>
                      {booper.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-sm text-[color:var(--ink-soft)]">
                    {booper.nfc_uid}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["active", "lost", "disabled"] as const).map((status) => (
                    <form action={updateBooperStatusAction} key={status}>
                      <input type="hidden" name="booperId" value={booper.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className="btn btn-ghost px-4 py-2 text-sm" type="submit">
                        Mark {status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={pairBooperAction} className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input type="hidden" name="booperId" value={booper.id} />
                <select
                  className="field"
                  defaultValue={booper.child_profile_id ?? ""}
                  name="childProfileId"
                >
                  <option value="">Leave unpaired</option>
                  {dashboard.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.display_name}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" type="submit">
                  Save pairing
                </button>
              </form>
            </ShellCard>
          ))
        ) : (
          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">
              No imported Boopers have been assigned to your family yet.
            </p>
          </ShellCard>
        )}
      </section>
    </main>
  );
}
