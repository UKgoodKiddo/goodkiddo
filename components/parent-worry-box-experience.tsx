"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  WORRY_BOX_MAX_CHARS,
  createEmptyLocalWorryBoxState,
  createWorryBoxStorageKey,
  getClientStorage,
  readLocalWorryBoxState,
  writeLocalWorryBoxState,
  type LocalWorryBoxState,
} from "@/lib/worry-box-storage";

const worryValidationPatterns = [
  {
    message: "Please remove email addresses before storing this worry.",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },
  {
    message: "Please remove phone numbers before storing this worry.",
    pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,}/,
  },
  {
    message: "Please remove post or zip codes before storing this worry.",
    pattern:
      /\b\d{5}(-\d{4})?\b|\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b|\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i,
  },
] as const;

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 12H5M12 19L5 12L12 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H20M6 7V18C6 19.1 6.9 20 8 20H16C17.1 20 18 19.1 18 18V7M9 11H15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect height="4" rx="1" stroke="currentColor" strokeWidth="2" width="16" x="4" y="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H20M9 7V5C9 4.45 9.45 4 10 4H14C14.55 4 15 4.45 15 5V7M7 7L8 19C8.08 19.84 8.78 20.48 9.62 20.48H14.38C15.22 20.48 15.92 19.84 16 19L17 7M10 11V16M14 11V16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function createWorryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `worry-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function validateWorry(text: string) {
  for (const rule of worryValidationPatterns) {
    if (rule.pattern.test(text)) {
      return rule.message;
    }
  }

  return null;
}

