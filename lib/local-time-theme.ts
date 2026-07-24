export type ParentThemePhase = "day" | "night";

const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 19;

export const DEFAULT_PARENT_THEME_PHASE: ParentThemePhase = "day";

export function getResolvedBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function getHourForTimeZone(date: Date, timeZone: string | null) {
  if (!timeZone) {
    return date.getHours();
  }

  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(date);
    const hourValue = Number(parts.find((part) => part.type === "hour")?.value);

    return Number.isFinite(hourValue) ? hourValue : date.getHours();
  } catch {
    return date.getHours();
  }
}

export function resolveParentThemePhase(
  date = new Date(),
  timeZone = getResolvedBrowserTimeZone(),
): ParentThemePhase {
  const hour = getHourForTimeZone(date, timeZone);

  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR ? "night" : "day";
}

export function buildParentThemeSnapshot(date = new Date()) {
  const timeZone = getResolvedBrowserTimeZone();
  const phase = resolveParentThemePhase(date, timeZone);

  return {
    isNight: phase === "night",
    phase,
    timeZone,
  };
}
