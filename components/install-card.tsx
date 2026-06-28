"use client";

import { useEffect, useState } from "react";
import { ShellCard } from "@/components/shell-card";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallCard() {
  const [isStandalone, setIsStandalone] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches,
  );
  const [isIOS] = useState(
    () =>
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(window.navigator.userAgent),
  );
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsStandalone(event.matches);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };

    mediaQuery.addEventListener("change", handleDisplayModeChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <ShellCard className="rounded-[1.8rem] p-6">
      <p className="eyebrow">PWA install</p>
      <h2 className="mt-3 text-3xl font-extrabold">Take goodKiddo to the home screen</h2>
      <p className="mt-4 text-sm leading-6 text-[color:var(--ink-soft)]">
        The app includes a web manifest, generated icons, and a starter service
        worker so we can test installability right away.
      </p>

      <div className="mt-6 space-y-3">
        <div className="list-row rounded-[1.3rem] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          Use `npm run dev:https` when testing install flows or notification work locally.
        </div>

        {!isStandalone && promptEvent ? (
          <button className="btn btn-primary w-full" onClick={handleInstall} type="button">
            Install app
          </button>
        ) : null}

        {!isStandalone && isIOS ? (
          <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            On iPhone or iPad, use Share, then choose Add to Home Screen.
          </div>
        ) : null}

        {isStandalone ? (
          <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            This app is already running in standalone mode.
          </div>
        ) : null}
      </div>
    </ShellCard>
  );
}
