import Image from "next/image";
import { redirect } from "next/navigation";
import { deleteTaskAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { ParentTaskWizardLauncher } from "@/components/parent-task-wizard-launcher";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { getParentDashboardData } from "@/lib/data";
import {
  getTaskCardCatalog,
  resolveTaskCardAsset,
} from "@/lib/task-card-catalog";
import { subscriptionNeedsPlanSelection } from "@/lib/subscriptions";
import type { TaskWeekday } from "@/lib/types";
import { formatDateTimeDetailed } from "@/lib/utils";

const WEEKDAY_LABELS: Record<TaskWeekday, string> = {
  fri: "Fri",
  mon: "Mon",
  sat: "Sat",
  sun: "Sun",
  thu: "Thu",
  tue: "Tue",
  wed: "Wed",
};

function formatTaskSchedule(
  recurringType: "daily" | "none" | "weekly",
  weeklyDays: TaskWeekday[] | null | undefined,
) {
  if (recurringType === "daily") {
    return "Daily";
  }

  if (recurringType === "none") {
    return "One-off";
  }

  if (!weeklyDays?.length) {
    return "Weekly";
  }

  return `Weekly · ${weeklyDays.map((day) => WEEKDAY_LABELS[day]).join(" ")}`;
}

export default async function ParentTasksPage() {
  const [dashboard, taskCatalog] = await Promise.all([
    getParentDashboardData(),
    getTaskCardCatalog(),
  ]);

  if (dashboard.requiresAuth) {
    redirect("/auth/login");
  }

  if (dashboard.family && subscriptionNeedsPlanSelection(dashboard.subscription)) {
    redirect("/parent/plan?status=subscription-required");
  }

  const childOptions = dashboard.children.map((child) => ({
    avatarUrl: child.avatar_url,
    id: child.id,
    name: child.display_name,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <div className="parent-soft-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Create task
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">Open the task wizard</h2>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ParentTaskWizardLauncher
                childOptions={childOptions}
                returnTo="/parent"
                taskCatalog={taskCatalog.categories}
                triggerLabel="Create task"
              />
            </div>
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
            Review queue
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">Pending completions</h2>
          <div className="mt-6 space-y-3">
            {dashboard.pendingTaskCompletions.length ? (
              await Promise.all(
                dashboard.pendingTaskCompletions.map(async (completion) => {
                  const taskAsset = await resolveTaskCardAsset(completion.taskTitle ?? "Task");

                  return (
                    <div
                      key={completion.id}
                      className="list-row rounded-[1.3rem] px-4 py-3"
                    >
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
                    </div>
                  );
                }),
              )
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                Nothing is waiting for approval yet.
              </div>
            )}
          </div>
        </ShellCard>
      </section>

      <ShellCard className="rounded-[1.8rem] p-6">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.4rem] bg-[#f8fbff] px-4 py-4">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold">Task list</h2>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                {dashboard.tasks.length
                  ? `${dashboard.tasks.length} task${dashboard.tasks.length === 1 ? "" : "s"} ready to manage.`
                  : "No tasks yet."}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(20,36,82,0.08)] transition-transform duration-200 group-open:rotate-45">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
          </summary>

          <div className="mt-6">
            {dashboard.tasks.length ? (
              <div className="grid max-h-[68rem] gap-4 overflow-y-auto pr-1">
                {await Promise.all(
                  dashboard.tasks.map(async (task) => {
                    const taskAsset = await resolveTaskCardAsset(task.title);

                    return (
                      <ShellCard key={task.id} className="rounded-[1.8rem] p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-1 items-start gap-4">
                            <div className="parent-task-edit-art shrink-0">
                              {taskAsset?.parentAssetSrc ? (
                                <Image
                                  alt={taskAsset.title}
                                  className="h-auto w-full object-contain"
                                  height={180}
                                  src={taskAsset.parentAssetSrc}
                                  width={180}
                                />
                              ) : (
                                <span className="px-4 text-center text-base font-black text-[color:var(--foreground)]">
                                  {task.title}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-2xl font-extrabold">{task.title}</h3>
                                <StatusPill tone={task.active ? "mint" : "rose"}>
                                  {task.active ? "Active" : "Paused"}
                                </StatusPill>
                                <StatusPill tone="sky">
                                  {formatTaskSchedule(task.recurring_type, task.weekly_days)}
                                </StatusPill>
                              </div>
                              <p className="mt-3 text-sm font-bold text-[color:var(--ink-soft)]">
                                {dashboard.children.find((child) => child.id === task.child_profile_id)
                                  ?.display_name ?? "All children"} · {task.boop_reward} boops
                              </p>
                              {taskAsset?.category ? (
                                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                                  Category · {taskAsset.category}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <ParentTaskWizardLauncher
                              childOptions={childOptions}
                              initialTask={{
                                active: task.active,
                                boopReward: task.boop_reward,
                                childProfileId: task.child_profile_id,
                                description: task.description,
                                recurringType: task.recurring_type,
                                taskId: task.id,
                                title: task.title,
                                weeklyDays: task.weekly_days ?? [],
                              }}
                              returnTo="/parent/tasks"
                              taskCatalog={taskCatalog.categories}
                              triggerLabel="Edit task"
                              triggerTone="secondary"
                            />

                            <form action={deleteTaskAction}>
                              <input type="hidden" name="taskId" value={task.id} />
                              <LoadingSubmitButton
                                className="btn btn-ghost px-4 py-2 text-sm"
                                pendingLabel="Deleting..."
                              >
                                Delete task
                              </LoadingSubmitButton>
                            </form>
                          </div>
                        </div>
                      </ShellCard>
                    );
                  }),
                )}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                No tasks yet.
              </div>
            )}
          </div>
        </details>
      </ShellCard>
    </main>
  );
}
