"use client";

import { useEffect } from "react";
import {
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_ENABLED_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
  LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY,
  LEGACY_CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";

export function ChildModePersistence({
  familyId,
  childProfileId,
}: {
  familyId: string;
  childProfileId: string;
}) {
  useEffect(() => {
    window.localStorage.setItem(CHILD_MODE_STORAGE_KEY, childProfileId);
    window.localStorage.setItem(CHILD_MODE_FAMILY_STORAGE_KEY, familyId);
    window.localStorage.setItem(CHILD_MODE_ENABLED_STORAGE_KEY, "true");
    window.localStorage.setItem(LEGACY_CHILD_MODE_STORAGE_KEY, childProfileId);
    window.localStorage.setItem(LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY, "true");

    console.debug("[goodKiddo][child-mode] session-saved", {
      childProfileId,
      familyId,
      source: "child-mode-persistence",
    });
  }, [childProfileId, familyId]);

  return null;
}
