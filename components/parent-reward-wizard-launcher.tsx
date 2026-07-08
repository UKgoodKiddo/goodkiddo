"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRewardAction, updateRewardAction } from "@/app/actions";
import { GOODKIDDO_ASSETS, getRewardIconPath } from "@/lib/goodkiddo-assets";
import {
  findRewardPresetByTitle,
  REWARD_PRESETS,
  type RewardPreset,
} from "@/lib/reward-presets";

type ChildOption = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

type InitialReward = {
  active: boolean;
  childProfileId: string | null;
  cost: number;
  description: string | null;
  rewardId: string;
  title: string;
};

const REWARD_COST_CHOICES = [10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200];

function buildInitialWizardState(initialReward: InitialReward | null | undefined) {
  const resolvedPreset = initialReward
    ? findRewardPresetByTitle(initialReward.title)
    : REWARD_PRESETS[0] ?? null;

  return {
    active: initialReward?.active ?? true,
    childProfileId: initialReward?.childProfileId ?? "",
    cost: initialReward?.cost ?? resolvedPreset?.defaultCost ?? 20,
    description: initialReward?.description ?? resolvedPreset?.description ?? "",
    selectedPreset:
      resolvedPreset ??
      (initialReward
        ? {
            defaultCost: initialReward.cost,
            description: initialReward.description ?? "",
            title: initialReward.title,
          }
        : null),
    step: 1,
  };
}

function formatChildLabel(childOptions: ChildOption[], childProfileId: string) {
  if (!childProfileId) {
    return "All children";
  }

  return childOptions.find((child) => child.id === childProfileId)?.name ?? "Selected child";
}

function getStepTitle(step: number) {
  switch (step) {
    case 1:
      return "Choose child";
    case 2:
      return "Choose reward";
    case 3:
      return "Choose boops";
    case 4:
      return "Finish reward";
    default:
      return "Create reward";
  }
}

function RewardArtPreview({ preset }: { preset: RewardPreset | null }) {
  if (!preset) {
    return (
      <div className="parent-task-art-card flex min-h-[10rem] items-center justify-center px-4 text-center">
        <p className="text-lg font-black text-[color:var(--foreground)]">Reward</p>
      </div>
    );
  }

  return (
    <div className="parent-task-art-card">
      <div className="task-icon-frame h-40 w-40">
        <Image
          alt={preset.title}
          className="task-icon-art"
          height={140}
          src={getRewardIconPath(preset.title)}
          width={140}
        />
      </div>
    </div>
  );
}

export function ParentRewardWizardLauncher({
  childOptions,
  initialReward = null,
  triggerLabel,
  triggerTone = "primary",
}: {
  childOptions: ChildOption[];
  initialReward?: InitialReward | null;
  triggerLabel: string;
  triggerTone?: "ghost" | "primary" | "secondary";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [wizardState, setWizardState] = useState(() =>
    buildInitialWizardState(initialReward),
  );

  const rewardAction = initialReward ? updateRewardAction : createRewardAction;

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
    setWizardState(buildInitialWizardState(initialReward));
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

  function pickRewardPreset(selectedPreset: RewardPreset) {
    setWizardState((current) => ({
      ...current,
      cost:
        initialReward && current.selectedPreset?.title === selectedPreset.title
          ? current.cost
          : selectedPreset.defaultCost,
      description:
        initialReward && current.selectedPreset?.title === selectedPreset.title
          ? current.description
          : selectedPreset.description,
      selectedPreset,
      step: 3,
    }));
  }

  function pickCost(cost: number) {
    setWizardState((current) => ({
      ...current,
      cost,
      step: 4,
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
            {REWARD_PRESETS.map((preset) => (
              <button
                key={preset.title}
                className="parent-task-wizard-task-button"
                onClick={() => pickRewardPreset(preset)}
                type="button"
              >
                <div className="task-icon-frame h-28 w-28">
                  <Image
                    alt={preset.title}
                    className="task-icon-art"
                    height={104}
                    src={getRewardIconPath(preset.title)}
                    width={104}
                  />
                </div>
                <span className="mt-3 block text-center text-lg font-black text-[color:var(--foreground)]">
                  {preset.title}
                </span>
              </button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="grid gap-6">
            <div className="mx-auto w-full max-w-[22rem]">
              <RewardArtPreview preset={wizardState.selectedPreset} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {REWARD_COST_CHOICES.map((cost) => (
                <button
                  key={cost}
                  className="parent-task-wizard-extra-boop min-h-[4rem] text-base"
                  data-active={wizardState.cost === cost ? "true" : "false"}
                  onClick={() => pickCost(cost)}
                  type="button"
                >
                  {cost} boops
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <form action={rewardAction} className="grid gap-6">
            {initialReward ? (
              <input name="rewardId" type="hidden" value={initialReward.rewardId} />
            ) : null}
            <input name="title" type="hidden" value={wizardState.selectedPreset?.title ?? ""} />
            <input name="childProfileId" type="hidden" value={wizardState.childProfileId} />
            <input name="cost" type="hidden" value={wizardState.cost} />
            <input name="active" type="hidden" value={wizardState.active ? "on" : ""} />

            <div className="mx-auto w-full max-w-[22rem]">
              <RewardArtPreview preset={wizardState.selectedPreset} />
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Child
                </span>
                <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                  {formatChildLabel(childOptions, wizardState.childProfileId)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Reward
                </span>
                <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                  {wizardState.selectedPreset?.title ?? "Reward"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  Cost
                </span>
                <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                  {wizardState.cost} boops
                </span>
              </div>
            </div>

            <textarea
              className="field min-h-28"
              name="description"
              onChange={(event) =>
                setWizardState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description (optional)"
              value={wizardState.description}
            />

            <label className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-4 py-3 text-sm font-bold">
              <input
                checked={wizardState.active}
                onChange={(event) =>
                  setWizardState((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                type="checkbox"
                value="on"
              />
              Reward is active
            </label>

            <button className="btn btn-primary h-16 text-xl font-black" type="submit">
              {initialReward ? "Save reward" : "Create reward"}
            </button>
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
            <div aria-modal="true" className="parent-task-wizard-backdrop" role="dialog">
              <button
                aria-label="Close reward wizard"
                className="parent-task-wizard-scrim"
                onClick={closeWizard}
                type="button"
              />
              <div className="parent-task-wizard-shell">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                      Step {wizardState.step} of 4
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[color:var(--foreground)] sm:text-4xl">
                      {getStepTitle(wizardState.step)}
                    </h2>
                  </div>
                  <button
                    aria-label="Close reward wizard"
                    className="parent-task-wizard-close"
                    onClick={closeWizard}
                    type="button"
                  >
                    x
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="parent-task-wizard-progress">
                    <span style={{ width: `${(wizardState.step / 4) * 100}%` }} />
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
