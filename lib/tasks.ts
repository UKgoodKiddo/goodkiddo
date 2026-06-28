import type {
  ChildTaskStatus,
  ChildTaskView,
  Task,
  TaskCompletion,
  TaskRecurringType,
} from "@/lib/types";

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function startOfUtcWeek(value: Date) {
  const utcDay = value.getUTCDay();
  const diffToMonday = (utcDay + 6) % 7;
  const weekStart = startOfUtcDay(value);
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);
  return weekStart;
}

export function getTaskWindowStart(recurringType: TaskRecurringType, now = new Date()) {
  switch (recurringType) {
    case "daily":
      return startOfUtcDay(now);
    case "weekly":
      return startOfUtcWeek(now);
    default:
      return null;
  }
}

export function getRelevantTaskCompletions(
  task: Task,
  completions: TaskCompletion[],
  now = new Date(),
) {
  const windowStart = getTaskWindowStart(task.recurring_type, now);

  return completions
    .filter((completion) => {
      if (completion.task_id !== task.id) {
        return false;
      }

      if (!windowStart) {
        return true;
      }

      return new Date(completion.submitted_at) >= windowStart;
    })
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime(),
    );
}

export function getChildTaskStatus(
  task: Task,
  completions: TaskCompletion[],
  now = new Date(),
): ChildTaskStatus {
  const latestCompletion = getRelevantTaskCompletions(task, completions, now)[0];

  if (!latestCompletion) {
    return "ready";
  }

  if (latestCompletion.status === "rejected") {
    return "rejected";
  }

  return latestCompletion.status;
}

export function canMarkTaskComplete(
  task: Task,
  completions: TaskCompletion[],
  now = new Date(),
) {
  const status = getChildTaskStatus(task, completions, now);
  return status === "ready" || status === "rejected";
}

export function buildChildTaskView(task: Task, completions: TaskCompletion[], now = new Date()): ChildTaskView {
  const latestCompletion = getRelevantTaskCompletions(task, completions, now)[0];
  const currentStatus = getChildTaskStatus(task, completions, now);

  return {
    ...task,
    canMarkComplete: canMarkTaskComplete(task, completions, now),
    currentStatus,
    lastSubmittedAt: latestCompletion?.submitted_at ?? null,
    reviewedAt: latestCompletion?.reviewed_at ?? null,
  };
}
