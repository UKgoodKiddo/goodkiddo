"use client";

import { useEffect, useState } from "react";
import {
  buildParentThemeSnapshot,
  DEFAULT_PARENT_THEME_PHASE,
  type ParentThemePhase,
} from "@/lib/local-time-theme";

type LocalDayNightThemeState = {
  isNight: boolean;
  phase: ParentThemePhase;
  timeZone: string | null;
};

function getInitialThemeState(): LocalDayNightThemeState {
  return {
    isNight: false,
    phase: DEFAULT_PARENT_THEME_PHASE,
    timeZone: null,
  };
}

function syncDocumentThemePhase(phase: string) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-parent-theme", phase);
  }
}

export function useLocalDayNightTheme() {
  const [themeState, setThemeState] = useState(getInitialThemeState);

  useEffect(() => {
    let timerId: number | null = null;

    const scheduleNextCheck = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }

      const now = Date.now();
      const millisecondsUntilNextMinute = 60000 - (now % 60000) + 25;
      timerId = window.setTimeout(syncThemeState, millisecondsUntilNextMinute);
    };

    const syncThemeState = () => {
      const nextThemeState = buildParentThemeSnapshot();

      syncDocumentThemePhase(nextThemeState.phase);
      setThemeState((currentState) =>
        currentState.phase === nextThemeState.phase &&
        currentState.timeZone === nextThemeState.timeZone
          ? currentState
          : nextThemeState,
      );
      scheduleNextCheck();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncThemeState();
      }
    };

    const handleWindowResume = () => {
      syncThemeState();
    };

    syncThemeState();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowResume);
    window.addEventListener("pageshow", handleWindowResume);

    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowResume);
      window.removeEventListener("pageshow", handleWindowResume);
    };
  }, []);

  return themeState;
}
