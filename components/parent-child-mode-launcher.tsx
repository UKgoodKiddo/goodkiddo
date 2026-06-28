"use client";

import { launchChildModeAction } from "@/app/actions";
import {
  CHILD_MODE_ENABLED_STORAGE_KEY,
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
  LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY,
  LEGACY_CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";

export function ParentChildModeLauncher({
  childProfileId,
  deviceLabel,
  familyId,
}: {
  childProfileId: string;
  deviceLabel: string;
  familyId: string;
}) {
  function handleSubmit() {
    window.localStorage.setItem(CHILD_MODE_STORAGE_KEY, childProfileId);
    window.localStorage.setItem(CHILD_MODE_FAMILY_STORAGE_KEY, familyId);
    window.localStorage.setItem(CHILD_MODE_ENABLED_STORAGE_KEY, "true");
    window.localStorage.setItem(LEGACY_CHILD_MODE_STORAGE_KEY, childProfileId);
    window.localStorage.setItem(LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY, "true");

    console.debug("[goodKiddo][child-mode] session-saved", {
      childProfileId,
      familyId,
      source: "parent-child-mode-launcher",
    });
  }

  return (
    <form action={launchChildModeAction} onSubmit={handleSubmit}>
      <input type="hidden" name="childProfileId" value={childProfileId} />
      <input type="hidden" name="familyId" value={familyId} />
      <input type="hidden" name="deviceLabel" value={deviceLabel} />
      <button className="btn btn-secondary w-full text-sm" type="submit">
        Launch child mode
      </button>
    </form>
  );
}
