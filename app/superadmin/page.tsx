import Link from "next/link";
import { Banner } from "@/components/banner";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getSuperAdminStatusBanner } from "@/lib/super-admin-status";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import { formatDateTime, formatSubscriptionStatus } from "@/lib/utils";

export default async function SuperAdminPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboard, searchParams] = await Promise.all([
    getSuperAdminDashboardData(),
    props.searchParams,
  ]);

  const bannerCode =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const banner = getSuperAdminStatusBanner(bannerCode, searchParams);

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <ShellCard className="rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight">System overview</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              Manage booper inventory, family controls, super-admin users, and audit history from one secure workspace. Child profiles stay private to parents and are not exposed here.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#fff1e8,#ffffff)] px-5 py-4 text-right">
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">Viewer</p>
            <p className="mt-2 text-lg font-extrabold">{dashboard.viewerEmail ?? "super admin"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="parent-soft-panel rounded-[1.5rem] p-5">
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">Families</p>
            <p className="mt-2 text-4xl font-extrabold">{dashboard.totalFamilies}</p>
          </div>
          <div className="parent-soft-panel rounded-[1.5rem] p-5">
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">Boopers in stock</p>
            <p className="mt-2 text-4xl font-extrabold">
              {dashboard.totalInventory - dashboard.totalAssignedInventory}
            </p>
          </div>
          <div className="parent-soft-panel rounded-[1.5rem] p-5">
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">Assigned boopers</p>
            <p className="mt-2 text-4xl font-extrabold">{dashboard.totalAssignedInventory}</p>
          </div>
          <div className="parent-soft-panel rounded-[1.5rem] p-5">
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">Super admins</p>
            <p className="mt-2 text-4xl font-extrabold">{dashboard.superAdminUsers.length}</p>
          </div>
        </div>
      </ShellCard>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ShellCard className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">Family overview</h2>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                Family-level summaries only. No child rows are queried or shown here.
              </p>
            </div>
            <Link className="text-sm font-black text-[color:var(--primary)]" href="/superadmin/families">
              Open families
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.families.slice(0, 6).map((family) => (
              <div key={family.familyId} className="list-row rounded-[1.4rem] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-extrabold">{family.familyName}</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      Parent: {family.parentEmail ?? family.parentUserId}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      Started {formatDateTime(family.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={family.subscription?.status === "active" ? "mint" : "sun"}>
                      {family.subscription
                        ? `${formatSubscriptionStatus(family.subscription.status)} · ${family.subscription.plan_code}`
                        : "No subscription"}
                    </StatusPill>
                    <StatusPill tone="sky">
                      {family.assignedInventoryCount} assigned boopers
                    </StatusPill>
                  </div>
                </div>
              </div>
            ))}
            {!dashboard.families.length ? (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
                No families exist yet.
              </div>
            ) : null}
          </div>
        </ShellCard>

        <ShellCard className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">Recent audit</h2>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                Import, reassignment, family view, and subscription placeholder events.
              </p>
            </div>
            <Link className="text-sm font-black text-[color:var(--primary)]" href="/superadmin/audit">
              Full audit
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.auditLogs.slice(0, 8).map((entry) => (
              <div key={entry.id} className="list-row rounded-[1.4rem] p-4">
                <p className="font-extrabold">{entry.action}</p>
                <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                  {entry.actorEmail ?? entry.actor_user_id}
                </p>
                <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                  {entry.target_type}
                  {entry.target_id ? ` · ${entry.target_id}` : ""}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  {formatDateTime(entry.created_at)}
                </p>
              </div>
            ))}
            {!dashboard.auditLogs.length ? (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm text-[color:var(--ink-soft)]">
                No audit log entries yet.
              </div>
            ) : null}
          </div>
        </ShellCard>
      </section>
    </main>
  );
}
