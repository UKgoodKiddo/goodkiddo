import "server-only";

import {
  getLooseTaskCardTitle,
  normalizeTaskCardTitle,
  TASK_CARD_CATEGORY_ORDER,
  taskCardTitlesMatch,
  type TaskCardCategoryName,
} from "@/lib/task-card-utils";
import { getTaskCardAssetFiles, type TaskCardAssetFileRecord } from "@/lib/task-card-assets";

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

function resolveMatchingChildAsset(
  parentAsset: Pick<
    TaskCardAssetFileRecord,
    "category" | "looseTitle" | "normalizedTitle" | "title"
  >,
  childAssets: TaskCardAssetFileRecord[],
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

export async function getTaskCardCatalog(): Promise<TaskCardCatalog> {
  const { childAssets: childTaskAssets, parentAssets } = await getTaskCardAssetFiles();
  const tasks = parentAssets
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
}

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
