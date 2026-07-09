import { GOODKIDDO_ASSETS } from "@/lib/goodkiddo-assets";

export const CHILD_PAGE_ROUTES = [
  "/child",
  "/child/collect",
  "/child/tasks",
  "/child/rewards",
  "/child/profile",
] as const;

export type ChildPageRoute = (typeof CHILD_PAGE_ROUTES)[number];

export const CHILD_AVATAR_PRESET_URLS = [
  GOODKIDDO_ASSETS.boopHappy,
  GOODKIDDO_ASSETS.boopCool,
  GOODKIDDO_ASSETS.boopWink,
  GOODKIDDO_ASSETS.boopSleepy,
  GOODKIDDO_ASSETS.boopSurprised,
  GOODKIDDO_ASSETS.plainBoopLogo,
] as const;

export const CHILD_AVATAR_PRESETS = [
  {
    label: "Sunny Boop",
    value: GOODKIDDO_ASSETS.boopHappy,
  },
  {
    label: "Cool Boop",
    value: GOODKIDDO_ASSETS.boopCool,
  },
  {
    label: "Winky Boop",
    value: GOODKIDDO_ASSETS.boopWink,
  },
  {
    label: "Sleepy Boop",
    value: GOODKIDDO_ASSETS.boopSleepy,
  },
  {
    label: "Surprise Boop",
    value: GOODKIDDO_ASSETS.boopSurprised,
  },
  {
    label: "goodKiddo Logo",
    value: GOODKIDDO_ASSETS.plainBoopLogo,
  },
] as const;

export function buildChildStatusPath(route: ChildPageRoute, status: string) {
  return `${route}?status=${status}`;
}

export function resolveChildBanner(code?: string) {
  if (code === "child-mode-ready") {
    return {
      tone: "mint" as const,
      message: "Child mode is active on this browser.",
    };
  }

  if (code === "task-submitted") {
    return {
      tone: "mint" as const,
      message: "Task sent to your parent for approval.",
    };
  }

  if (code === "reward-requested") {
    return {
      tone: "mint" as const,
      message: "Reward request sent to your parent.",
    };
  }

  if (code === "boops-collected") {
    return {
      tone: "mint" as const,
      message: "Boops collected. Your balance is now updated.",
    };
  }

  if (code === "avatar-updated") {
    return {
      tone: "mint" as const,
      message: "Avatar updated for this child profile.",
    };
  }

  if (code === "no-boops-waiting") {
    return {
      tone: "sun" as const,
      message: "There are no waiting boops to collect right now.",
    };
  }

  if (code === "wrong-booper") {
    return {
      tone: "rose" as const,
      message: "That Booper is not assigned to this child profile.",
    };
  }

  if (code === "task-already-submitted") {
    return {
      tone: "sun" as const,
      message: "That task is already pending or already approved for this time window.",
    };
  }

  if (code === "not-enough-boops") {
    return {
      tone: "rose" as const,
      message: "You need a few more boops before requesting that reward.",
    };
  }

  if (code === "child-mode-required") {
    return {
      tone: "rose" as const,
      message: "Launch child mode again from the parent dashboard for this device.",
    };
  }

  if (code === "action-failed") {
    return {
      tone: "rose" as const,
      message: "That action could not be completed. Please try again.",
    };
  }

  return null;
}
