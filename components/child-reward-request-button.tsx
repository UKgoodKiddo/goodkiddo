"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ChildPageRoute } from "@/lib/child-ui";
import {
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";

export function ChildRewardRequestButton({
  disabled,
  returnTo,
  rewardId,
}: {
  disabled: boolean;
  returnTo: ChildPageRoute;
  rewardId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (disabled || isPending) {
      return;
    }

    console.debug("[goodKiddo][reward-request] start", {
      rewardId,
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

          if (result.redirectTo) {
            router.replace(result.redirectTo);
            router.refresh();
          }
        })
        .catch((error: unknown) => {
          console.debug("[goodKiddo][reward-request] error", error);
          router.replace(`${returnTo}?status=action-failed`);
          router.refresh();
        });
    });
  }

  return (
    <button
      className="btn btn-secondary px-4 py-2 text-sm"
      disabled={disabled || isPending}
      onClick={handleClick}
      type="button"
    >
      {isPending ? "Requesting..." : "Request"}
    </button>
  );
}
