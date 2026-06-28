import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createChildProfileAction,
  deleteChildProfileAction,
  updateChildProfileAction,
} from "@/app/actions";
import { Banner } from "@/components/banner";
import { NfcUidCapture } from "@/components/nfc-uid-capture";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import { getParentStatusBanner } from "@/lib/parent-status";
import { formatBoops, formatDateTime } from "@/lib/utils";

export default async function ParentChildrenPage(props: {
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Add child</p>
          <h2 className="mt-3 text-3xl font-extrabold">Create a child profile</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Children do not get email or password accounts. They only exist inside
            the family account.
          </p>

          {dashboard.family ? (
            <form
              action={createChildProfileAction}
              className="mt-6 grid gap-3"
            >
              <input type="hidden" name="familyId" value={dashboard.family.id} />
              <input type="hidden" name="returnTo" value="/parent/children" />
              <input
                className="field"
                name="displayName"
                placeholder="Child nickname"
                required
              />
              <label className="grid gap-2">
                <span className="text-sm font-bold text-[color:var(--ink-soft)]">
                  Avatar upload (optional, max 5MB)
                </span>
                <input
                  accept="image/*"
                  className="field file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--primary)] file:px-4 file:py-2 file:font-bold file:text-white"
                  name="avatarFile"
                  type="file"
                />
              </label>
              <NfcUidCapture
                buttonLabel="Scan and reserve a Booper (optional)"
                helperText="If this UID is already imported and available, it will be assigned to the child as soon as the profile is created."
                inputLabel="Optional Booper UID"
                inputName="booperUid"
              />
              <button className="btn btn-primary" type="submit">
                Add child profile
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
              Create the family first on the dashboard before adding children.
            </div>
          )}
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Balances</p>
          <h2 className="mt-3 text-3xl font-extrabold">Current spendable boops</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Child mode now launches from the dedicated picker so you always choose a real child profile first.
          </p>
          <Link className="btn btn-secondary mt-5 w-full sm:w-auto" href="/parent/child-mode">
            Open child mode picker
          </Link>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {dashboard.children.length ? (
              dashboard.children.map((child) => (
                <div key={child.id} className="metric-tile rounded-[1.4rem] p-4">
                  <p className="text-sm font-bold text-[color:var(--ink-soft)]">
                    {child.display_name}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[color:var(--primary-strong)]">
                    {formatBoops(child.boop_balance)}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    {formatBoops(pendingByChildId.get(child.id) ?? 0)} waiting to collect
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-4 text-sm text-[color:var(--ink-soft)] sm:col-span-2">
                Child balances will appear here once profiles exist.
              </div>
            )}
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-4">
        {dashboard.children.length ? (
          dashboard.children.map((child) => (
            <ShellCard
              key={child.id}
              className="rounded-[1.8rem] p-6"
              id={`child-${child.id}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    {child.avatar_url ? (
                      <Image
                        alt={`${child.display_name} avatar`}
                        className="h-14 w-14 rounded-[1.2rem] object-cover"
                        height={56}
                        src={child.avatar_url}
                        width={56}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[color:var(--sun)] text-lg font-black text-[color:var(--foreground)]">
                        {child.display_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-2xl font-extrabold">{child.display_name}</h3>
                    <StatusPill tone="sun">{formatBoops(child.boop_balance)}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Created {formatDateTime(child.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {formatBoops(pendingByChildId.get(child.id) ?? 0)} waiting to collect
                  </p>
                </div>
              </div>

              <form
                action={updateChildProfileAction}
                className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]"
              >
                <input type="hidden" name="childProfileId" value={child.id} />
                <input
                  className="field"
                  defaultValue={child.display_name}
                  name="displayName"
                  placeholder="Child nickname"
                  required
                />
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-[color:var(--ink-soft)]">
                    Replace avatar (optional, max 5MB)
                  </span>
                  <input
                    accept="image/*"
                    className="field file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--primary)] file:px-4 file:py-2 file:font-bold file:text-white"
                    name="avatarFile"
                    type="file"
                  />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span className="text-sm font-bold text-[color:var(--ink-soft)]">
                    Type {child.display_name} to confirm delete
                  </span>
                  <input
                    className="field"
                    name="confirmName"
                    placeholder={child.display_name}
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
                  <button className="btn btn-primary flex-1" type="submit">
                    Save child
                  </button>
                  <button
                    className="btn btn-danger flex-1"
                    formAction={deleteChildProfileAction}
                    type="submit"
                  >
                    Delete child
                  </button>
                </div>
              </form>
            </ShellCard>
          ))
        ) : (
          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">
              No child profiles yet.
            </p>
          </ShellCard>
        )}
      </section>
    </main>
  );
}
