"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createTaskAction, updateTaskAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import {
  taskCardTitlesMatch,
  type TaskCardCategoryName,
} from "@/lib/task-card-utils";
import type { TaskRecurringType, TaskWeekday } from "@/lib/types";

type TaskAssetOption = {
  category: TaskCardCategoryName;
  childAssetSrc: string | null;
  key: string;
  looseTitle: string;
  normalizedTitle: string;
  parentAssetSrc: string;
  title: string;
};

type TaskAssetCategory = {
  name: TaskCardCategoryName;
  tasks: TaskAssetOption[];
};

type ChildOption = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

type InitialTask = {
  active: boolean;
  boopReward: number;
  childProfileId: string | null;
  description: string | null;
  recurringType: TaskRecurringType;
  taskId: string;
  title: string;
  weeklyDays: TaskWeekday[];
};

const WIZARD_BOOP_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const WIZARD_EXTRA_BOOP_CHOICES = [15, 20, 25, 50];
const WEEKDAY_OPTIONS: Array<{ label: string; value: TaskWeekday }> = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

function resolveTaskFromCatalog(
  title: string,
  taskCatalog: TaskAssetCategory[],
) {
  const taskOptions = taskCatalog.flatMap((category) => category.tasks);

  return taskOptions.find((task) => taskCardTitlesMatch(task.title, title)) ?? null;
}

function buildInitialWizardState(
  initialTask: InitialTask | null | undefined,
  defaultChildProfileId: string | undefined,
  taskCatalog: TaskAssetCategory[],
) {
  const resolvedTask = initialTask ? resolveTaskFromCatalog(initialTask.title, taskCatalog) : null;

  return {
    active: initialTask?.active ?? true,
    boopReward: initialTask?.boopReward ?? 5,
    childProfileId: initialTask?.childProfileId ?? defaultChildProfileId ?? "",
    description: initialTask?.description ?? "",
    recurringType: initialTask?.recurringType ?? "daily",
    selectedCategory:
      resolvedTask?.category ?? taskCatalog[0]?.name ?? ("Bedroom" as TaskCardCategoryName),
    selectedTask:
      resolvedTask ??
      (initialTask
        ? {
            category:
              taskCatalog[0]?.name ?? ("Bedroom" as TaskCardCategoryName),
            childAssetSrc: null,
            key: `custom:${initialTask.taskId}`,
            looseTitle: initialTask.title,
            normalizedTitle: initialTask.title,
            parentAssetSrc: "",
            title: initialTask.title,
          }
        : null),
    step: 1,
    weeklyDays: initialTask?.weeklyDays ?? [],
  };
}

function formatWizardChildLabel(
  childOptions: ChildOption[],
  childProfileId: string,
) {
  if (!childProfileId) {
    return "All children";
  }

  return childOptions.find((child) => child.id === childProfileId)?.name ?? "Selected child";
}

function formatWizardFrequency(
  recurringType: TaskRecurringType,
  weeklyDays: TaskWeekday[],
) {
  if (recurringType === "daily") {
    return "Daily";
  }

  if (recurringType === "none") {
    return "One-off";
  }

  if (!weeklyDays.length) {
    return "Weekly";
  }

  return `Weekly - ${WEEKDAY_OPTIONS.filter((day) => weeklyDays.includes(day.value))
    .map((day) => day.label)
    .join(" ")}`;
}

function getStepTitle(step: number) {
  switch (step) {
    case 1:
      return "Choose child";
    case 2:
      return "Choose category";
    case 3:
      return "Choose task";
    case 4:
      return "Choose boops";
    case 5:
      return "Choose days";
    case 6:
      return "Check task";
    default:
      return "Create task";
  }
}

