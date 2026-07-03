import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getLooseTaskCardTitle,
  normalizeTaskCardTitle,
  TASK_CARD_CATEGORY_ORDER,
  type TaskCardCategoryName,
} from "@/lib/task-card-utils";

export type TaskCardAssetSource = "local" | "storage";

export type TaskCardAssetFileRecord = {
  assetSrc: string;
  category: TaskCardCategoryName;
  fileName: string;
  looseTitle: string;
  normalizedTitle: string;
  source: TaskCardAssetSource;
  title: string;
};

export type TaskCardAssetCoverageRecord = {
  category: TaskCardCategoryName;
  childAssetSrc: string | null;
  childSource: TaskCardAssetSource | null;
  key: string;
  normalizedTitle: string;
  parentAssetSrc: string | null;
  parentSource: TaskCardAssetSource | null;
  title: string;
};

const PUBLIC_ROOT = path.join(process.cwd(), "public");
export const PARENT_TASK_CARD_ROOT = path.join(
  PUBLIC_ROOT,
  "goodkiddo",
  "Task Cards",
  "Parent UI task cards",
);
export const CHILD_TASK_CARD_ROOT = path.join(
  PUBLIC_ROOT,
  "goodkiddo",
  "Task Cards",
  "Child UI task cards",
);
export const TASK_CARD_ASSET_BUCKET = "task-card-assets";
export const TASK_CARD_ASSET_MAX_BYTES = 8 * 1024 * 1024;

