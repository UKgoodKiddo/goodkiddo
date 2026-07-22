"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ACTIVATION_ZONE_PX = 140;
const DRAG_RESISTANCE = 0.52;
const MAX_PULL_DISTANCE = 96;
const MIN_PULL_DISTANCE = 8;
const REFRESH_THRESHOLD = 72;
const RESET_DELAY_MS = 180;

function getDocumentScrollTop() {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function isVerticallyScrollable(element: HTMLElement) {
  const overflowY = window.getComputedStyle(element).overflowY;

  return (
    (overflowY === "auto" || overflowY === "overlay" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight + 2
  );
}

function hasScrolledScrollableAncestor(target: HTMLElement | null, boundary: HTMLElement) {
  let node = target;

  while (node && node !== boundary) {
    if (isVerticallyScrollable(node) && node.scrollTop > 0) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
}

function RefreshSpinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 animate-spin", className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" opacity="0.2" r="9" stroke="currentColor" strokeWidth="2.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

function RefreshArrow({ armed, className }: { armed: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "h-3.5 w-3.5 transition-transform duration-150",
        armed ? "rotate-180" : "rotate-0",
        className,
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 5v14M12 19l-5-5M12 19l5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

export function PullToRefreshShell({
  children,
  className,
  variant = "parent",
}: {
  children: ReactNode;
  className?: string;
  variant?: "child" | "parent";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gestureStateRef = useRef({
    active: false,
    blocked: false,
    startX: 0,
    startY: 0,
  });
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isArmed, setIsArmed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startRefreshTransition] = useTransition();

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  const syncPullDistance = useEffectEvent((nextPullDistance: number) => {
    const clampedPullDistance = Math.max(0, Math.min(MAX_PULL_DISTANCE, nextPullDistance));

    pullDistanceRef.current = clampedPullDistance;
    setPullDistance(clampedPullDistance);
    setIsArmed(clampedPullDistance >= REFRESH_THRESHOLD);
  });

  const resetPullState = useEffectEvent(() => {
    syncPullDistance(0);
  });

  const triggerRefresh = useEffectEvent(() => {
    if (isRefreshingRef.current) {
      return;
    }

    setIsRefreshing(true);
    syncPullDistance(REFRESH_THRESHOLD * 0.84);
    startRefreshTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    if (!isRefreshing || isPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRefreshing(false);
      resetPullState();
    }, RESET_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPending, isRefreshing]);

  useEffect(() => {
    const rootElement = rootRef.current;

    if (!rootElement) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const target = event.target instanceof HTMLElement ? event.target : null;

      gestureStateRef.current = {
        active: false,
        blocked:
          touch.clientY > ACTIVATION_ZONE_PX ||
          getDocumentScrollTop() > 1 ||
          hasScrolledScrollableAncestor(target, rootElement) ||
          target?.closest("[data-pull-refresh-ignore='true']") !== null,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const gestureState = gestureStateRef.current;

      if (gestureState.blocked || isRefreshingRef.current || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - gestureState.startX);
      const deltaY = touch.clientY - gestureState.startY;

      if (deltaY <= 0) {
        if (gestureState.active) {
          resetPullState();
          gestureState.active = false;
        }

        return;
      }

      if (!gestureState.active && deltaY < MIN_PULL_DISTANCE) {
        return;
      }

      if (deltaX > deltaY * 0.8) {
        if (!gestureState.active) {
          gestureState.blocked = true;
          resetPullState();
        }

        return;
      }

      if (getDocumentScrollTop() > 1) {
        gestureState.blocked = true;
        resetPullState();
        return;
      }

      gestureState.active = true;
      event.preventDefault();
      syncPullDistance(deltaY * DRAG_RESISTANCE);
    };

    const completeGesture = () => {
      const gestureState = gestureStateRef.current;
      const shouldRefresh = gestureState.active && pullDistanceRef.current >= REFRESH_THRESHOLD;

      gestureStateRef.current = {
        active: false,
        blocked: false,
        startX: 0,
        startY: 0,
      };

      if (shouldRefresh) {
        triggerRefresh();
        return;
      }

      resetPullState();
    };

    rootElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    rootElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    rootElement.addEventListener("touchend", completeGesture);
    rootElement.addEventListener("touchcancel", completeGesture);

    return () => {
      rootElement.removeEventListener("touchstart", handleTouchStart);
      rootElement.removeEventListener("touchmove", handleTouchMove);
      rootElement.removeEventListener("touchend", completeGesture);
      rootElement.removeEventListener("touchcancel", completeGesture);
    };
  }, []);

  const indicatorOffset = Math.max(0, pullDistance - 26);
  const indicatorScale = 0.92 + Math.min(pullDistance / MAX_PULL_DISTANCE, 1) * 0.08;
  const indicatorVisible = pullDistance > 0 || isRefreshing;
  const indicatorLabel = isRefreshing
    ? "Refreshing..."
    : isArmed
      ? "Release to refresh"
      : "Pull to refresh";

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)} ref={rootRef}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[70] transition-opacity duration-150",
          indicatorVisible ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `translate(-50%, ${indicatorOffset}px) scale(${indicatorScale})`,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold tracking-[0.04em] shadow-[0_16px_30px_rgba(9,34,101,0.18)] backdrop-blur-xl",
            variant === "child"
              ? "border-white/20 bg-[rgba(13,52,141,0.82)] text-white"
              : "border-[rgba(20,86,216,0.12)] bg-white/92 text-[#1456d8]",
          )}
        >
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full",
              variant === "child" ? "bg-white/14" : "bg-[#eaf2ff]",
            )}
          >
            {isRefreshing ? (
              <RefreshSpinner className={variant === "child" ? "text-white" : "text-[#1456d8]"} />
            ) : (
              <RefreshArrow
                armed={isArmed}
                className={variant === "child" ? "text-white" : "text-[#1456d8]"}
              />
            )}
          </span>
          <span>{indicatorLabel}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
