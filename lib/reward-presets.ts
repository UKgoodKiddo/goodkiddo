export type RewardPreset = {
  defaultCost: number;
  description: string;
  title: string;
};

export const REWARD_PRESETS: RewardPreset[] = [
  {
    title: "Extra Screen Time",
    description: "Earn an extra 20 minutes of screen time today.",
    defaultCost: 20,
  },
  {
    title: "Ice Cream",
    description: "Choose an ice cream treat on the next outing.",
    defaultCost: 15,
  },
  {
    title: "Sweet Treat",
    description: "Pick a little sweet treat after dinner.",
    defaultCost: 10,
  },
  {
    title: "Movie Night",
    description: "Choose a movie for a cosy family movie night.",
    defaultCost: 25,
  },
  {
    title: "Popcorn and Film",
    description: "A film night with popcorn and a comfy blanket pile.",
    defaultCost: 20,
  },
  {
    title: "Choose Dinner",
    description: "Pick what is for dinner one night this week.",
    defaultCost: 25,
  },
  {
    title: "Choose Today's Activity",
    description: "Be the boss of one family activity for the day.",
    defaultCost: 20,
  },
  {
    title: "Trip to the Park",
    description: "Plan a special park trip with snacks and play time.",
    defaultCost: 30,
  },
  {
    title: "Family Bike Ride",
    description: "Head out together for a family bike ride adventure.",
    defaultCost: 35,
  },
  {
    title: "Family Game Night",
    description: "Pick the games for a family games night.",
    defaultCost: 25,
  },
  {
    title: "Pocket Money",
    description: "Swap boops for a little pocket money reward.",
    defaultCost: 40,
  },
  {
    title: "Surprise Reward",
    description: "Let your grown-up choose a fun surprise reward.",
    defaultCost: 20,
  },
];

function normalizeRewardPresetTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findRewardPresetByTitle(title: string) {
  const normalizedTitle = normalizeRewardPresetTitle(title);

  return (
    REWARD_PRESETS.find(
      (preset) => normalizeRewardPresetTitle(preset.title) === normalizedTitle,
    ) ?? null
  );
}
