"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createChildProfileAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { NfcUidCapture } from "@/components/nfc-uid-capture";
import { CHILD_AVATAR_PRESETS } from "@/lib/child-ui";

function buildProgressWidth(step: number) {
  return `${Math.max(25, Math.min(100, (step / 4) * 100))}%`;
}

export function ParentChildWizardLauncher({
  familyId,
  triggerLabel,
}: {
  familyId: string;
  triggerLabel: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string>(CHILD_AVATAR_PRESETS[0]?.value ?? "");
  const [booperUid, setBooperUid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const trimmedDisplayName = displayName.trim();
  const canContinueFromName = trimmedDisplayName.length > 0;
  const selectedAvatar = useMemo(
    () =>
      CHILD_AVATAR_PRESETS.find((preset) => preset.value === avatarUrl) ??
      CHILD_AVATAR_PRESETS[0] ??
      null,
    [avatarUrl],
  );

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
    setAvatarUrl(CHILD_AVATAR_PRESETS[0]?.value ?? "");
    setBooperUid("");
    setDisplayName("");
    setStep(1);
    setIsOpen(true);
  }

  function closeWizard() {
    setIsOpen(false);
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  const wizard = isOpen
    ? createPortal(
        <div className="parent-task-wizard-shell">
          <div className="parent-task-wizard-scrim" onClick={closeWizard} />
          <div className="parent-task-wizard-backdrop overflow-y-auto">
            <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                    Step {step} of 4
                  </p>
                  <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground)] sm:text-5xl">
                    {step === 1
                      ? "Type child name"
                      : step === 2
                        ? "Pick avatar"
                        : step === 3
                          ? "Assign Booper"
                          : "Create child"}
                  </h2>
                </div>
                <button
                  aria-label="Close create child wizard"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-3xl font-black text-[color:var(--foreground)] shadow-[0_20px_40px_rgba(20,36,82,0.12)] transition hover:-translate-y-0.5"
                  onClick={closeWizard}
                  type="button"
                >
                  x
                </button>
              </div>

              <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-[color:var(--surface-alt)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffe043_0%,#8ddc54_45%,#1f68f0_100%)] transition-all duration-300"
                  style={{ width: buildProgressWidth(step) }}
                />
              </div>

              <div className="mt-6 flex flex-1 flex-col rounded-[2rem] bg-white p-5 shadow-[0_28px_60px_rgba(20,36,82,0.12)] sm:p-6">
                {step === 1 ? (
                  <div className="flex flex-1 flex-col">
                    <div className="mt-4 flex flex-1 flex-col justify-center">
                      <input
                        autoFocus
                        className="field text-center text-3xl font-extrabold sm:text-4xl"
                        maxLength={60}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Child name"
                        value={displayName}
                      />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        className="btn btn-primary min-w-[12rem] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canContinueFromName}
                        onClick={() => setStep(2)}
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="flex flex-1 flex-col">
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {CHILD_AVATAR_PRESETS.map((preset) => {
                        const selected = preset.value === avatarUrl;

                        return (
                          <button
                            key={preset.value}
                            className="parent-task-wizard-choice"
                            onClick={() => {
                              setAvatarUrl(preset.value);
                              setStep(3);
                            }}
                            type="button"
                          >
                            <div
                              className={`flex h-28 w-28 items-center justify-center rounded-[2rem] border bg-white p-3 shadow-[0_18px_32px_rgba(13,35,102,0.12)] ${
                                selected
                                  ? "border-[color:var(--primary)] ring-4 ring-[rgba(47,108,255,0.14)]"
                                  : "border-[color:var(--line)]"
                              }`}
                            >
                              <Image
                                alt={preset.label}
                                className="h-full w-full object-contain"
                                height={112}
                                src={preset.value}
                                width={112}
                              />
                            </div>
                            <span className="mt-3 text-lg font-black">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex justify-start">
                      <button className="btn btn-ghost min-w-[10rem]" onClick={goBack} type="button">
                        Back
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="flex flex-1 flex-col">
                    <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-6">
                      {selectedAvatar ? (
                        <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_18px_32px_rgba(13,35,102,0.12)]">
                          <Image
                            alt={selectedAvatar.label}
                            className="h-full w-full object-contain"
                            height={128}
                            src={selectedAvatar.value}
                            width={128}
                          />
                        </div>
                      ) : null}

                      <div className="w-full max-w-md">
                        <NfcUidCapture
                          autoStart
                          buttonClassName="w-full justify-center"
                          buttonLabel="Scan your NFC Booper!"
                          helperText="If scanning does not start by itself, press the button to activate NFC on this device."
                          inputName="booperUid"
                          onUidChange={setBooperUid}
                          scanningLabel="Scanning..."
                          showInput={false}
                          successMessage="Booper assigned and ready."
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between gap-3">
                      <button
                        className="btn btn-ghost min-w-[6.5rem] px-5"
                        onClick={goBack}
                        type="button"
                      >
                        Back
                      </button>
                      <button
                        className="btn btn-primary min-w-[7.5rem] px-5"
                        onClick={() => setStep(4)}
                        type="button"
                      >
                        {booperUid ? "Next" : "Skip"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <form action={createChildProfileAction} className="flex flex-1 flex-col">
                    <input name="avatarUrl" type="hidden" value={avatarUrl} />
                    <input name="booperUid" type="hidden" value={booperUid} />
                    <input name="displayName" type="hidden" value={trimmedDisplayName} />
                    <input name="familyId" type="hidden" value={familyId} />
                    <input name="returnTo" type="hidden" value="/parent/tasks" />

                    <div className="mt-6 flex flex-1 items-center justify-center">
                      <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--line)] bg-[#f8fbff] p-6 shadow-[0_18px_32px_rgba(13,35,102,0.08)]">
                        <div className="flex flex-col items-center gap-4 text-center">
                          {selectedAvatar ? (
                            <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white p-4 shadow-[0_18px_32px_rgba(13,35,102,0.12)]">
                              <Image
                                alt={selectedAvatar.label}
                                className="h-full w-full object-contain"
                                height={128}
                                src={selectedAvatar.value}
                                width={128}
                              />
                            </div>
                          ) : null}

                          <div>
                            <p className="text-4xl font-extrabold text-[color:var(--foreground)]">
                              {trimmedDisplayName}
                            </p>
                            <p className="mt-3 text-base font-bold text-[color:var(--ink-soft)]">
                              {booperUid ? "Booper ready to assign" : "Booper can be added later"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between gap-3">
                      <button className="btn btn-ghost min-w-[10rem]" onClick={goBack} type="button">
                        Back
                      </button>
                      <LoadingSubmitButton
                        className="btn btn-primary min-w-[14rem]"
                        pendingLabel="Creating..."
                      >
                        Create child
                      </LoadingSubmitButton>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button className="btn btn-primary" onClick={openWizard} type="button">
        {triggerLabel}
      </button>
      {wizard}
    </>
  );
}
