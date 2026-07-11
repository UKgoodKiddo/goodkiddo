"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallPromptBanner() {
  const pathname = usePathname();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    function handleDisplayModeChange(event: MediaQueryListEvent) {
      setIsStandalone(event.matches);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setIsDismissed(false);
    }

    function handleAppInstalled() {
      setIsStandalone(true);
      setPromptEvent(null);
      setIsDismissed(true);
    }

    mediaQuery.addEventListener("change", handleDisplayModeChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!promptEvent) {
      return;
    }

    setIsPrompting(true);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome !== "accepted") {
        setIsDismissed(true);
      }
    } finally {
      setPromptEvent(null);
      setIsPrompting(false);
    }
  }

  const isSupportedPath =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/superadmin");

  if (!isSupportedPath || isStandalone || !promptEvent || isDismissed) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md rounded-[1.7rem] border border-[#bcd4ff] bg-white/96 p-4 shadow-[0_22px_45px_rgba(18,46,142,0.16)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_24px_rgba(46,115,255,0.16)]">
            <Image
              alt=""
              aria-hidden="true"
              className="h-10 w-10 object-contain"
              height={40}
              src={GOODKIDDO_ASSETS.installAppIcon}
              width={40}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-[color:var(--foreground)]">
              Install goodKiddo
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
              Add goodKiddo to your home screen for faster sign-ins and a more app-like feel.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="btn btn-primary flex-1"
            disabled={isPrompting}
            onClick={handleInstall}
            type="button"
          >
            {isPrompting ? "Opening install..." : "Install app"}
          </button>
          <button
            aria-label="Dismiss install prompt"
            className="btn btn-secondary px-5"
            onClick={() => setIsDismissed(true)}
            type="button"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
