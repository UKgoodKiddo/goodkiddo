import { z } from "zod";

export const WORRY_BOX_MAX_CHARS = 280;
export const WORRY_BOX_STORAGE_VERSION = 1;

const fallbackParentScope = "device";

const localWorryEntrySchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  text: z.string().min(1).max(WORRY_BOX_MAX_CHARS),
});

const localWorryBoxStateSchema = z.object({
  version: z.literal(WORRY_BOX_STORAGE_VERSION),
  worries: z.array(localWorryEntrySchema),
});

export type LocalWorryEntry = z.infer<typeof localWorryEntrySchema>;
export type LocalWorryBoxState = z.infer<typeof localWorryBoxStateSchema>;

export function createEmptyLocalWorryBoxState(): LocalWorryBoxState {
  return {
    version: WORRY_BOX_STORAGE_VERSION,
    worries: [],
  };
}

export function createWorryBoxStorageKey(parentStorageId?: string | null) {
  const normalizedParentStorageId = parentStorageId?.trim() || fallbackParentScope;

  return `goodkiddo:worry-box:${normalizedParentStorageId}`;
}

function normalizeLegacyEntries(entries: unknown[]) {
  return entries.flatMap((entry) => {
    const parsedEntry = localWorryEntrySchema.safeParse(entry);

    return parsedEntry.success ? [parsedEntry.data] : [];
  });
}

function migrateStoredWorryState(parsed: unknown): LocalWorryBoxState | null {
  if (Array.isArray(parsed)) {
    return {
      version: WORRY_BOX_STORAGE_VERSION,
      worries: normalizeLegacyEntries(parsed),
    };
  }

  if (typeof parsed !== "object" || parsed === null || !("worries" in parsed)) {
    return null;
  }

  const worries = normalizeLegacyEntries(
    Array.isArray(parsed.worries) ? parsed.worries : [],
  );

  return {
    version: WORRY_BOX_STORAGE_VERSION,
    worries,
  };
}

export function getClientStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const probeKey = "__goodkiddo_worry_box_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);

    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalWorryBoxState(storage: Storage | null, storageKey: string) {
  const emptyState = createEmptyLocalWorryBoxState();

  if (!storage) {
    return {
      recoveredFromInvalidData: false,
      state: emptyState,
      storageAvailable: false,
    };
  }

  try {
    const rawState = storage.getItem(storageKey);

    if (!rawState) {
      return {
        recoveredFromInvalidData: false,
        state: emptyState,
        storageAvailable: true,
      };
    }

    const parsedState = JSON.parse(rawState) as unknown;
    const validatedState = localWorryBoxStateSchema.safeParse(parsedState);

    if (validatedState.success) {
      return {
        recoveredFromInvalidData: false,
        state: validatedState.data,
        storageAvailable: true,
      };
    }

    const migratedState = migrateStoredWorryState(parsedState);

    return {
      recoveredFromInvalidData: true,
      state: migratedState ?? emptyState,
      storageAvailable: true,
    };
  } catch {
    return {
      recoveredFromInvalidData: true,
      state: emptyState,
      storageAvailable: true,
    };
  }
}

export function writeLocalWorryBoxState(
  storage: Storage | null,
  storageKey: string,
  state: LocalWorryBoxState,
) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
