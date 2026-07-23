export const BOOP_POP_PIRATES_ROUTE = "/child/kiddo_explorers/boop_pop_pirates" as const;
export const BOOP_POP_PIRATES_BIOME_ID = "boop-pop-pirates" as const;

const BOOP_POP_PIRATES_BASE_PATH = "/boop-pop-pirates-handover";

export const BOOP_POP_PIRATES_ASSETS = {
  background: `${BOOP_POP_PIRATES_BASE_PATH}/boop-pop-pirates-ui-background.webp`,
  biomeIcon: `${BOOP_POP_PIRATES_BASE_PATH}/boop-pop-pirates-biome-icon.webp`,
  collectibleLanding: `${BOOP_POP_PIRATES_BASE_PATH}/bubble-popped-ground.webp`,
  popSplat: `${BOOP_POP_PIRATES_BASE_PATH}/bubble-pop-splat.webp`,
  seaGull: `${BOOP_POP_PIRATES_BASE_PATH}/seagul.webp`,
  ship: `${BOOP_POP_PIRATES_BASE_PATH}/boop-pop-ship.webp`,
} as const;

export const BOOP_POP_PIRATES_REGULAR_BUBBLES = [
  {
    id: "blue",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/blue-bubble.webp`,
    label: "Blue bubble",
  },
  {
    id: "green",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/green-bubble.webp`,
    label: "Green bubble",
  },
  {
    id: "pink",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/pink-bubble.webp`,
    label: "Pink bubble",
  },
  {
    id: "purple",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/purple-bubble.webp`,
    label: "Purple bubble",
  },
  {
    id: "red",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/red-bubble.webp`,
    label: "Red bubble",
  },
  {
    id: "yellow",
    asset: `${BOOP_POP_PIRATES_BASE_PATH}/yellow-bubble.webp`,
    label: "Yellow bubble",
  },
] as const;

export const BOOP_POP_PIRATES_COLLECTIBLES = [
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/anchor-collectible-bubble.webp`,
    id: "anchor",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/anchor-collectible.webp`,
    label: "Anchor collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/boat-wheel-collectible-bubble.webp`,
    id: "boat-wheel",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/boat-wheel-collectible.webp`,
    label: "Boat wheel collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/compass-collectible-bubble.webp`,
    id: "compass",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/compass-collectible.webp`,
    label: "Compass collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/message-bottle-collectible-bubble.webp`,
    id: "message-bottle",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/message-bottle-collectible.webp`,
    label: "Message bottle collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/pirate-flag-collectible-bubble.webp`,
    id: "pirate-flag",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/pirate-flag-collectible.webp`,
    label: "Pirate flag collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/pirate-hat-collectible-bubble.webp`,
    id: "pirate-hat",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/pirate-hat-collectible.webp`,
    label: "Pirate hat collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/potion-collectible-bubble.webp`,
    id: "potion",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/potion-collectible.webp`,
    label: "Potion collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/telescope-collectible-bubble.webp`,
    id: "telescope",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/telescope-collectible.webp`,
    label: "Telescope collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/treasure-chest-collectible-bubble.webp`,
    id: "treasure-chest",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/treasure-chest-collectible.webp`,
    label: "Treasure chest collectible",
  },
  {
    bubbleAsset: `${BOOP_POP_PIRATES_BASE_PATH}/treasure-map-collectible-bubble.webp`,
    id: "treasure-map",
    itemAsset: `${BOOP_POP_PIRATES_BASE_PATH}/treasure-map-collectible.webp`,
    label: "Treasure map collectible",
  },
] as const;

export type BoopPopPiratesBubbleColorId =
  (typeof BOOP_POP_PIRATES_REGULAR_BUBBLES)[number]["id"];

export type BoopPopPiratesCollectibleId =
  (typeof BOOP_POP_PIRATES_COLLECTIBLES)[number]["id"];

export const BOOP_POP_PIRATES_COLLECTIBLE_IDS = BOOP_POP_PIRATES_COLLECTIBLES.map(
  (collectible) => collectible.id,
) as readonly BoopPopPiratesCollectibleId[];

export const BOOP_POP_PIRATES_PRELOAD_ASSETS = [
  BOOP_POP_PIRATES_ASSETS.background,
  BOOP_POP_PIRATES_ASSETS.ship,
  BOOP_POP_PIRATES_ASSETS.popSplat,
  BOOP_POP_PIRATES_ASSETS.collectibleLanding,
  BOOP_POP_PIRATES_ASSETS.biomeIcon,
  ...BOOP_POP_PIRATES_REGULAR_BUBBLES.map((bubble) => bubble.asset),
  ...BOOP_POP_PIRATES_COLLECTIBLES.flatMap((collectible) => [
    collectible.bubbleAsset,
    collectible.itemAsset,
  ]),
] as const;

export function getBoopPopPiratesCollectibleById(
  collectibleId: BoopPopPiratesCollectibleId,
) {
  return BOOP_POP_PIRATES_COLLECTIBLES.find(
    (collectible) => collectible.id === collectibleId,
  )!;
}

export function isBoopPopPiratesCollectibleId(
  value: string,
): value is BoopPopPiratesCollectibleId {
  return BOOP_POP_PIRATES_COLLECTIBLE_IDS.includes(
    value as BoopPopPiratesCollectibleId,
  );
}