function TaskArtPreview({
  asset,
  title,
}: {
  asset: TaskAssetOption | null;
  title: string;
}) {
  if (asset?.parentAssetSrc) {
    return (
      <div className="parent-task-art-card">
        <div className="task-icon-frame h-40 w-40">
          <Image
            alt={asset.title}
            className="task-icon-art"
            height={160}
            src={asset.parentAssetSrc}
            width={160}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="parent-task-art-card">
      <div className="task-icon-frame flex h-40 w-40 items-center justify-center px-4 text-center">
        <p className="text-lg font-black text-[color:var(--foreground)]">{title}</p>
      </div>
    </div>
  );
}

export function ParentTaskWizardLauncher({
  childOptions,
  defaultChildProfileId,
  defaultOpen = false,
  initialTask = null,
  returnTo = "/parent",
  taskCatalog,
  triggerLabel,
  triggerTone = "primary",
}: {
  childOptions: ChildOption[];
  defaultChildProfileId?: string;
  defaultOpen?: boolean;
  initialTask?: InitialTask | null;
  returnTo?: "/parent" | "/parent/tasks";
  taskCatalog: TaskAssetCategory[];
  triggerLabel: string;
  triggerTone?: "ghost" | "primary" | "secondary";
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [wizardState, setWizardState] = useState(() =>
    buildInitialWizardState(initialTask, defaultChildProfileId, taskCatalog),
  );

  const taskOptionsForCategory =
    taskCatalog.find((category) => category.name === wizardState.selectedCategory)?.tasks ?? [];

  const taskAction = initialTask ? updateTaskAction : createTaskAction;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function openWizard() {
    setWizardState(
      buildInitialWizardState(initialTask, defaultChildProfileId, taskCatalog),
    );
    setIsOpen(true);
  }

  function closeWizard() {
    setIsOpen(false);
  }

  function goBack() {
    setWizardState((current) => ({
      ...current,
      step: Math.max(1, current.step - 1),
    }));
  }

  function pickChild(childProfileId: string) {
    setWizardState((current) => ({
      ...current,
      childProfileId,
      step: 2,
    }));
  }

  function pickCategory(category: TaskCardCategoryName) {
    setWizardState((current) => ({
      ...current,
      selectedCategory: category,
      step: 3,
    }));
  }

  function pickTask(task: TaskAssetOption) {
    setWizardState((current) => ({
      ...current,
      selectedCategory: task.category,
      selectedTask: task,
      step: 4,
    }));
  }

  function pickBoopReward(boopReward: number) {
    setWizardState((current) => ({
      ...current,
      boopReward,
      step: 5,
    }));
  }

  function pickRecurringType(recurringType: TaskRecurringType) {
    setWizardState((current) => ({
      ...current,
      recurringType,
      step: recurringType === "weekly" ? 5 : 6,
      weeklyDays: recurringType === "weekly" ? current.weeklyDays : [],
    }));
  }

  function toggleWeekday(weekday: TaskWeekday) {
    setWizardState((current) => {
      const weeklyDays = current.weeklyDays.includes(weekday)
        ? current.weeklyDays.filter((day) => day !== weekday)
        : [...current.weeklyDays, weekday];

      return {
        ...current,
        weeklyDays,
      };
    });
  }

  function continueFromWeeklyDays() {
    if (!wizardState.weeklyDays.length) {
      return;
    }

    setWizardState((current) => ({
      ...current,
      step: 6,
    }));
  }

  function renderStepBody() {
    switch (wizardState.step) {
      case 1:
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <button
              className="parent-task-wizard-choice parent-task-wizard-choice--feature"
              onClick={() => pickChild("")}
              type="button"
            >
              <Image alt="" height={64} src={GOODKIDDO_ASSETS.starIcon} width={64} />
              <span className="mt-3 text-lg font-black">All children</span>
            </button>
            {childOptions.map((child) => (
              <button
                key={child.id}
                className="parent-task-wizard-choice"
                onClick={() => pickChild(child.id)}
                type="button"
              >
                {child.avatarUrl ? (
                  <Image
                    alt={`${child.name} avatar`}
                    className="h-24 w-24 rounded-[1.8rem] object-cover shadow-[0_18px_32px_rgba(13,35,102,0.12)]"
                    height={96}
                    src={child.avatarUrl}
                    width={96}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-[linear-gradient(180deg,#ffd85f,#ffc93f)] text-4xl font-black text-[color:var(--foreground)] shadow-[0_18px_32px_rgba(13,35,102,0.12)]">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="mt-3 text-xl font-black">{child.name}</span>
              </button>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {taskCatalog.map((category) => (
              <button
                key={category.name}
                className="parent-task-wizard-choice"
                onClick={() => pickCategory(category.name)}
                type="button"
              >
                {category.tasks[0]?.parentAssetSrc ? (
                  <div className="parent-task-wizard-category-art">
                    <Image
                      alt={category.name}
                      className="task-icon-art"
                      height={160}
                      src={category.tasks[0].parentAssetSrc}
                      width={160}
                    />
                  </div>
                ) : (
                  <div className="parent-task-wizard-category-art parent-task-wizard-category-art--fallback">
                    <span>{category.name.slice(0, 1)}</span>
                  </div>
                )}
                <span className="mt-3 text-xl font-black">{category.name}</span>
              </button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {taskOptionsForCategory.map((task) => (
              <button
                key={task.key}
                className="parent-task-wizard-task-button"
                onClick={() => pickTask(task)}
                type="button"
              >
                {task.parentAssetSrc ? (
                  <div className="task-icon-frame h-28 w-28">
                    <Image
                      alt={task.title}
                      className="task-icon-art"
                      height={104}
                      src={task.parentAssetSrc}
                      width={104}
                    />
                  </div>
                ) : (
                  <div className="task-icon-frame flex h-28 w-28 items-center justify-center px-3 text-center">
                    <span className="text-base font-black text-[color:var(--foreground)]">
                      {task.title}
                    </span>
                  </div>
                )}
                <span className="mt-3 block text-center text-lg font-black text-[color:var(--foreground)]">
                  {task.title}
                </span>
              </button>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="grid gap-6">
            <div className="mx-auto w-full max-w-[22rem]">
              <TaskArtPreview
                asset={wizardState.selectedTask}
                title={wizardState.selectedTask?.title ?? "Task"}
              />
            </div>
            <div className="parent-task-wizard-boops">
              {WIZARD_BOOP_CHOICES.map((value) => {
                const active = value <= wizardState.boopReward;
                return (
                  <button
                    key={value}
                    aria-label={`${value} boops`}
                    className="parent-task-wizard-star-button"
                    data-active={active ? "true" : "false"}
                    onClick={() => pickBoopReward(value)}
                    type="button"
                  >
                    <Image alt="" height={44} src={GOODKIDDO_ASSETS.starIcon} width={44} />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {WIZARD_EXTRA_BOOP_CHOICES.map((value) => (
                <button
                  key={value}
                  className="parent-task-wizard-extra-boop"
                  data-active={wizardState.boopReward === value ? "true" : "false"}
                  onClick={() => pickBoopReward(value)}
                  type="button"
                >
                  {value} boops
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Daily", value: "daily" as const },
                  { label: "One-off", value: "none" as const },
                { label: "Weekly", value: "weekly" as const },
              ].map((option) => (
                <button
                  key={option.value}
                  className="parent-task-wizard-choice parent-task-wizard-choice--compact"
                  data-active={wizardState.recurringType === option.value ? "true" : "false"}
                  onClick={() => pickRecurringType(option.value)}
                  type="button"
                >
                  <span className="text-2xl font-black">{option.label}</span>
                </button>
              ))}
            </div>

            {wizardState.recurringType === "weekly" ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-3">
                  {WEEKDAY_OPTIONS.map((weekday) => (
                    <button
                      key={weekday.value}
                      className="parent-task-wizard-weekday"
                      data-active={
                        wizardState.weeklyDays.includes(weekday.value) ? "true" : "false"
                      }
                      onClick={() => toggleWeekday(weekday.value)}
                      type="button"
                    >
                      {weekday.label}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary mt-2 w-full sm:w-auto"
                  disabled={!wizardState.weeklyDays.length}
                  onClick={continueFromWeeklyDays}
                  type="button"
                >
                  Continue
                </button>
              </div>
            ) : null}
          </div>
        );
      case 6:
        return (
          <form action={taskAction} className="grid gap-6">
            {initialTask ? <input name="taskId" type="hidden" value={initialTask.taskId} /> : null}
            <input name="title" type="hidden" value={wizardState.selectedTask?.title ?? ""} />
            <input name="description" type="hidden" value={wizardState.description} />
            <input name="boopReward" type="hidden" value={wizardState.boopReward} />
            <input name="recurringType" type="hidden" value={wizardState.recurringType} />
            <input name="childProfileId" type="hidden" value={wizardState.childProfileId} />
            <input name="active" type="hidden" value={wizardState.active ? "on" : ""} />
            <input name="returnTo" type="hidden" value={returnTo} />
            {wizardState.weeklyDays.map((weekday) => (
              <input key={weekday} name="weeklyDays" type="hidden" value={weekday} />
            ))}

            <div className="mx-auto w-full max-w-[22rem]">
              <TaskArtPreview
                asset={wizardState.selectedTask}
                title={wizardState.selectedTask?.title ?? "Task"}
              />
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Child
                </span>
                <span className="text-lg font-black text-[color:var(--foreground)]">
                  {formatWizardChildLabel(childOptions, wizardState.childProfileId)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Task
                </span>
                <span className="text-lg font-black text-[color:var(--foreground)]">
                  {wizardState.selectedTask?.title ?? "Task"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Boops
                </span>
                <span className="text-lg font-black text-[color:var(--foreground)]">
                  {wizardState.boopReward}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Frequency
                </span>
                <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                  {formatWizardFrequency(wizardState.recurringType, wizardState.weeklyDays)}
                </span>
              </div>
            </div>

            <LoadingSubmitButton
              className="btn btn-primary h-16 text-xl font-black"
              pendingLabel={initialTask ? "Saving..." : "Creating..."}
            >
              {initialTask ? "Save task" : "Create task"}
            </LoadingSubmitButton>
          </form>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <button
        className={
          triggerTone === "primary"
            ? "btn btn-primary"
            : triggerTone === "secondary"
              ? "btn btn-secondary"
              : "btn btn-ghost"
        }
        onClick={openWizard}
        type="button"
      >
        {triggerLabel}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="parent-task-wizard-backdrop" role="dialog" aria-modal="true">
              <button
                aria-label="Close task wizard"
                className="parent-task-wizard-scrim"
                onClick={closeWizard}
                type="button"
              />
              <div className="parent-task-wizard-shell">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                      Step {wizardState.step} of 6
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[color:var(--foreground)] sm:text-4xl">
                      {getStepTitle(wizardState.step)}
                    </h2>
                  </div>
                  <button
                    aria-label="Close task wizard"
                    className="parent-task-wizard-close"
                    onClick={closeWizard}
                    type="button"
                  >
                    x
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="parent-task-wizard-progress">
                    <span style={{ width: `${(wizardState.step / 6) * 100}%` }} />
                  </div>
                </div>

                <div key={wizardState.step} className="parent-task-wizard-step mt-6">
                  {renderStepBody()}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    className="btn btn-ghost"
                    disabled={wizardState.step === 1}
                    onClick={goBack}
                    type="button"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
