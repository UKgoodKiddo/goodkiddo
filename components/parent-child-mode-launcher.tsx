"use client";

import { launchChildModeAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import {
  CHILD_MODE_ENABLED_STORAGE_KEY,
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_SPLASH_PENDING_STORAGE_KEY,
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
    window.sessionStorage.setItem(
      CHILD_MODE_SPLASH_PENDING_STORAGE_KEY,
      childProfileId,
    );

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
      <LoadingSubmitButton
        className="btn btn-secondary min-h-[3.85rem] w-full max-w-full justify-center gap-2 px-3 text-center text-[0.88rem] leading-tight whitespace-normal"
        spinnerOnly
      >
        Launch child mode
      </LoadingSubmitButton>
    </form>
  );
}