export function ParentWorryBoxExperience({
  parentStorageId,
}: {
  parentStorageId?: string | null;
}) {
  const storageKey = useMemo(
    () => createWorryBoxStorageKey(parentStorageId),
    [parentStorageId],
  );
  const storage = useMemo(() => getClientStorage(), []);
  const initialStoredState = useMemo(
    () => readLocalWorryBoxState(storage, storageKey),
    [storage, storageKey],
  );
  const [worry, setWorry] = useState("");
  const [worryState, setWorryState] = useState<LocalWorryBoxState>(() => initialStoredState.state);
  const [validationError, setValidationError] = useState("");
  const [storageMessage, setStorageMessage] = useState(() => {
    if (!initialStoredState.storageAvailable) {
      return "This device is not allowing local storage right now, so worries can stay only in this open session.";
    }

    if (initialStoredState.recoveredFromInvalidData) {
      return "Saved worries on this device needed a gentle reset before this box could open safely.";
    }

    return "";
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [animatedWorryText, setAnimatedWorryText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (initialStoredState.recoveredFromInvalidData) {
      writeLocalWorryBoxState(storage, storageKey, initialStoredState.state);
    }
  }, [initialStoredState, storage, storageKey]);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return;
    }

    const syncViewportHeight = () => {
      setViewportHeight(Math.round(visualViewport.height));
    };

    syncViewportHeight();
    visualViewport.addEventListener("resize", syncViewportHeight);

    return () => {
      visualViewport.removeEventListener("resize", syncViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!isArchiveOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsArchiveOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isArchiveOpen]);

  const helperCountText = `${worry.length}/${WORRY_BOX_MAX_CHARS}`;
  const savedWorries = worryState.worries;

  const persistWorries = (
    nextState: LocalWorryBoxState,
    options?: {
      onStorageFailure?: string;
      onSuccess?: string;
    },
  ) => {
    setWorryState(nextState);

    if (!writeLocalWorryBoxState(storage, storageKey, nextState)) {
      if (options?.onStorageFailure) {
        setStorageMessage(options.onStorageFailure);
      }

      return false;
    }

    if (options?.onSuccess) {
      setStorageMessage("");
      setStatusMessage(options.onSuccess);
    }

    return true;
  };

  const handleStoreWorry = () => {
    const cleanWorry = worry.trim();

    if (!cleanWorry || isDepositing) {
      return;
    }

    const error = validateWorry(cleanWorry);

    if (error) {
      setValidationError(error);
      return;
    }

    const nextState: LocalWorryBoxState = {
      ...worryState,
      worries: [
        {
          createdAt: new Date().toISOString(),
          id: createWorryId(),
          text: cleanWorry,
        },
        ...savedWorries,
      ],
    };

    persistWorries(nextState, {
      onStorageFailure:
        "This worry could not be saved on this device, but it can stay here until this page closes.",
      onSuccess: "Worry placed in the box.",
    });
    setAnimatedWorryText(cleanWorry);
    setIsDepositing(true);
    setValidationError("");
    setWorry("");

    window.setTimeout(() => {
      setAnimatedWorryText("");
      setIsDepositing(false);
    }, 2800);
  };

  const handleDeleteWorry = (id: string) => {
    const nextState: LocalWorryBoxState = {
      ...worryState,
      worries: savedWorries.filter((entry) => entry.id !== id),
    };

    persistWorries(nextState, {
      onStorageFailure:
        "This device could not update its saved worries just now, so the change may only last for this session.",
      onSuccess: "Worry removed from the box.",
    });
  };

  const handleClearAll = () => {
    const nextState = createEmptyLocalWorryBoxState();

    persistWorries(nextState, {
      onStorageFailure:
        "This device could not fully clear its saved worries just now, so reopen this space and check again.",
      onSuccess: "All saved worries cleared from this device.",
    });
    setIsArchiveOpen(false);
  };

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(51,65,85,0.22),transparent_30%),radial-gradient(circle_at_50%_38%,rgba(148,163,184,0.08),transparent_24%),linear-gradient(180deg,#050814_0%,#070b16_46%,#04070e_100%)] text-slate-300"
      data-pull-refresh-ignore="true"
      style={{
        minHeight: viewportHeight ? `${viewportHeight}px` : "100dvh",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,255,255,0.03),transparent_30%)]" />
      <div className="absolute left-[10%] top-[18%] h-40 w-40 rounded-full bg-slate-500/7 blur-3xl" />
      <div className="absolute bottom-[12%] right-[9%] h-52 w-52 rounded-full bg-slate-400/6 blur-3xl" />
      <div className="pointer-events-none absolute inset-0">
        <span className="goodkiddo-worry-star left-[12%] top-[16%]" style={{ animationDelay: "0s" }} />
        <span className="goodkiddo-worry-star left-[26%] top-[28%]" style={{ animationDelay: "1.6s" }} />
        <span className="goodkiddo-worry-star left-[81%] top-[18%]" style={{ animationDelay: "3.2s" }} />
        <span className="goodkiddo-worry-star left-[72%] top-[34%]" style={{ animationDelay: "4.8s" }} />
        <span className="goodkiddo-worry-star left-[18%] top-[68%]" style={{ animationDelay: "2.1s" }} />
        <span className="goodkiddo-worry-star left-[84%] top-[72%]" style={{ animationDelay: "6.1s" }} />
      </div>

      <div
        className="relative z-20 flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        }}
      >
        <Link
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-100 backdrop-blur"
          href="/parent"
        >
          <ArrowLeftIcon />
          Back
        </Link>

        <button
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-100 backdrop-blur"
          onClick={() => setIsArchiveOpen(true)}
          type="button"
        >
          <ArchiveIcon />
          Saved worries
        </button>
      </div>

      <main
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-6 sm:px-6"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center text-center">
          <div className="pt-3">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Local only</p>
            <h1 className="mt-3 text-[2.35rem] font-light tracking-tight text-slate-200 sm:text-5xl">
              Worry Box
            </h1>
            <p className="mt-3 max-w-[18rem] text-base leading-7 text-slate-400 sm:max-w-2xl">
              A private space to place worries for later.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Saved only on this device and browser. If app or browser storage is cleared, these
              worries disappear too. They do not sync to another phone, and GoodKiddo cannot recover
              them after deletion or storage loss.
            </p>
          </div>

          <div className="relative mt-8 flex w-full flex-1 flex-col items-center justify-center pb-6">
            <div className="relative flex w-full items-center justify-center pb-5 pt-2 sm:pb-8 sm:pt-4">
              {animatedWorryText ? (
                <div
                  className="pointer-events-none absolute left-1/2 top-[-2.5rem] z-20 w-full max-w-[82vw] -translate-x-1/2 sm:top-[-3rem]"
                  style={
                    {
                      "--worry-drop-distance": "6rem",
                    } as CSSProperties
                  }
                >
                  <div className="goodkiddo-worry-note-flight mx-auto w-60 max-w-full rounded-[1.5rem] border border-white/10 bg-slate-200/10 px-5 py-4 text-center text-sm leading-6 text-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur">
                    {animatedWorryText}
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-slate-400/6 blur-3xl sm:h-80 sm:w-80" />
              </div>

              <div className="relative goodkiddo-worry-box-drift">
                <div className="relative flex h-[15.5rem] w-[15.5rem] items-center justify-center sm:h-[19rem] sm:w-[19rem]">
                  <div className="absolute inset-6 rounded-full bg-slate-300/8 blur-3xl" />
                  <div className="absolute inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.12),transparent_55%)] blur-2xl" />
                  <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_24px_55px_rgba(2,6,23,0.28)]">
                    <Image
                      alt="Worry Box graphic"
                      className="h-auto w-[13.5rem] opacity-96 sm:w-[16.5rem]"
                      height={537}
                      priority
                      src="/goodkiddo/worry-box/worryboxgraphic.png"
                      width={578}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-2 flex w-full max-w-md flex-col gap-3">
              <div className="relative">
                <input
                  className={`h-13 w-full rounded-2xl border bg-white/[0.06] px-4 pr-16 text-base text-slate-200 shadow-[0_18px_40px_rgba(2,6,23,0.22)] outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-500/20 sm:h-14 sm:px-5 sm:pr-20 ${
                    validationError
                      ? "border-amber-300/60 focus:border-amber-300/70 focus:ring-amber-300/20"
                      : "border-white/10"
                  }`}
                  maxLength={WORRY_BOX_MAX_CHARS}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(event) => {
                    setWorry(event.target.value.slice(0, WORRY_BOX_MAX_CHARS));
                    setValidationError("");
                    setStatusMessage("");
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleStoreWorry();
                    }
                  }}
                  placeholder="What worry would you like to put away?"
                  type="text"
                  value={worry}
                />

                {isInputFocused || worry.length > 0 ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 sm:right-4 sm:text-xs">
                    {helperCountText}
                  </span>
                ) : null}
              </div>

              <p className="text-sm leading-6 text-slate-500">
                Keep identifying details out if you can. This stays only on this device and browser.
              </p>

              {validationError ? <p className="text-sm text-amber-300">{validationError}</p> : null}
              {storageMessage ? <p className="text-sm text-slate-400">{storageMessage}</p> : null}

              <div aria-atomic="true" aria-live="polite" className="sr-only">
                {statusMessage}
              </div>

              <button
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-700 px-4 text-base font-medium text-white shadow-sm transition hover:bg-slate-600 disabled:bg-slate-800/60 disabled:text-slate-500"
                disabled={!worry.trim() || isDepositing}
                onClick={handleStoreWorry}
                type="button"
              >
                {isDepositing ? "Putting away..." : "Put in Worry Box"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {isArchiveOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[240] flex flex-col bg-[rgba(4,7,14,0.82)] backdrop-blur-md"
          role="dialog"
        >
          <button
            aria-label="Close saved worries"
            className="absolute inset-0"
            onClick={() => setIsArchiveOpen(false)}
            type="button"
          />

          <div
            className="relative z-10 flex min-h-0 flex-1 flex-col"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-4 sm:px-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Private archive</p>
                <h2 className="mt-2 text-2xl font-light text-slate-100">Saved worries</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  These worries live only in this browser on this device.
                </p>
              </div>
              <button
                aria-label="Close saved worries"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-100"
                onClick={() => setIsArchiveOpen(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
              {savedWorries.length === 0 ? (
                <div className="mx-auto max-w-2xl py-8 text-center text-sm leading-7 text-slate-500">
                  No worries stored here yet.
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col gap-3 pb-6">
                  {savedWorries.map((entry) => (
                    <div
                      className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] px-4 py-4"
                      key={entry.id}
                    >
                      <p className="text-sm leading-7 text-slate-200">{entry.text}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300"
                          onClick={() => handleDeleteWorry(entry.id)}
                          type="button"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 pt-3 sm:px-6">
              <div className="mx-auto max-w-2xl">
                <button
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 disabled:border-white/5 disabled:text-slate-600"
                  disabled={savedWorries.length === 0}
                  onClick={() => setIsConfirmClearOpen(true)}
                  type="button"
                >
                  Clear Worry Box
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isConfirmClearOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[260] flex items-center justify-center px-4"
          role="dialog"
        >
          <button
            aria-label="Close clear confirmation"
            className="absolute inset-0 bg-[rgba(3,8,20,0.68)] backdrop-blur-sm"
            onClick={() => setIsConfirmClearOpen(false)}
            type="button"
          />

          <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950 px-5 py-5 text-slate-200 shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
            <h3 className="text-xl font-semibold text-slate-100">Clear all saved worries?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              This removes every locally stored worry from this browser. GoodKiddo cannot recover
              them after they are cleared.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-300"
                onClick={() => setIsConfirmClearOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-700 px-4 text-sm font-medium text-white"
                onClick={() => {
                  handleClearAll();
                  setIsConfirmClearOpen(false);
                }}
                type="button"
              >
                Clear Worry Box
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
