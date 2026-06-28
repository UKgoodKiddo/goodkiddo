import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getSuperAdminDashboardData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminUsersPage() {
  const dashboard = await getSuperAdminDashboardData();

  return (
    <main className="flex flex-1 flex-col gap-6">
      <ShellCard className="rounded-[2rem] p-6">
        <h2 className="text-3xl font-extrabold">Super admin users</h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
          Access is granted only to active rows in `super_admin_users`, and every super-admin page still performs its access check on the server.
        </p>
      </ShellCard>

      <div className="grid gap-4">
        {dashboard.superAdminUsers.length ? (
          dashboard.superAdminUsers.map((entry) => (
            <ShellCard key={entry.id} className="rounded-[2rem] p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-extrabold">{entry.email}</h3>
                    <StatusPill tone={entry.active ? "mint" : "rose"}>
                      {entry.active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Auth email: {entry.authEmail ?? "Not resolved"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Role: {entry.role}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Added {formatDateTime(entry.created_at)}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-[rgba(20,86,216,0.06)] px-4 py-3 text-sm font-bold text-[color:var(--ink-soft)]">
                  User ID: {entry.user_id}
                </div>
              </div>
            </ShellCard>
          ))
        ) : (
          <ShellCard className="rounded-[2rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">No super admin users found.</p>
          </ShellCard>
        )}
      </div>
    </main>
  );
}
