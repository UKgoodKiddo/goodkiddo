export function normalizeUid(uid: string): string {
  return uid.trim().replace(/:/g, "").replace(/\s+/g, "").toUpperCase();
}

export function areUidsEqual(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) {
    return false;
  }

  return normalizeUid(left) === normalizeUid(right);
}

export function isNormalizedUidValid(uid: string) {
  return /^[A-Z0-9_-]{4,120}$/.test(normalizeUid(uid));
}
