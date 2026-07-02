import Image from "next/image";
import { redirect } from "next/navigation";
import {
  approveRedemptionAction,
  approveTaskCompletionAction,
  rejectRedemptionAction,
  rejectTaskCompletionAction,
} from "@/app/actions";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import { resolveTaskCardAsset } from "@/lib/task-card-catalog";
import { formatDateTimeDetailed } from "@/lib/utils";

export default async function ParentApprovalsPage() {
  const dashboard = await getParentDashboardData();

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  const pendingRedemptions = dashboard.redemptions.filter(
    (redemption) => redemption.status === "pending",
  );

  return (
    <main className="flex flex-1 flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
            Task approvals
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">Pending completions</h2>
          <div className="mt-6 space-y-4">
            {dashboard.pendingTaskCompletions.length ? (
              await Promise.all(
                dashboard.pendingTaskCompletions.map(async (completion) => {
                  const taskAsset = await resolveTaskCardAsset(completion.taskTitle ?? "Task");

                  return (
                    <div key={completion.id} className="list-row rounded-[1.4rem] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="parent-task-inline-art">
                            {taskAsset?.parentAssetSrc ? (
                              <Image
                                alt={taskAsset.title}
                                className="h-auto w-full object-contain"
                                height={120}
                                src={taskAsset.parentAssetSrc}
                                width={120}
                              />
                            ) : (
                              <span className="px-3 text-center text-xs font-black text-[color:var(--foreground)]">
                                {completion.taskTitle ?? "Task"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold">
                              {completion.childName ?? "Child"} · {completion.taskTitle ?? "Task"}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              Submitted {formatDateTimeDetailed(completion.submitted_at)}
                            </p>
                          </div>
                        </div>
                        <StatusPill tone="sun">{completion.boopReward} boops</StatusPill>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={approveTaskCompletionAction}>
                          <input type="hidden" name="completionId" value={completion.id} />
                          <button className="btn btn-primary px-4 py-2 text-sm" type="submit">
                            Approve
                          </button>
                        </form>
                        <form action={rejectTaskCompletionAction}>
                          <input type="hidden" name="completionId" value={completion.id} />
                          <button className="btn btn-ghost px-4 py-2 text-sm" type="submit">
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                }),
              )
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                No task completions are waiting right now.
              </div>
            )}
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
            Reward approvals
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">Pending redemptions</h2>
          <div className="mt-6 space-y-4">
            {pendingRedemptions.length ? (
              pendingRedemptions.map((redemption) => (
                <div key={redemption.id} className="list-row rounded-[1.4rem] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold">
                        {redemption.childName ?? "Child"} · {redemption.rewardTitle ?? "Reward"}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                        Requested {formatDateTimeDetailed(redemption.created_at)}
                      </p>
                    </div>
                    <StatusPill tone="sky">{redemption.cost_at_redemption} boops</StatusPill>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={approveRedemptionAction}>
                      <input type="hidden" name="redemptionId" value={redemption.id} />
                      <button className="btn btn-primary px-4 py-2 text-sm" type="submit">
                        Approve
                      </button>
                    </form>
                    <form action={rejectRedemptionAction}>
                      <input type="hidden" name="redemptionId" value={redemption.id} />
                      <button className="btn btn-ghost px-4 py-2 text-sm" type="submit">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                No reward redemptions are waiting right now.
              </div>
            )}
          </div>
        </ShellCard>
      </section>
    </main>
  );
}
