import Image from "next/image";
import { redirect } from "next/navigation";
import {
  assignBooperToChildAction,
  createChildProfileAction,
  deleteChildProfileAction,
  updateBooperStatusAction,
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
  const statusChildId =
    typeof searchParams.childId === "string" ? searchParams.childId : undefined;
  const pendingByChildId = new Map<string, number>();
  const boopersByChildId = new Map<
    string,
    typeof dashboard.boopers
  >();

  for (const award of dashboard.pendingBoopAwards) {
    pendingByChildId.set(
      award.child_profile_id,
      (pendingByChildId.get(award.child_profile_id) ?? 0) + award.amount,
    );
  }

  for (const booper of dashboard.boopers) {
    if (!booper.child_profile_id) {
      continue;
    }

    const existing = boopersByChildId.get(booper.child_profile_id) ?? [];
    existing.push(booper);
    boopersByChildId.set(booper.child_profile_id, existing);
  }

  const booperAssignmentMessage =
    bannerCode === "booper-assigned" && statusChildId
      ? `Booper successfully assigned to ${
          dashboard.children.find((child) => child.id === statusChildId)?.display_name ?? "child"
        }`
      : bannerCode &&
          statusChildId &&
          ["action-failed", "booper-not-available", "booper-not-imported"].includes(bannerCode)
        ? "Booper failed to assign, please try again."
        : null;

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}
      {booperAssignmentMessage ? (
        <ShellCard className="rounded-[1.8rem] p-5">
          <p className="text-sm font-bold text-[color:var(--foreground)]">
            {booperAssignmentMessage}
          </p>
        </ShellCard>
      ) : null}

      <section>
        <ShellCard className="rounded-[1.8rem] p-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
              <div>
                <h2 className="text-3xl font-extrabold">Create a child profile</h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 4V16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    <path d="M4 10H16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </span>
              </div>
            </summary>

            <div className="mt-6">
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
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
            </div>
          </details>
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
              <details className="group" open={statusChildId === child.id ? true : undefined}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
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
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-extrabold">{child.display_name}</h3>
                        <StatusPill tone="sun">{formatBoops(child.boop_balance)}</StatusPill>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10 4V16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        <path d="M4 10H16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </span>
                  </div>
                </summary>

                <div className="mt-5">
                  <p className="text-sm text-[color:var(--ink-soft)]">
                    Created {formatDateTime(child.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {formatBoops(pendingByChildId.get(child.id) ?? 0)} waiting to collect
                  </p>

                  {(() => {
                    const linkedBoopers = boopersByChildId.get(child.id) ?? [];
                    const primaryBooper =
                      linkedBoopers.find((booper) => booper.status === "active") ??
                      linkedBoopers[0] ??
                      null;

                    return (
                      <div className="mt-5 rounded-[1.6rem] bg-[#f8fbff] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-extrabold">Booper</p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              {primaryBooper
                                ? `${linkedBoopers.length} linked Booper${
                                    linkedBoopers.length === 1 ? "" : "s"
                                  }`
                                : "No Booper linked yet"}
                            </p>
                          </div>
                          <StatusPill tone={primaryBooper?.status === "active" ? "mint" : "sky"}>
                            {primaryBooper?.status ?? "unassigned"}
                          </StatusPill>
                        </div>

                        <form action={assignBooperToChildAction} className="mt-4">
                          <input type="hidden" name="childProfileId" value={child.id} />
                          <input type="hidden" name="returnTo" value="/parent/children" />
                          <NfcUidCapture
                            autoSubmit
                            buttonClassName="w-full justify-center"
                            buttonLabel={`Assign a Booper to ${child.display_name}`}
                            helperText=""
                            inputName="nfcUid"
                            required
                            showInput={false}
                            showMessage={false}
                          />
                        </form>

                        {primaryBooper ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            <form action={updateBooperStatusAction} className="flex-1">
                              <input type="hidden" name="booperId" value={primaryBooper.id} />
                              <input type="hidden" name="childProfileId" value={child.id} />
                              <input type="hidden" name="returnTo" value="/parent/children" />
                              <input type="hidden" name="status" value="active" />
                              <button className="btn btn-secondary w-full" type="submit">
                                Mark active
                              </button>
                            </form>
                            <form action={updateBooperStatusAction} className="flex-1">
                              <input type="hidden" name="booperId" value={primaryBooper.id} />
                              <input type="hidden" name="childProfileId" value={child.id} />
                              <input type="hidden" name="returnTo" value="/parent/children" />
                              <input type="hidden" name="status" value="lost" />
                              <button className="btn btn-ghost w-full" type="submit">
                                Mark lost
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}

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
                    <button className="btn btn-primary lg:col-span-2" type="submit">
                      Save child
                    </button>
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
                    <button
                      className="btn btn-danger lg:col-span-2"
                      formAction={deleteChildProfileAction}
                      type="submit"
                    >
                      Delete child
                    </button>
                  </form>
                </div>
              </details>
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
