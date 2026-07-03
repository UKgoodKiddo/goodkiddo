"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { normalizeTaskCardTitle, type TaskCardCategoryName } from "@/lib/task-card-utils";

type ExistingTaskAsset = {
  category: TaskCardCategoryName;
  key: string;
  title: string;
};

type SuperAdminTaskAssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: readonly TaskCardCategoryName[];
  existingAssets: ExistingTaskAsset[];
};

export function SuperAdminTaskAssetForm({
  action,
  categories,
  existingAssets,
}: SuperAdminTaskAssetFormProps) {
  const [taskName, setTaskName] = useState("");
  const [category, setCategory] = useState<TaskCardCategoryName | "">("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [parentFile, setParentFile] = useState<File | null>(null);
  const [childFile, setChildFile] = useState<File | null>(null);
  const [parentAssetDataUrl, setParentAssetDataUrl] = useState("");
  const [childAssetDataUrl, setChildAssetDataUrl] = useState("");
  const [parentAssetStatus, setParentAssetStatus] = useState<string | null>(null);
  const [childAssetStatus, setChildAssetStatus] = useState<string | null>(null);
  const [isReadingParentAsset, setIsReadingParentAsset] = useState(false);
  const [isReadingChildAsset, setIsReadingChildAsset] = useState(false);

  const parentPreview = useMemo(
    () => (parentFile ? URL.createObjectURL(parentFile) : null),
    [parentFile],
  );
  const childPreview = useMemo(
    () => (childFile ? URL.createObjectURL(childFile) : null),
    [childFile],
  );
  const existingAssetLookup = useMemo(
    () => new Map(existingAssets.map((asset) => [asset.key, asset])),
    [existingAssets],
  );
  const taskKey = category
    ? `${category}:${normalizeTaskCardTitle(taskName.trim().replace(/\s+/g, " "))}`
    : "";
  const existingTask = taskKey ? existingAssetLookup.get(taskKey) ?? null : null;
  const mustConfirmReplace = Boolean(existingTask);

  useEffect(() => {
    return () => {
      if (parentPreview) {
        URL.revokeObjectURL(parentPreview);
      }
    };
  }, [parentPreview]);

  useEffect(() => {
    return () => {
      if (childPreview) {
        URL.revokeObjectURL(childPreview);
      }
    };
  }, [childPreview]);

  async function handleAssetSelection(params: {
    file: File | null;
    setAssetDataUrl: (value: string) => void;
    setAssetFile: (value: File | null) => void;
    setAssetStatus: (value: string | null) => void;
    setIsReading: (value: boolean) => void;
  }) {
    if (!params.file) {
      params.setAssetFile(null);
      params.setAssetDataUrl("");
      params.setAssetStatus(null);
      return;
    }

    params.setAssetFile(params.file);
    params.setIsReading(true);
    params.setAssetStatus("Preparing image...");

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }

          reject(new Error("Image reader returned an unexpected result."));
        };
        reader.onerror = () => reject(reader.error ?? new Error("Image reader failed."));
        reader.readAsDataURL(params.file as Blob);
      });

      params.setAssetDataUrl(dataUrl);
      params.setAssetStatus("Image ready.");
    } catch {
      params.setAssetDataUrl("");
      params.setAssetStatus("That image could not be read. Please try another file.");
    } finally {
      params.setIsReading(false);
    }
  }

  const isReadingAnyAsset = isReadingParentAsset || isReadingChildAsset;
  const isSubmitBlocked =
    isReadingAnyAsset || !parentAssetDataUrl || !childAssetDataUrl || (mustConfirmReplace && !replaceExisting);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input
        className="field"
        name="taskName"
        onChange={(event) => {
          setTaskName(event.currentTarget.value);
          setReplaceExisting(false);
        }}
        placeholder="Task name"
        required
        value={taskName}
      />

      <select
        className="field"
        name="category"
        onChange={(event) => {
          setCategory(event.currentTarget.value as TaskCardCategoryName | "");
          setReplaceExisting(false);
        }}
        required
        value={category}
      >
        <option value="">Choose category</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-4">
          <span className="block text-sm font-bold text-[color:var(--ink-soft)]">
            Parent icon (JPG, PNG, or WebP)
          </span>
          <input name="parentAssetDataUrl" type="hidden" value={parentAssetDataUrl} />
          <input name="parentAssetOriginalName" type="hidden" value={parentFile?.name ?? ""} />
          <input
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="field mt-3"
            onChange={(event) =>
              handleAssetSelection({
                file: event.currentTarget.files?.[0] ?? null,
                setAssetDataUrl: setParentAssetDataUrl,
                setAssetFile: setParentFile,
                setAssetStatus: setParentAssetStatus,
                setIsReading: setIsReadingParentAsset,
              })
            }
            required
            type="file"
          />
          {parentAssetStatus ? (
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{parentAssetStatus}</p>
          ) : null}
          <div className="mt-3 flex min-h-36 items-center justify-center rounded-[1.3rem] border border-dashed border-[color:var(--line)] bg-white/80 p-3">
            {parentPreview ? (
              <img
                alt="Parent task preview"
                className="max-h-32 w-auto rounded-[1rem] object-contain"
                src={parentPreview}
              />
            ) : (
              <p className="text-center text-sm text-[color:var(--ink-soft)]">Image preview</p>
            )}
          </div>
        </label>

        <label className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-4">
          <span className="block text-sm font-bold text-[color:var(--ink-soft)]">
            Child task card (JPG, PNG, or WebP)
          </span>
          <input name="childAssetDataUrl" type="hidden" value={childAssetDataUrl} />
          <input name="childAssetOriginalName" type="hidden" value={childFile?.name ?? ""} />
          <input
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="field mt-3"
            onChange={(event) =>
              handleAssetSelection({
                file: event.currentTarget.files?.[0] ?? null,
                setAssetDataUrl: setChildAssetDataUrl,
                setAssetFile: setChildFile,
                setAssetStatus: setChildAssetStatus,
                setIsReading: setIsReadingChildAsset,
              })
            }
            required
            type="file"
          />
          {childAssetStatus ? (
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{childAssetStatus}</p>
          ) : null}
          <div className="mt-3 flex min-h-36 items-center justify-center rounded-[1.3rem] border border-dashed border-[color:var(--line)] bg-white/80 p-3">
            {childPreview ? (
              <img
                alt="Child task-card preview"
                className="max-h-32 w-auto rounded-[1rem] object-contain"
                src={childPreview}
              />
            ) : (
              <p className="text-center text-sm text-[color:var(--ink-soft)]">Image preview</p>
            )}
          </div>
        </label>
      </div>

      {mustConfirmReplace ? (
        <label className="rounded-[1.5rem] border border-[#ffd6bf] bg-[#fff4eb] px-4 py-3 text-sm text-[color:var(--foreground)]">
          <span className="block font-black">
            {(existingTask?.title ?? taskName) || "This task"} already exists.
          </span>
          <span className="mt-1 block text-[color:var(--ink-soft)]">
            Confirm replacement to override the existing parent and child task images.
          </span>
          <span className="mt-3 flex items-center gap-2 font-bold">
            <input
              checked={replaceExisting}
              name="replaceExisting"
              onChange={(event) => setReplaceExisting(event.currentTarget.checked)}
              type="checkbox"
            />
            Replace existing task assets
          </span>
        </label>
      ) : null}

      <button
        className="btn btn-primary"
        disabled={isSubmitBlocked}
        type="submit"
      >
        {isReadingAnyAsset
          ? "Preparing images..."
          : mustConfirmReplace
            ? "Replace task assets"
            : "Save task assets"}
      </button>
    </form>
  );
}
