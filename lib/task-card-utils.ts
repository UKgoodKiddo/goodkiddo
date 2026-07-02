export const TASK_CARD_CATEGORY_ORDER = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Learning",
  "Healthy Eating",
  "General",
] as const;

export type TaskCardCategoryName = (typeof TASK_CARD_CATEGORY_ORDER)[number];

const TASK_CARD_TITLE_STOPWORDS = new Set(["a", "an", "the", "your"]);

export function stripTaskCardExtension(value: string) {
  return value.replace(/\.[^.]+$/, "");
}

export function normalizeTaskCardTitle(value: string) {
  return stripTaskCardExtension(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getLooseTaskCardTitle(value: string) {
  return normalizeTaskCardTitle(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !TASK_CARD_TITLE_STOPWORDS.has(token))
    .join(" ");
}

export function tokenizeTaskCardTitle(value: string) {
  return getLooseTaskCardTitle(value)
    .split(" ")
    .filter(Boolean);
}

export function taskCardTitlesMatch(left: string, right: string) {
  const leftExact = normalizeTaskCardTitle(left);
  const rightExact = normalizeTaskCardTitle(right);

  if (leftExact === rightExact) {
    return true;
  }

  const leftLoose = getLooseTaskCardTitle(left);
  const rightLoose = getLooseTaskCardTitle(right);

  if (leftLoose === rightLoose) {
    return true;
  }

  const leftTokens = tokenizeTaskCardTitle(left);
  const rightTokens = tokenizeTaskCardTitle(right);

  if (!leftTokens.length || !rightTokens.length) {
    return false;
  }

  const leftPhrase = leftTokens.join(" ");
  const rightPhrase = rightTokens.join(" ");

  return leftPhrase.includes(rightPhrase) || rightPhrase.includes(leftPhrase);
}
