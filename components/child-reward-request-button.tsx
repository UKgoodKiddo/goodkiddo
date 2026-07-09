"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChildPageRoute } from "@/lib/child-ui";
import {
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";
import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

function ConfettiBurst({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="child-boop-confetti child-boop-confetti--fullscreen"
      data-active={active ? "true" : "false"}
    >
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className="child-boop-confetti-piece"
          style={
            {
              "--confetti-delay": `${index * 18}ms`,
              "--confetti-rotation": `${index * 29}deg`,
              "--confetti-x": `${((index % 6) - 2.5) * 74}px`,
              "--confetti-y": `${-120 - (index % 5) * 36}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function ChildRewardRequestButton({
  cost,
  disabled,
  iconSrc,
  returnTo,
  rewardId,
  rewardTitle,
}: {
  cost: number;
  disabled: boolean;
  iconSrc: string;
  returnTo: ChildPageRoute;
  rewardId: string;
  rewardTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [isQueuedRefresh, setIsQueuedRefresh] = useState(false);
  const celebrateTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (celebrateTimeoutRef.current !== null) {
        window.clearTimeout(celebrateTimeoutRef.current);
      }
    };
  }, []);

  function handleClick() {
    if (disabled || isPending || isQueuedRefresh) {
      return;
    }

    console.debug("[goodKiddo][reward-request] start", {
      rewardId,
      rewardTitle,
      returnTo,
      storedChildProfileId: window.localStorage.getItem(CHILD_MODE_STORAGE_KEY),
      storedFamilyId: window.localStorage.getItem(CHILD_MODE_FAMILY_STORAGE_KEY),
    });

    startTransition(() => {
      void fetch("/api/child/rewards/request", {
        body: JSON.stringify({
          rewardId,
          returnTo,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
        .then(async (response) => {
          const result = (await response.json()) as {
            ok?: boolean;
            redirectTo?: string;
          };

          console.debug("[goodKiddo][reward-request] complete", result);

          if (!result.ok) {
            if (result.redirectTo) {
              router.replace(result.redirectTo);
              router.refresh();
            }
            return;
          }

          setShowCelebrate(true);
          setIsQueuedRefresh(true);

          celebrateTimeoutRef.current = window.setTimeout(() => {
            router.refresh();
          }, 980);
        })
        .catch((error: unknown) => {
          console.debug("[goodKiddo][reward-request] error", error);
          router.replace(`${returnTo}?status=action-failed`);
          router.refresh();
        });
    });
  }

  return (
    <div className="child-reward-request-wrap">
      <button
        aria-label={disabled ? `${rewardTitle} locked` : `Request ${rewardTitle}`}
        className="child-reward-request-button"
        data-disabled={disabled ? "true" : "false"}
        data-pending={isPending || isQueuedRefresh ? "true" : "false"}
        disabled={disabled || isPending || isQueuedRefresh}
        onClick={handleClick}
        type="button"
      >
        {showCelebrate ? <ConfettiBurst active /> : null}
        <Image
          alt=""
          className="child-reward-request-icon"
          height={120}
          src={iconSrc}
          unoptimized
          width={120}
        />
      </button>
      <div className="child-reward-cost-badge">
        <span>{cost}</span>
        <Image alt="" height={18} src={GOODKIDDO_ASSETS.starIcon} unoptimized width={18} />
      </div>
    </div>
  );
}
