import { ShellCard } from "@/components/shell-card";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import { formatDateTimeDetailed } from "@/lib/utils";

export default async function SuperAdminAuditPage() {
  const dashboard = await getSuperAdminDashboardData();

  return (
    <main className="flex flex-1 flex-col gap-6">
      <ShellCard className="rounded-[2rem] p-6">
        <h2 className="text-3xl font-extrabold">Audit log</h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
          Every secure super-admin action is logged here, including UID import, booper disable/lost/reassign flows, family views, and subscription changes.
        </p>
      </ShellCard>

      <div className="grid gap-4">
        {dashboard.auditLogs.length ? (
          dashboard.auditLogs.map((entry) => (
            <ShellCard key={entry.id} className="rounded-[2rem] p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-extrabold">{entry.action}</h3>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Actor: {entry.actorEmail ?? entry.actor_user_id}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Target: {entry.target_type}
                    {entry.target_id ? ` · ${entry.target_id}` : ""}
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-[1.2rem] bg-[rgba(20,86,216,0.05)] p-3 text-xs leading-6 text-[color:var(--foreground)]">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
                <div className="text-sm font-bold text-[color:var(--ink-soft)]">
                  {formatDateTimeDetailed(entry.created_at)}
                </div>
              </div>
            </ShellCard>
          ))
        ) : (
          <ShellCard className="rounded-[2rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">No audit logs recorded yet.</p>
          </ShellCard>
        )}
      </div>
    </main>
  );
}
