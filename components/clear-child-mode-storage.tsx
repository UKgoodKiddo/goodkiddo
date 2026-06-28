"use client";

import { useEffect } from "react";
import {
  CHILD_MODE_FAMILY_STORAGE_KEY,
  CHILD_MODE_ENABLED_STORAGE_KEY,
  CHILD_MODE_STORAGE_KEY,
  LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY,
  LEGACY_CHILD_MODE_STORAGE_KEY,
} from "@/lib/app-constants";

export function ClearChildModeStorage() {
  useEffect(() => {
    console.debug("[goodKiddo][child-mode] session-cleared");
    window.localStorage.removeItem(CHILD_MODE_STORAGE_KEY);
    window.localStorage.removeItem(CHILD_MODE_FAMILY_STORAGE_KEY);
    window.localStorage.removeItem(CHILD_MODE_ENABLED_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_CHILD_MODE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_CHILD_MODE_ENABLED_STORAGE_KEY);
  }, []);

  return null;
}
