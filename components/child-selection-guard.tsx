"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_ENABLED_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
  LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY,
  LEGACY_CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";

export function ChildSelectionGuard({
  familyId,
  childProfileId,
  children,
}: {
  familyId: string | null;
  childProfileId: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isUnlockPage = pathname === "/child/unlock";
  const restoreAttemptRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<"checking" | "missing" | "ready" | "restoring">("checking");

  useEffect(() => {
    if (isUnlockPage) {
      return;
    }

    let cancelled = false;
    const deferPhase = (nextPhase: "checking" | "missing" | "ready" | "restoring") => {
      window.setTimeout(() => {
        if (!cancelled) {
          setPhase(nextPhase);
        }
      }, 0);
    };

    if (childProfileId && familyId) {
      window.localStorage.setItem(CHILD_MODE_STORAGE_KEY, childProfileId);
      window.localStorage.setItem(CHILD_MODE_FAMILY_STORAGE_KEY, familyId);
      window.localStorage.setItem(CHILD_MODE_ENABLED_STORAGE_KEY, "true");
      window.localStorage.setItem(LEGACY_CHILD_MODE_STORAGE_KEY, childProfileId);
      window.localStorage.setItem(LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY, "true");

      console.debug("[goodKiddo][child-mode] session-saved", {
        childProfileId,
        familyId,
        pathname,
        source: "child-selection-guard",
      });

      restoreAttemptRef.current = null;
      deferPhase("ready");
      return () => {
        cancelled = true;
      };
    }

    const storedChildProfileId =
      window.localStorage.getItem(CHILD_MODE_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_CHILD_MODE_STORAGE_KEY);
    const storedFamilyId = window.localStorage.getItem(CHILD_MODE_FAMILY_STORAGE_KEY);

    console.debug("[goodKiddo][child-mode] session-read", {
      childProfileId,
      pathname,
      storedChildProfileId,
      storedFamilyId,
    });

    if (!storedChildProfileId || !storedFamilyId) {
      restoreAttemptRef.current = null;
      deferPhase("missing");
      return () => {
        cancelled = true;
      };
    }

    const restoreAttemptKey = `${storedFamilyId}:${storedChildProfileId}`;

    if (restoreAttemptRef.current === restoreAttemptKey && phase === "restoring") {
      return () => {
        cancelled = true;
      };
    }

    restoreAttemptRef.current = restoreAttemptKey;
    deferPhase("restoring");

    void fetch("/api/child/restore-session", {
      body: JSON.stringify({
        childProfileId: storedChildProfileId,
        familyId: storedFamilyId,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    })
      .then(async (response) => {
        const result = (await response.json()) as { ok?: boolean };

        if (cancelled) {
          return;
        }

        console.debug("[goodKiddo][child-mode] restore-result", result);

        if (result.ok) {
          router.refresh();
          return;
        }

        deferPhase("missing");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        console.debug("[goodKiddo][child-mode] restore-error", error);
        deferPhase("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [childProfileId, familyId, isUnlockPage, pathname, phase, router]);

  if (isUnlockPage || (childProfileId && familyId)) {
    return <>{children}</>;
  }

  if (phase !== "missing") {
    return (
      <section className="child-panel rounded-[1.8rem] p-6 text-white">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
          Child mode
        </p>
        <h2 className="mt-3 text-3xl font-extrabold">
          {phase === "restoring"
            ? "Restoring this child profile..."
            : "Checking this device's child selection..."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
          We&apos;re checking the saved child-mode session for this device.
        </p>
      </section>
    );
  }

  return (
    <section className="child-panel rounded-[1.8rem] p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
        Needs setup
      </p>
      <h2 className="mt-3 text-3xl font-extrabold">Choose a child first</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
        This device does not have an active child profile selected yet. Open the parent picker to choose which child should use child mode here.
      </p>
      <Link className="btn btn-secondary mt-5" href="/parent/child-mode">
        Back to child picker
      </Link>
    </section>
  );
}