const DISCOVERABLE_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const INVALID_TASK_ASSET_NAME_PATTERN = /[<>:"/\\|?*\u0000-\u001f]/;

function toPublicAssetSrc(absolutePath: string) {
  return `/${path.relative(PUBLIC_ROOT, absolutePath).split(path.sep).join("/")}`;
}

function buildStorageTaskAssetPublicUrl(objectPath: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.storage.from(TASK_CARD_ASSET_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

function buildStorageTaskAssetPath(
  collection: "child" | "parent",
  category: TaskCardCategoryName,
  fileName: string,
) {
  return `${collection}/${category}/${fileName}`;
}

function getCoverageKey(category: TaskCardCategoryName, normalizedTitle: string) {
  return `${category}:${normalizedTitle}`;
}

function toAssetFileRecord(params: {
  assetSrc: string;
  category: TaskCardCategoryName;
  fileName: string;
  source: TaskCardAssetSource;
}) {
  const title = params.fileName.replace(/\.[^.]+$/, "");

  return {
    assetSrc: params.assetSrc,
    category: params.category,
    fileName: params.fileName,
    looseTitle: getLooseTaskCardTitle(params.fileName),
    normalizedTitle: normalizeTaskCardTitle(params.fileName),
    source: params.source,
    title,
  } satisfies TaskCardAssetFileRecord;
}

async function readLocalTaskCardCategory(
  rootDirectory: string,
  category: TaskCardCategoryName,
) {
  try {
    const categoryDirectory = path.join(rootDirectory, category);
    const entries = await readdir(categoryDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .filter((entry) => DISCOVERABLE_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) =>
        toAssetFileRecord({
          assetSrc: toPublicAssetSrc(path.join(categoryDirectory, entry.name)),
          category,
          fileName: entry.name,
          source: "local",
        }),
      )
      .sort((left, right) => left.title.localeCompare(right.title));
  } catch {
    return [] as TaskCardAssetFileRecord[];
  }
}

async function readStorageTaskCardCategory(
  collection: "child" | "parent",
  category: TaskCardCategoryName,
) {
  if (!isServiceRoleConfigured()) {
    return [] as TaskCardAssetFileRecord[];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(TASK_CARD_ASSET_BUCKET)
    .list(`${collection}/${category}`, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    return [] as TaskCardAssetFileRecord[];
  }

  return (data ?? [])
    .map((entry) => entry.name)
    .filter((name) => DISCOVERABLE_IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .map((fileName) =>
      toAssetFileRecord({
        assetSrc: buildStorageTaskAssetPublicUrl(
          buildStorageTaskAssetPath(collection, category, fileName),
        ),
        category,
        fileName,
        source: "storage",
      }),
    );
}

function dedupeTaskCardAssets(assets: TaskCardAssetFileRecord[]) {
  const byKey = new Map<string, TaskCardAssetFileRecord>();

  for (const asset of assets) {
    byKey.set(getCoverageKey(asset.category, asset.normalizedTitle), asset);
  }

  return Array.from(byKey.values()).sort((left, right) => {
    const categoryDelta =
      TASK_CARD_CATEGORY_ORDER.indexOf(left.category) - TASK_CARD_CATEGORY_ORDER.indexOf(right.category);

    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

export function canonicalizeTaskAssetTitle(taskName: string) {
  const cleaned = taskName.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    throw new Error("Task name is required.");
  }

  if (INVALID_TASK_ASSET_NAME_PATTERN.test(cleaned)) {
    throw new Error("Task names cannot contain slashes or reserved filename characters.");
  }

  return cleaned;
}

export function buildCanonicalTaskAssetFileName(taskName: string) {
  return `${canonicalizeTaskAssetTitle(taskName)}.png`;
}

export async function validateTaskAssetUpload(file: File) {
  if (file.size <= 0 || file.size > TASK_CARD_ASSET_MAX_BYTES) {
    return false;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  const supportedByName = DISCOVERABLE_IMAGE_EXTENSIONS.has(fileExtension);
  const supportedByMime = file.type.startsWith("image/");

  if (!supportedByName && !supportedByMime) {
    return false;
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(inputBuffer).metadata();

    return Boolean(metadata.width && metadata.height);
  } catch {
    return false;
  }
}

export async function ensureTaskCardAssetBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const existingBucket = buckets.find((bucket) => bucket.name === TASK_CARD_ASSET_BUCKET);

  if (existingBucket) {
    return supabase;
  }

  const { error } = await supabase.storage.createBucket(TASK_CARD_ASSET_BUCKET, {
    allowedMimeTypes: ["image/png"],
    fileSizeLimit: TASK_CARD_ASSET_MAX_BYTES,
    public: true,
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }

  return supabase;
}

export async function getTaskCardAssetFiles() {
  const [localParentTaskGroups, localChildTaskGroups, storageParentTaskGroups, storageChildTaskGroups] =
    await Promise.all([
      Promise.all(
        TASK_CARD_CATEGORY_ORDER.map((category) =>
          readLocalTaskCardCategory(PARENT_TASK_CARD_ROOT, category),
        ),
      ),
      Promise.all(
        TASK_CARD_CATEGORY_ORDER.map((category) =>
          readLocalTaskCardCategory(CHILD_TASK_CARD_ROOT, category),
        ),
      ),
      Promise.all(
        TASK_CARD_CATEGORY_ORDER.map((category) =>
          readStorageTaskCardCategory("parent", category),
        ),
      ),
      Promise.all(
        TASK_CARD_CATEGORY_ORDER.map((category) =>
          readStorageTaskCardCategory("child", category),
        ),
      ),
    ]);

  return {
    childAssets: dedupeTaskCardAssets([...localChildTaskGroups.flat(), ...storageChildTaskGroups.flat()]),
    parentAssets: dedupeTaskCardAssets([
      ...localParentTaskGroups.flat(),
      ...storageParentTaskGroups.flat(),
    ]),
  };
}

export async function getTaskAssetCoverage() {
  const { childAssets, parentAssets } = await getTaskCardAssetFiles();
  const childByKey = new Map(
    childAssets.map((asset) => [getCoverageKey(asset.category, asset.normalizedTitle), asset]),
  );
  const parentByKey = new Map(
    parentAssets.map((asset) => [getCoverageKey(asset.category, asset.normalizedTitle), asset]),
  );
  const keys = Array.from(new Set([...parentByKey.keys(), ...childByKey.keys()]));

  return keys
    .map((key) => {
      const parentAsset = parentByKey.get(key) ?? null;
      const childAsset = childByKey.get(key) ?? null;
      const category = parentAsset?.category ?? childAsset?.category;
      const normalizedTitle = parentAsset?.normalizedTitle ?? childAsset?.normalizedTitle;
      const title = parentAsset?.title ?? childAsset?.title;

      if (!category || !normalizedTitle || !title) {
        return null;
      }

      return {
        category,
        childAssetSrc: childAsset?.assetSrc ?? null,
        childSource: childAsset?.source ?? null,
        key,
        normalizedTitle,
        parentAssetSrc: parentAsset?.assetSrc ?? null,
        parentSource: parentAsset?.source ?? null,
        title,
      } satisfies TaskCardAssetCoverageRecord;
    })
    .filter((record): record is TaskCardAssetCoverageRecord => Boolean(record))
    .sort((left, right) => {
      const categoryDelta =
        TASK_CARD_CATEGORY_ORDER.indexOf(left.category) - TASK_CARD_CATEGORY_ORDER.indexOf(right.category);

      if (categoryDelta !== 0) {
        return categoryDelta;
      }

      return left.title.localeCompare(right.title);
    });
}

export async function taskAssetExists(params: {
  category: TaskCardCategoryName;
  taskName: string;
}) {
  const fileName = buildCanonicalTaskAssetFileName(params.taskName);
  const coverage = await getTaskAssetCoverage();
  const key = getCoverageKey(params.category, normalizeTaskCardTitle(fileName));

  return coverage.some((record) => record.key === key);
}

export async function uploadTaskAssetPair(params: {
  category: TaskCardCategoryName;
  childAssetFile: File;
  parentAssetFile: File;
  taskName: string;
}) {
  const supabase = await ensureTaskCardAssetBucket();
  const fileName = buildCanonicalTaskAssetFileName(params.taskName);
  const parentObjectPath = buildStorageTaskAssetPath("parent", params.category, fileName);
  const childObjectPath = buildStorageTaskAssetPath("child", params.category, fileName);
  const [parentInputBuffer, childInputBuffer] = await Promise.all([
    params.parentAssetFile.arrayBuffer(),
    params.childAssetFile.arrayBuffer(),
  ]);
  const [parentBuffer, childBuffer] = await Promise.all([
    sharp(Buffer.from(parentInputBuffer))
      .rotate()
      .keepMetadata()
      .png({
        adaptiveFiltering: true,
        compressionLevel: 9,
        palette: false,
      })
      .toBuffer(),
    sharp(Buffer.from(childInputBuffer))
      .rotate()
      .keepMetadata()
      .png({
        adaptiveFiltering: true,
        compressionLevel: 9,
        palette: false,
      })
      .toBuffer(),
  ]);

  const [parentUpload, childUpload] = await Promise.all([
    supabase.storage.from(TASK_CARD_ASSET_BUCKET).upload(parentObjectPath, parentBuffer, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: true,
    }),
    supabase.storage.from(TASK_CARD_ASSET_BUCKET).upload(childObjectPath, childBuffer, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: true,
    }),
  ]);

  if (parentUpload.error) {
    throw new Error(parentUpload.error.message);
  }

  if (childUpload.error) {
    throw new Error(childUpload.error.message);
  }

  return {
    childAssetSrc: buildStorageTaskAssetPublicUrl(childObjectPath),
    fileName,
    parentAssetSrc: buildStorageTaskAssetPublicUrl(parentObjectPath),
  };
}
