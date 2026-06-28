import Image from "next/image";
import { redirect } from "next/navigation";
import { deleteTaskAction, updateTaskAction } from "@/app/actions";
import { Banner } from "@/components/banner";
import { BoopRewardPicker } from "@/components/boop-reward-picker";
import { ShellCard } from "@/components/shell-card";
import { StatusPill } from "@/components/status-pill";
import { TaskPresetBuilder } from "@/components/task-preset-builder";
import { getParentDashboardData } from "@/lib/data";
import { getTaskIconPath } from "@/lib/goodkiddo-assets";
import { getParentStatusBanner } from "@/lib/parent-status";
import { formatDateTimeDetailed, formatRecurringType } from "@/lib/utils";

export default async function ParentTasksPage(props: {
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

  return (
    <main className="flex flex-1 flex-col gap-6">
      {banner ? <Banner message={banner.message} tone={banner.tone} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Add task</p>
          <h2 className="mt-3 text-3xl font-extrabold">Create a boop task</h2>
          <div className="mt-6">
            <TaskPresetBuilder
              childOptions={dashboard.children.map((child) => ({
                id: child.id,
                name: child.display_name,
              }))}
            />
          </div>
        </ShellCard>

        <ShellCard className="rounded-[1.8rem] p-6">
          <p className="eyebrow">Review queue</p>
          <h2 className="mt-3 text-3xl font-extrabold">Pending completions</h2>
          <div className="mt-6 space-y-3">
            {dashboard.pendingTaskCompletions.length ? (
              dashboard.pendingTaskCompletions.map((completion) => (
                <div
                  key={completion.id}
                  className="list-row rounded-[1.3rem] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="task-icon-frame h-14 w-14">
                        <Image
                          alt=""
                          className="task-icon-art"
                          height={44}
                          src={getTaskIconPath(completion.taskTitle ?? "Task")}
                          width={44}
                        />
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
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                Nothing is waiting for approval yet.
              </div>
            )}
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-4">
        {dashboard.tasks.length ? (
          dashboard.tasks.map((task) => (
            <ShellCard key={task.id} className="rounded-[1.8rem] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="task-icon-frame h-16 w-16">
                    <Image
                      alt=""
                      className="task-icon-art"
                      height={52}
                      src={getTaskIconPath(task.title)}
                      width={52}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-extrabold">{task.title}</h3>
                      <StatusPill tone={task.active ? "mint" : "rose"}>
                        {task.active ? "Active" : "Paused"}
                      </StatusPill>
                      <StatusPill tone="sky">
                        {formatRecurringType(task.recurring_type)}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      {task.description || "No description yet"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-[color:var(--ink-soft)]">
                      Assigned to{" "}
                      {dashboard.children.find((child) => child.id === task.child_profile_id)
                        ?.display_name ?? "All children"}{" "}
                      · {task.boop_reward} boops
                    </p>
                  </div>
                </div>

                <form action={deleteTaskAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <button className="btn btn-ghost px-4 py-2 text-sm" type="submit">
                    Delete task
                  </button>
                </form>
              </div>

              <form
                action={updateTaskAction}
                className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_1fr_180px_auto]"
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input className="field" defaultValue={task.title} name="title" required />
                <input
                  className="field"
                  defaultValue={task.description ?? ""}
                  name="description"
                />
                <select
                  className="field"
                  defaultValue={task.recurring_type}
                  name="recurringType"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <button className="btn btn-primary" type="submit">
                  Save task
                </button>

                <div className="lg:col-span-4">
                  <p className="mb-2 text-sm font-bold text-[color:var(--ink-soft)]">
                    Boop reward
                  </p>
                  <BoopRewardPicker initialValue={task.boop_reward} name="boopReward" />
                </div>

                <select
                  className="field lg:col-span-2"
                  defaultValue={task.child_profile_id ?? ""}
                  name="childProfileId"
                >
                  <option value="">Assign to all children</option>
                  {dashboard.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.display_name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-4 py-3 text-sm font-bold lg:col-span-3">
                  <input defaultChecked={task.active} name="active" type="checkbox" value="on" />
                  Task is active
                </label>
              </form>
            </ShellCard>
          ))
        ) : (
          <ShellCard className="rounded-[1.8rem] p-6">
            <p className="text-sm text-[color:var(--ink-soft)]">No tasks yet.</p>
          </ShellCard>
        )}
      </section>
    </main>
  );
}
