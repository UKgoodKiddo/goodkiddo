export function getSuperAdminStatusBanner(
  code?: string,
  searchParams?: Record<string, string | string[] | undefined>,
) {
  switch (code) {
    case "uid-imported": {
      const added = typeof searchParams?.added === "string" ? searchParams.added : "0";
      const skipped = typeof searchParams?.skipped === "string" ? searchParams.skipped : "0";
      const invalid = typeof searchParams?.invalid === "string" ? searchParams.invalid : "0";
      const duplicates =
        typeof searchParams?.duplicates === "string" ? searchParams.duplicates : "0";

      return {
        message: `UID import complete. Added ${added}, duplicates ${duplicates}, skipped ${skipped}, invalid ${invalid}.`,
        tone: "mint" as const,
      };
    }
    case "booper-reassigned":
      return {
        message: "Booper reassigned and synced into the family record.",
        tone: "mint" as const,
      };
    case "booper-released":
      return {
        message: "Booper released from the family and returned to available stock.",
        tone: "mint" as const,
      };
    case "booper-disabled":
      return {
        message: "Booper marked as disabled.",
        tone: "mint" as const,
      };
    case "booper-lost":
      return {
        message: "Booper marked as lost.",
        tone: "mint" as const,
      };
    case "booper-status-updated":
      return {
        message: "Booper status updated.",
        tone: "mint" as const,
      };
    case "family-viewed":
      return {
        message: "Family details opened in super admin.",
        tone: "sky" as const,
      };
    case "subscription-saved":
      return {
        message: "Subscription saved.",
        tone: "mint" as const,
      };
    case "uid-import-failed":
      return {
        message: "The UID CSV could not be imported. Check the batch number, CSV data, and UID format.",
        tone: "rose" as const,
      };
    case "task-asset-uploaded": {
      const taskName =
        typeof searchParams?.taskName === "string" ? searchParams.taskName : "that task";

      return {
        message: `Task assets uploaded for ${taskName}. The task wizard will discover it automatically.`,
        tone: "mint" as const,
      };
    }
    case "task-asset-replaced": {
      const taskName =
        typeof searchParams?.taskName === "string" ? searchParams.taskName : "that task";

      return {
        message: `Task assets replaced for ${taskName}. The updated artwork is now live.`,
        tone: "mint" as const,
      };
    }
    case "task-asset-exists": {
      const taskName =
        typeof searchParams?.taskName === "string" ? searchParams.taskName : "That task";
      const category =
        typeof searchParams?.category === "string" ? searchParams.category : "the selected category";

      return {
        message: `${taskName} already exists in ${category}. Tick replace to overwrite both images.`,
        tone: "sun" as const,
      };
    }
    case "task-asset-name-invalid":
      return {
        message: "Task names cannot use slashes or reserved filename characters.",
        tone: "rose" as const,
      };
    case "task-asset-file-invalid":
      return {
        message: "Both task asset uploads must be valid image files that can be converted into PNG task assets.",
        tone: "rose" as const,
      };
    case "task-asset-upload-failed":
      return {
        message: "The task assets could not be saved. Check the files and try again.",
        tone: "rose" as const,
      };
    case "booper-conflict":
      return {
        message: "That booper could not be reassigned cleanly. Review the current family link and try again.",
        tone: "rose" as const,
      };
    case "action-failed":
      return {
        message: "The last super admin action could not be completed.",
        tone: "rose" as const,
      };
    default:
      return null;
  }
}
