export type AchievementDefinition = {
  id: string;
  title: string;
  description?: string;
  imageSrc?: string;
  order: number;
  isFinalBadge?: boolean;
};

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "boop-pop-pirates",
    title: "Boop Pop Pirate Badge",
    description: "You found a playful pirate Boop badge. Splashy exploring counts!",
    order: 1,
  },
  {
    id: "creative-cove",
    title: "Creative Cove Artist Badge",
    description: "You made something bright and brilliant in Creative Cove.",
    order: 2,
  },
  {
    id: "beach-bay",
    title: "Beach Bay Badge",
    description: "You booped your way through sunny Beach Bay adventures.",
    order: 3,
  },
  {
    id: "feelings-forest",
    title: "Feelings Forest Badge",
    description: "You explored feelings with kindness, calm, and courage.",
    order: 4,
  },
  {
    id: "school-streetwise",
    title: "School Streetwise Badge",
    description: "You showed smart thinking and steady school-ready skills.",
    order: 5,
  },
  {
    id: "play-park",
    title: "Play Park Badge",
    description: "You found the fun in Play Park and kept exploring.",
    order: 6,
  },
  {
    id: "homely-helper",
    title: "Homely Helper Badge",
    description: "You helped out at home like a super helpful Boop star.",
    order: 7,
  },
  {
    id: "garden-grove",
    title: "Garden Grove Mini Beast and Planter Badge",
    description: "You discovered mini beasts, growing things, and garden magic.",
    order: 8,
  },
  {
    id: "kiddo-explorer-super-boop",
    title: "Kiddo Explorer Super Boop Badge",
    description: "You collected every biome badge and became a Super Boop explorer.",
    isFinalBadge: true,
    order: 9,
  },
] as const satisfies readonly AchievementDefinition[];

export type AchievementId = (typeof ACHIEVEMENT_DEFINITIONS)[number]["id"];

export type AchievementBadgePosition = {
  buttonHeight: string;
  buttonWidth: string;
  left: string;
  lockSize: string;
  top: string;
};

export const FINAL_ACHIEVEMENT_ID: AchievementId = "kiddo-explorer-super-boop";

export const STANDARD_ACHIEVEMENT_IDS = ACHIEVEMENT_DEFINITIONS
  .filter((definition) => !("isFinalBadge" in definition && definition.isFinalBadge))
  .map((definition) => definition.id) as AchievementId[];

export const STANDARD_BADGE_COUNT = STANDARD_ACHIEVEMENT_IDS.length;

export const ACHIEVEMENT_DEFINITION_MAP: Record<AchievementId, AchievementDefinition> =
  Object.fromEntries(
    ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.id, definition]),
  ) as Record<AchievementId, AchievementDefinition>;

export const ACHIEVEMENT_BADGE_POSITIONS: Record<AchievementId, AchievementBadgePosition> = {
  "boop-pop-pirates": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "19.5%",
    lockSize: "20.25%",
    top: "35.7%",
  },
  "creative-cove": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "50%",
    lockSize: "20.25%",
    top: "35.7%",
  },
  "beach-bay": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "80.5%",
    lockSize: "20.25%",
    top: "35.7%",
  },
  "feelings-forest": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "19.5%",
    lockSize: "20.25%",
    top: "56.1%",
  },
  "school-streetwise": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "50%",
    lockSize: "20.25%",
    top: "56.1%",
  },
  "play-park": {
    buttonHeight: "23%",
    buttonWidth: "27.5%",
    left: "80.5%",
    lockSize: "20.25%",
    top: "56.1%",
  },
  "homely-helper": {
    buttonHeight: "24%",
    buttonWidth: "27.5%",
    left: "19.5%",
    lockSize: "20.25%",
    top: "76.45%",
  },
  "garden-grove": {
    buttonHeight: "24%",
    buttonWidth: "27.5%",
    left: "50%",
    lockSize: "20.25%",
    top: "76.45%",
  },
  "kiddo-explorer-super-boop": {
    buttonHeight: "24%",
    buttonWidth: "27.5%",
    left: "80.5%",
    lockSize: "20.25%",
    top: "76.45%",
  },
};

export const ACHIEVEMENT_PROGRESS_LAYOUT = {
  left: "24.4%",
  top: "93.05%",
  width: "51.8%",
} as const;

export function isAchievementId(value: string): value is AchievementId {
  return value in ACHIEVEMENT_DEFINITION_MAP;
}
