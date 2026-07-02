"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  submitTaskCompletionInlineAction,
  type SubmitTaskCompletionInlineState,
} from "@/app/actions";
import { KiddoRouteImage, type KiddoImageDebugMode } from "@/components/kiddo-route-image";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";
import type { ChildTaskView } from "@/lib/types";

const INITIAL_TASK_SUBMISSION_STATE: SubmitTaskCompletionInlineState = {
  status: "idle",
};

function ConfettiBurst({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="child-boop-confetti"
      data-active={active ? "true" : "false"}
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className="child-boop-confetti-piece"
          style={
            {
              "--confetti-delay": `${index * 22}ms`,
              "--confetti-rotation": `${index * 36}deg`,
              "--confetti-x": `${((index % 5) - 2) * 16}px`,
              "--confetti-y": `${-34 - (index % 4) * 10}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function ChildTaskBoopButton({
  imageDebugMode = "off",
  size = "default",
  task,
}: {
  imageDebugMode?: KiddoImageDebugMode;
  size?: "compact" | "default";
  task: ChildTaskView;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);
  const [isRunningSubmit, setIsRunningSubmit] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmitTaskCompletionInlineState>(
    INITIAL_TASK_SUBMISSION_STATE,
  );
  const [optimisticCompleted, setOptimisticCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isAlreadyCompleted =
    task.currentStatus === "approved" || task.currentStatus === "pending";
  const isDoneVisual =
    isAlreadyCompleted ||
    optimisticCompleted ||
    submissionState.status === "already-submitted" ||
    submissionState.status === "submitted";
  const canSubmit = task.canMarkComplete && !isRunningSubmit && !optimisticCompleted;

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current);
      }

      if (confettiTimeoutRef.current !== null) {
        window.clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  function handleBoop() {
    if (!canSubmit) {
      return;
    }

    setOptimisticCompleted(true);
    setShowConfetti(true);

    confettiTimeoutRef.current = window.setTimeout(() => {
      setShowConfetti(false);
    }, 900);

    submitTimeoutRef.current = window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 260);
  }

  async function handleSubmit(formData: FormData) {
    setIsRunningSubmit(true);
    const result = await submitTaskCompletionInlineAction(
      INITIAL_TASK_SUBMISSION_STATE,
      formData,
    );
    setSubmissionState(result);

    if (result.status === "error") {
      setOptimisticCompleted(false);
    }

    setIsRunningSubmit(false);
  }

  return (
    <form action={handleSubmit} ref={formRef}>
      <input name="taskId" type="hidden" value={task.id} />
      <button
        aria-label={isDoneVisual ? `${task.title} completed` : `Boop ${task.title}`}
        className="child-boop-action-button"
        data-completed={isDoneVisual ? "true" : "false"}
        data-size={size}
        disabled={!canSubmit}
        onClick={handleBoop}
        type="button"
      >
        <ConfettiBurst active={showConfetti} />
        <KiddoRouteImage
          alt=""
          className={
            size === "compact"
              ? "h-[64px] w-[64px] drop-shadow-[0_12px_18px_rgba(8,33,102,0.18)] sm:h-[70px] sm:w-[70px]"
              : "h-[82px] w-[82px] drop-shadow-[0_14px_20px_rgba(8,33,102,0.2)] sm:h-[88px] sm:w-[88px]"
          }
          debugLabel={`child-task-boop-button:${task.title}`}
          height={220}
          imageDebugMode={imageDebugMode}
          src={
            isDoneVisual
              ? GOODKIDDO_ASSETS.boopTaskCompleteButton
              : GOODKIDDO_ASSETS.boopTaskPendingButton
          }
          width={220}
        />
      </button>
    </form>
  );
}

export function ChildVisualTaskCard({
  cardSrc,
  imageDebugMode = "off",
  task,
}: {
  cardSrc: string;
  imageDebugMode?: KiddoImageDebugMode;
  task: ChildTaskView;
}) {
  const isCompletedVisual =
    task.currentStatus === "approved" || task.currentStatus === "pending";

  return (
    <div
      className="child-task-row child-visual-task-card relative rounded-[1.55rem] px-4 py-4 pr-[5.9rem] text-[color:var(--foreground)]"
      data-completed={isCompletedVisual ? "true" : "false"}
    >
      <div className="flex min-h-[7.25rem] items-center">
        <div className="child-visual-task-image-wrap min-w-0 flex-1">
          <KiddoRouteImage
            alt={task.title}
            className="child-visual-task-image h-auto w-full object-contain"
            debugLabel={`child-task-card:${task.title}`}
            height={420}
            imageDebugMode={imageDebugMode}
            src={cardSrc}
            width={940}
          />
        </div>
      </div>
      <div className="child-task-reward-badge absolute right-4 top-4 shrink-0 flex-nowrap">
        <span className="whitespace-nowrap leading-none">+{task.boop_reward}</span>
        <span
          aria-hidden="true"
          className="child-task-reward-star ml-1 shrink-0"
          style={{ backgroundImage: `url(${GOODKIDDO_ASSETS.starIcon})` }}
        />
      </div>
      <div className="absolute bottom-4 right-4">
        <ChildTaskBoopButton
          imageDebugMode={imageDebugMode}
          size="compact"
          task={task}
        />
      </div>
    </div>
  );
}
