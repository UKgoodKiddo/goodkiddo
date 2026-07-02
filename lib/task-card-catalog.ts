import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import {
  getLooseTaskCardTitle,
  normalizeTaskCardTitle,
  TASK_CARD_CATEGORY_ORDER,
  taskCardTitlesMatch,
  type TaskCardCategoryName,
} from "@/lib/task-card-utils";

export type TaskCardAssetRecord = {
  category: TaskCardCategoryName;
  childAssetSrc: string | null;
  key: string;
  looseTitle: string;
  normalizedTitle: string;
  parentAssetSrc: string;
  title: string;
};

export type TaskCardCatalog = {
  categories: Array<{
    name: TaskCardCategoryName;
    tasks: TaskCardAssetRecord[];
  }>;
  tasks: TaskCardAssetRecord[];
};

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const PARENT_TASK_CARD_ROOT = path.join(
  PUBLIC_ROOT,
  "goodkiddo",
  "Task Cards",
  "Parent UI task cards",
);
const CHILD_TASK_CARD_ROOT = path.join(
  PUBLIC_ROOT,
  "goodkiddo",
  "Task Cards",
  "Child UI task cards",
);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function toPublicAssetSrc(absolutePath: string) {
  return `/${path.relative(PUBLIC_ROOT, absolutePath).split(path.sep).join("/")}`;
}

async function readTaskCardCategory(
  rootDirectory: string,
  category: TaskCardCategoryName,
) {
  const categoryDirectory = path.join(rootDirectory, category);
  const entries = await readdir(categoryDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({
      assetSrc: toPublicAssetSrc(path.join(categoryDirectory, entry.name)),
      category,
      fileName: entry.name,
      looseTitle: getLooseTaskCardTitle(entry.name),
      normalizedTitle: normalizeTaskCardTitle(entry.name),
      title: entry.name.replace(/\.[^.]+$/, ""),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function resolveMatchingChildAsset(
  parentAsset: {
    category: TaskCardCategoryName;
    looseTitle: string;
    normalizedTitle: string;
    title: string;
  },
  childAssets: Array<{
    assetSrc: string;
    category: TaskCardCategoryName;
    looseTitle: string;
    normalizedTitle: string;
    title: string;
  }>,
) {
  return (
    childAssets.find(
      (asset) =>
        asset.category === parentAsset.category &&
        asset.normalizedTitle === parentAsset.normalizedTitle,
    ) ??
    childAssets.find(
      (asset) =>
        asset.category === parentAsset.category && asset.looseTitle === parentAsset.looseTitle,
    ) ??
    childAssets.find(
      (asset) =>
        asset.category === parentAsset.category &&
        taskCardTitlesMatch(asset.title, parentAsset.title),
    ) ??
    null
  );
}

export const getTaskCardCatalog = cache(async (): Promise<TaskCardCatalog> => {
  const [parentTaskGroups, childTaskGroups] = await Promise.all([
    Promise.all(
      TASK_CARD_CATEGORY_ORDER.map((category) =>
        readTaskCardCategory(PARENT_TASK_CARD_ROOT, category),
      ),
    ),
    Promise.all(
      TASK_CARD_CATEGORY_ORDER.map((category) =>
        readTaskCardCategory(CHILD_TASK_CARD_ROOT, category),
      ),
    ),
  ]);

  const childTaskAssets = childTaskGroups.flat();
  const tasks = parentTaskGroups
    .flat()
    .map((parentAsset) => {
      const childAsset = resolveMatchingChildAsset(parentAsset, childTaskAssets);

      return {
        category: parentAsset.category,
        childAssetSrc: childAsset?.assetSrc ?? null,
        key: `${parentAsset.category}:${parentAsset.normalizedTitle}`,
        looseTitle: parentAsset.looseTitle,
        normalizedTitle: parentAsset.normalizedTitle,
        parentAssetSrc: parentAsset.assetSrc,
        title: parentAsset.title,
      } satisfies TaskCardAssetRecord;
    });

  return {
    categories: TASK_CARD_CATEGORY_ORDER.map((category) => ({
      name: category,
      tasks: tasks.filter((task) => task.category === category),
    })),
    tasks,
  };
});

export function findTaskCardAssetInCatalog(
  title: string,
  taskAssets: TaskCardAssetRecord[],
) {
  const normalizedTitle = normalizeTaskCardTitle(title);
  const looseTitle = getLooseTaskCardTitle(title);

  return (
    taskAssets.find((taskAsset) => taskAsset.normalizedTitle === normalizedTitle) ??
    taskAssets.find((taskAsset) => taskAsset.looseTitle === looseTitle) ??
    taskAssets.find((taskAsset) => taskCardTitlesMatch(taskAsset.title, title)) ??
    null
  );
}

export async function resolveTaskCardAsset(title: string) {
  const catalog = await getTaskCardCatalog();
  return findTaskCardAssetInCatalog(title, catalog.tasks);
}
