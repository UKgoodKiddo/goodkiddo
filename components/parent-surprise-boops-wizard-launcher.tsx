"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  awardSurpriseBoopsInlineAction,
  type AwardSurpriseBoopsInlineState,
} from "@/app/actions";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

type ChildOption = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

const INITIAL_STATE: AwardSurpriseBoopsInlineState = {
  status: "idle",
};

const PRESET_AMOUNTS = [1, 5, 10, 20, 50, 100];

function CelebrationConfetti({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="parent-collect-confetti"
      data-active={active ? "true" : "false"}
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="parent-collect-confetti-piece"
          style={
            {
              "--collect-confetti-delay": `${(index % 7) * 45}ms`,
              "--collect-confetti-left": `${4 + index * 3.4}%`,
              "--collect-confetti-rotation": `${index * 17}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function getChildLabel(childOptions: ChildOption[], childTarget: string) {
  if (childTarget === "all") {
    return "All children";
  }

  return childOptions.find((child) => child.id === childTarget)?.name ?? "Selected child";
}

export function ParentSurpriseBoopsWizardLauncher({
  childOptions,
  triggerLabel,
  triggerTone = "primary",
}: {
  childOptions: ChildOption[];
  triggerLabel: string;
  triggerTone?: "ghost" | "primary" | "secondary";
}) {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [childTarget, setChildTarget] = useState("all");
  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitState, setSubmitState] =
    useState<AwardSurpriseBoopsInlineState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  function openWizard() {
    setChildTarget("all");
    setAmount(10);
    setCustomAmount("");
    setReason("");
    setStep(1);
    setSubmitState(INITIAL_STATE);
    setShowCelebration(false);
    setIsOpen(true);
  }

  function closeWizard() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
  }

  function handleChildPick(nextChildTarget: string) {
    setChildTarget(nextChildTarget);
    setStep(2);
  }

  function handlePresetPick(nextAmount: number) {
    setAmount(nextAmount);
    setCustomAmount("");
    setStep(3);
  }

  function handleCustomContinue() {
    const parsedAmount = Number(customAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 500) {
      setSubmitState({ status: "error" });
      return;
    }

    setAmount(Math.trunc(parsedAmount));
    setStep(3);
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await awardSurpriseBoopsInlineAction(INITIAL_STATE, formData);
    setSubmitState(result);
    setIsSubmitting(false);

    if (result.status === "success") {
      setShowCelebration(true);
      redirectTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        router.push("/parent");
        router.refresh();
      }, 1800);
    }
  }

  const feedbackMessage =
    submitState.status === "error"
      ? "That surprise Boop award could not be sent. Please try again."
      : null;

  const triggerClassName =
    triggerTone === "primary"
      ? "btn btn-primary"
      : triggerTone === "secondary"
        ? "btn btn-secondary"
        : "btn btn-ghost";

  return (
    <>
      <button className={triggerClassName} onClick={openWizard} type="button">
        {triggerLabel}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div aria-modal="true" className="parent-task-wizard-backdrop" role="dialog">
              <button
                aria-label="Close surprise boops wizard"
                className="parent-task-wizard-scrim"
                onClick={closeWizard}
                type="button"
              />

              <div className="parent-task-wizard-shell">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                      Step {step} of 3
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[color:var(--foreground)] sm:text-4xl">
                      {step === 1
                        ? "Choose child"
                        : step === 2
                          ? "Choose boops"
                          : "Why today?"}
                    </h2>
                  </div>
                  <button
                    aria-label="Close surprise boops wizard"
                    className="parent-task-wizard-close"
                    onClick={closeWizard}
                    type="button"
                  >
                    x
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="parent-task-wizard-progress">
                    <span style={{ width: `${(step / 3) * 100}%` }} />
                  </div>
                </div>

                <div key={step} className="parent-task-wizard-step mt-6">
                  {step === 1 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <button
                        className="parent-task-wizard-choice parent-task-wizard-choice--feature"
                        onClick={() => handleChildPick("all")}
                        type="button"
                      >
                        <Image alt="" height={64} src={GOODKIDDO_ASSETS.starIcon} width={64} />
                        <span className="mt-3 text-lg font-black">All children</span>
                      </button>
                      {childOptions.map((child) => (
                        <button
                          key={child.id}
                          className="parent-task-wizard-choice"
                          onClick={() => handleChildPick(child.id)}
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
                  ) : null}

                  {step === 2 ? (
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {PRESET_AMOUNTS.map((presetAmount) => (
                          <button
                            key={presetAmount}
                            className="parent-task-wizard-extra-boop min-h-[4.25rem] text-base"
                            data-active={amount === presetAmount && !customAmount ? "true" : "false"}
                            onClick={() => handlePresetPick(presetAmount)}
                            type="button"
                          >
                            {presetAmount} boops
                          </button>
                        ))}
                      </div>

                      <div className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-5">
                        <label className="grid gap-3">
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                            Type amount
                          </span>
                          <input
                            className="field"
                            inputMode="numeric"
                            max={500}
                            min={1}
                            onChange={(event) => {
                              setCustomAmount(event.target.value);
                              setSubmitState(INITIAL_STATE);
                            }}
                            placeholder="Any amount from 1 to 500"
                            type="number"
                            value={customAmount}
                          />
                        </label>
                        <button
                          className="btn btn-secondary mt-4 w-full"
                          onClick={handleCustomContinue}
                          type="button"
                        >
                          Use this amount
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <form action={handleSubmit} className="grid gap-6">
                      <input name="childTarget" type="hidden" value={childTarget} />
                      <input name="amount" type="hidden" value={amount} />

                      <div className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                            Child
                          </span>
                          <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                            {getChildLabel(childOptions, childTarget)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                            Boops
                          </span>
                          <span className="text-right text-lg font-black text-[color:var(--foreground)]">
                            {amount}
                          </span>
                        </div>
                      </div>

                      <label className="grid gap-3">
                        <span className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                          Reason
                        </span>
                        <textarea
                          className="field min-h-32"
                          maxLength={300}
                          name="reason"
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Why are you sending surprise boops?"
                          required
                          value={reason}
                        />
                      </label>

                      {feedbackMessage ? (
                        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                          {feedbackMessage}
                        </div>
                      ) : null}

                      <button
                        className="btn btn-primary h-16 text-xl font-black"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? "Sending..." : "Award surprise boops"}
                      </button>
                    </form>
                  ) : null}
                </div>

                {step < 3 ? (
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      className="btn btn-ghost"
                      disabled={step === 1}
                      onClick={() => setStep((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      Back
                    </button>
                  </div>
                ) : null}
              </div>

              {showCelebration ? (
                <div className="parent-collect-success-overlay fixed inset-0 z-[260] flex items-center justify-center px-6">
                  <CelebrationConfetti active />
                  <div className="relative z-10 text-center">
                    <Image
                      alt=""
                      className="mx-auto h-[10rem] w-[10rem] object-contain sm:h-[12rem] sm:w-[12rem]"
                      height={220}
                      priority
                      src={GOODKIDDO_ASSETS.boopHappy}
                      width={220}
                    />
                    <p className="mt-8 text-5xl font-black text-[color:var(--foreground)] sm:text-6xl">
                      Surprise Boops Sent
                    </p>
                  </div>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
