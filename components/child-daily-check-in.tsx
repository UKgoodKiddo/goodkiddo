"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CHECK_IN_STORAGE_PREFIX = "goodkiddo-daily-check-in";

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ChildDailyCheckIn() {
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;
    const localDate = getLocalDateString();
    const storageKey = `${CHECK_IN_STORAGE_PREFIX}:${localDate}`;

    if (window.sessionStorage.getItem(storageKey) === "done") {
      return;
    }

    async function submitCheckIn() {
      try {
        const response = await fetch("/api/child/check-in", {
          body: JSON.stringify({ localDate }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as {
          awardedAmount?: number;
          createdCheckIn?: boolean;
          ok?: boolean;
        };

        if (result.ok) {
          window.sessionStorage.setItem(storageKey, "done");
        }

        if (!isCancelled && result.ok && (result.createdCheckIn || (result.awardedAmount ?? 0) > 0)) {
          router.refresh();
        }
      } catch {
        // We silently ignore check-in failures so child mode still opens.
      }
    }

    void submitCheckIn();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return null;
}
